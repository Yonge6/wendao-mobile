import { authenticateRequest } from "../_lib/auth.mjs";
import { readStripeCheckoutEnvironment } from "../_lib/env.mjs";
import {
  assertOriginAllowed,
  corsHeaders,
  errorResponse,
  HttpError,
  readJson,
  requestId,
} from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import { createStripeClient, isStripeEntitlementCurrent } from "../_lib/stripe.mjs";

const PLAN_IDS = Object.freeze({ monthly: "wendao_companion_monthly", annual: "wendao_companion_annual" });

function checkoutUrls(origin) {
  return {
    success: `${origin}/?companion=billing-success&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${origin}/?companion=billing-cancelled`,
  };
}

export async function handleStripeCheckout(request, dependencies = {}) {
  const environment = dependencies.environment ?? readStripeCheckoutEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    }
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "POST is required");
    const user = await (dependencies.authenticate ?? authenticateRequest)(request, environment, dependencies.fetchImpl);
    const payload = await readJson(request);
    if (!payload || !["monthly", "annual"].includes(payload.plan)) {
      throw new HttpError(400, "invalid_plan", "Choose monthly or annual");
    }
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    const entitlement = await store.getEntitlement(user.id, request.signal);
    if (isStripeEntitlementCurrent(entitlement)) {
      throw new HttpError(409, "already_subscribed", "An active membership already exists");
    }
    if (!await store.reserveCheckout(user.id, payload.plan, request.signal)) {
      throw new HttpError(409, "checkout_in_progress", "A checkout is already in progress");
    }

    const stripe = createStripeClient(environment, dependencies);
    const price = payload.plan === "annual"
      ? environment.stripeAnnualPriceId
      : environment.stripeMonthlyPriceId;
    const urls = checkoutUrls(origin);
    const parameters = {
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { wendao_user_id: user.id, wendao_plan: PLAN_IDS[payload.plan] },
      subscription_data: {
        metadata: { wendao_user_id: user.id, wendao_plan: PLAN_IDS[payload.plan] },
      },
      success_url: urls.success,
      cancel_url: urls.cancel,
    };
    if (entitlement?.source === "stripe" && entitlement.provider_customer_id) {
      parameters.customer = entitlement.provider_customer_id;
    }
    let session;
    try {
      session = await stripe.checkout.sessions.create(parameters, {
        idempotencyKey: `wendao-checkout-${user.id}-${payload.plan}`,
      });
    } catch (error) {
      await store.releaseCheckout(user.id, request.signal).catch(() => undefined);
      throw error;
    }
    if (!session?.url) throw new HttpError(503, "billing_unavailable", "Checkout is unavailable");
    return Response.json({ url: session.url }, {
      status: 200,
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
  return new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/stripe-checkout"}`, {
    method: request.method,
    headers,
    body,
  });
}

export default async function handler(request, response) {
  const result = await handleStripeCheckout(toWebRequest(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
