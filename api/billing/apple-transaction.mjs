import { authenticateRequest } from "../_lib/auth.mjs";
import { billingPayloadHash } from "../_lib/billing.mjs";
import {
  createAppleVerifiers,
  normalizeAppleTransaction,
  verifyAppleTransaction,
} from "../_lib/apple.mjs";
import { readAppleEnvironment } from "../_lib/env.mjs";
import { assertOriginAllowed, corsHeaders, errorResponse, HttpError, readJson, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";

export async function handleAppleTransaction(request, dependencies = {}) {
  const environment = dependencies.environment ?? readAppleEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "POST is required");
    const user = await (dependencies.authenticate ?? authenticateRequest)(request, environment, dependencies.fetchImpl);
    const payload = await readJson(request);
    if (typeof payload?.signedTransaction !== "string" || payload.signedTransaction.length > 40_000) {
      throw new HttpError(400, "invalid_apple_transaction", "Invalid App Store transaction");
    }
    const verifiers = createAppleVerifiers(environment, dependencies);
    const { decoded } = await verifyAppleTransaction(verifiers, payload.signedTransaction);
    const event = normalizeAppleTransaction(decoded);
    if (event.userId?.toLowerCase() !== user.id.toLowerCase()) {
      throw new HttpError(403, "apple_account_mismatch", "This purchase belongs to another account");
    }
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    const processed = await store.processBillingEvent({
      ...event,
      userId: user.id,
      payloadHash: billingPayloadHash(payload.signedTransaction),
    }, request.signal);
    return Response.json({ verified: true, processed, entitlement: event.status }, {
      headers: corsHeaders(origin, environment.publicOrigins),
    });
  } catch (error) {
    return errorResponse(error, id, { origin, allowedOrigins: environment.publicOrigins });
  }
}

function toWebRequest(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (Array.isArray(value)) headers.set(name, value.join(", "));
    else if (value !== undefined) headers.set(name, String(value));
  }
  const body = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/apple-transaction"}`, { method: request.method, headers, body });
}

export default async function handler(request, response) {
  const result = await handleAppleTransaction(toWebRequest(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
