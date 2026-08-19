import { authenticateRequest } from "../_lib/auth.mjs";
import { readAppleEnvironment } from "../_lib/env.mjs";
import { assertOriginAllowed, corsHeaders, errorResponse, HttpError, readJson, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import { isStripeEntitlementCurrent } from "../_lib/stripe.mjs";

export async function handleApplePurchaseIntent(request, dependencies = {}) {
  const environment = dependencies.environment ?? readAppleEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    if (!["POST", "DELETE"].includes(request.method)) throw new HttpError(405, "method_not_allowed", "POST or DELETE is required");
    const user = await (dependencies.authenticate ?? authenticateRequest)(request, environment, dependencies.fetchImpl);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    if (request.method === "DELETE") {
      await store.releaseCheckout(user.id, request.signal);
      return Response.json({ released: true }, { headers: corsHeaders(origin, environment.publicOrigins) });
    }
    const payload = await readJson(request);
    if (!payload || !["monthly", "annual"].includes(payload.plan)) {
      throw new HttpError(400, "invalid_plan", "Choose monthly or annual");
    }
    const entitlement = await store.getEntitlement(user.id, request.signal);
    if (isStripeEntitlementCurrent(entitlement)) {
      throw new HttpError(409, "already_subscribed", "An active membership already exists");
    }
    if (!await store.reserveCheckout(user.id, payload.plan, request.signal)) {
      throw new HttpError(409, "checkout_in_progress", "A purchase is already in progress");
    }
    return Response.json({ ready: true }, { headers: corsHeaders(origin, environment.publicOrigins) });
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
  const body = request.method === "POST"
    ? (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}))
    : undefined;
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/apple-purchase-intent"}`, { method: request.method, headers, body });
}

export default async function handler(request, response) {
  const result = await handleApplePurchaseIntent(toWebRequest(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
