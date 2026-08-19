import { authenticateRequest } from "../_lib/auth.mjs";
import { readAccountEnvironment } from "../_lib/env.mjs";
import { assertOriginAllowed, corsHeaders, errorResponse, HttpError, readJson, requestId } from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import { createStripeClient } from "../_lib/stripe.mjs";

export async function handleCompanionAccount(request, dependencies = {}) {
  const environment = dependencies.environment ?? readAccountEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    if (!["GET", "DELETE"].includes(request.method)) throw new HttpError(405, "method_not_allowed", "GET or DELETE is required");
    const user = await (dependencies.authenticate ?? authenticateRequest)(request, environment, dependencies.fetchImpl);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    if (request.method === "GET") {
      const data = await store.getAccountExport(user.id, request.signal);
      return Response.json({ exportedAt: new Date().toISOString(), data }, { headers: corsHeaders(origin, environment.publicOrigins) });
    }

    const payload = await readJson(request);
    if (payload?.confirmation !== "DELETE") {
      throw new HttpError(400, "deletion_not_confirmed", "Type DELETE to confirm account deletion");
    }
    const entitlement = await store.getEntitlement(user.id, request.signal);
    if (entitlement?.source === "stripe" && entitlement.provider_subscription_id) {
      if (!environment.stripeSecretKey) {
        throw new HttpError(503, "subscription_cancellation_unavailable", "Subscription cancellation is temporarily unavailable");
      }
      const stripe = createStripeClient(environment, dependencies);
      await stripe.subscriptions.cancel(entitlement.provider_subscription_id);
    }
    await store.deleteAuthUser(user.id, request.signal);
    return Response.json({ deleted: true, appleSubscriptionMayContinue: entitlement?.source === "apple" }, {
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
  const body = request.method === "DELETE"
    ? (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}))
    : undefined;
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://${headers.get("host") ?? "wendao.wonderelian.com"}${request.url ?? "/api/companion/account"}`, { method: request.method, headers, body });
}

export default async function handler(request, response) {
  const result = await handleCompanionAccount(toWebRequest(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(await result.text());
}
