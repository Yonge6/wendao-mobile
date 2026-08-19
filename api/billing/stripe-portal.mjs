import { authenticateRequest } from "../_lib/auth.mjs";
import { readStripeCheckoutEnvironment } from "../_lib/env.mjs";
import { assertOriginAllowed, corsHeaders, errorResponse, HttpError, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import { createStripeClient } from "../_lib/stripe.mjs";

export async function handleStripePortal(request, dependencies = {}) {
  const environment = dependencies.environment ?? readStripeCheckoutEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed", "POST is required");
    const user = await (dependencies.authenticate ?? authenticateRequest)(request, environment, dependencies.fetchImpl);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    const entitlement = await store.getEntitlement(user.id, request.signal);
    if (entitlement?.source !== "stripe" || !entitlement.provider_customer_id) {
      throw new HttpError(409, "stripe_membership_not_found", "No Stripe membership is linked to this account");
    }
    const stripe = createStripeClient(environment, dependencies);
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlement.provider_customer_id,
      return_url: `${origin}/?companion=membership`,
    });
    if (!session?.url) throw new HttpError(503, "billing_unavailable", "Billing portal is unavailable");
    return Response.json({ url: session.url }, { headers: corsHeaders(origin, environment.publicOrigins) });
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
  return new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/billing/stripe-portal"}`, { method: request.method, headers });
}

export default async function handler(request, response) {
  const result = await handleStripePortal(toWebRequest(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
