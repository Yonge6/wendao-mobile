import {
  createAppleVerifiers,
  normalizeAppleTransaction,
  verifyAppleNotification,
} from "../_lib/apple.mjs";
import { billingPayloadHash } from "../_lib/billing.mjs";
import { readAppleEnvironment } from "../_lib/env.mjs";
import { errorResponse, HttpError, readJson, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";

export async function handleAppleNotification(request, dependencies = {}) {
  const environment = dependencies.environment ?? readAppleEnvironment(process.env);
  const id = requestId(request);
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "POST is required");
    const payload = await readJson(request);
    if (typeof payload?.signedPayload !== "string" || payload.signedPayload.length > 80_000) {
      throw new HttpError(400, "invalid_apple_notification", "Invalid App Store notification");
    }
    const verifiers = createAppleVerifiers(environment, dependencies);
    const { decoded, verifier } = await verifyAppleNotification(verifiers, payload.signedPayload);
    const signedTransaction = decoded?.data?.signedTransactionInfo;
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    if (!signedTransaction) {
      const processed = await store.processBillingEvent({
        provider: "apple",
        providerEventId: decoded.notificationUUID,
        eventType: decoded.notificationType ?? "TEST",
        payloadHash: billingPayloadHash(payload.signedPayload),
      }, request.signal);
      return Response.json({ received: true, processed });
    }
    let transaction;
    try {
      transaction = await verifier.verifyAndDecodeTransaction(signedTransaction);
    } catch {
      throw new HttpError(400, "invalid_apple_signature", "Invalid App Store signature");
    }
    const event = normalizeAppleTransaction(transaction, decoded);
    if (!event.userId) {
      event.userId = await store.findAppleUserByOriginalTransaction(event.subscriptionId, request.signal);
    }
    const processed = await store.processBillingEvent({
      ...event,
      payloadHash: billingPayloadHash(payload.signedPayload),
    }, request.signal);
    return Response.json({ received: true, processed });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export default async function handler(request, response) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (Array.isArray(value)) headers.set(name, value.join(", "));
    else if (value !== undefined) headers.set(name, String(value));
  }
  const body = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  const webRequest = new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/apple-notifications"}`, { method: request.method, headers, body });
  const result = await handleAppleNotification(webRequest);
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
