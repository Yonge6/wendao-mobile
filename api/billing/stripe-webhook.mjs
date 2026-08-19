import { readStripeWebhookEnvironment } from "../_lib/env.mjs";
import { errorResponse, HttpError, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import {
  createStripeClient,
  normalizeStripeEvent,
  stripePayloadHash,
} from "../_lib/stripe.mjs";

const MAX_WEBHOOK_BYTES = 1_000_000;

export async function handleStripeWebhook(request, dependencies = {}) {
  const environment = dependencies.environment ?? readStripeWebhookEnvironment(process.env);
  const id = requestId(request);
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "POST is required");
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new HttpError(400, "missing_signature", "Missing Stripe signature");
    const rawBody = await request.text();
    if (!rawBody || Buffer.byteLength(rawBody) > MAX_WEBHOOK_BYTES) {
      throw new HttpError(400, "invalid_webhook_body", "Invalid webhook body");
    }
    const stripe = createStripeClient(environment, dependencies);
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        environment.stripeWebhookSecret,
      );
    } catch {
      throw new HttpError(400, "invalid_signature", "Invalid Stripe signature");
    }

    const normalized = normalizeStripeEvent(event);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    if (!normalized.userId && normalized.customerId) {
      normalized.userId = await store.findStripeUserByCustomer(normalized.customerId, request.signal);
    }
    const processed = await store.processBillingEvent({
      ...normalized,
      payloadHash: stripePayloadHash(rawBody),
    }, request.signal);
    return Response.json({ received: true, processed });
  } catch (error) {
    return errorResponse(error, id);
  }
}

async function rawNodeBody(request) {
  if (Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === "string") return Buffer.from(request.body);
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_WEBHOOK_BYTES) throw new HttpError(400, "invalid_webhook_body", "Invalid webhook body");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export const config = { api: { bodyParser: false } };

export default async function handler(request, response) {
  let result;
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers ?? {})) {
      if (Array.isArray(value)) headers.set(name, value.join(", "));
      else if (value !== undefined) headers.set(name, String(value));
    }
    const rawBody = await rawNodeBody(request);
    const webRequest = new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/stripe-webhook"}`, {
      method: request.method,
      headers,
      body: rawBody,
    });
    result = await handleStripeWebhook(webRequest);
  } catch (error) {
    result = errorResponse(error, "stripe-webhook");
  }
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
