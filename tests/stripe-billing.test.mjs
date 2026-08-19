import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { readStripeCheckoutEnvironment, readStripeWebhookEnvironment } from "../api/_lib/env.mjs";
import { normalizeStripeEvent } from "../api/_lib/stripe.mjs";
import { handleStripeCheckout } from "../api/billing/stripe-checkout.mjs";
import { handleStripePortal } from "../api/billing/stripe-portal.mjs";
import { handleStripeWebhook } from "../api/billing/stripe-webhook.mjs";

const userId = "11111111-1111-4111-8111-111111111111";
const environment = {
  publicOrigins: ["https://wendao.wonderelian.com"],
  stripeSecretKey: "sk_test_secret",
  stripeWebhookSecret: "whsec_secret",
  stripeMonthlyPriceId: "price_monthly",
  stripeAnnualPriceId: "price_annual",
  requestTimeoutMs: 1000,
};

function checkoutRequest(plan = "annual") {
  return new Request("https://api.example/api/billing/stripe-checkout", {
    method: "POST",
    headers: { origin: "https://wendao.wonderelian.com", authorization: "Bearer session", "content-type": "application/json" },
    body: JSON.stringify({ plan }),
  });
}

test("Stripe environments require price and webhook configuration without DeepSeek", () => {
  const base = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    PUBLIC_ORIGINS: "https://wendao.wonderelian.com",
    STRIPE_SECRET_KEY: "sk_test_secret",
    STRIPE_PRICE_MONTHLY: "price_monthly",
    STRIPE_PRICE_ANNUAL: "price_annual",
    STRIPE_WEBHOOK_SECRET: "whsec_secret",
  };
  assert.equal(readStripeCheckoutEnvironment(base).stripeAnnualPriceId, "price_annual");
  assert.equal(readStripeWebhookEnvironment(base).stripeWebhookSecret, "whsec_secret");
});

test("checkout creates an authenticated no-trial subscription with exact plan metadata", async () => {
  let parameters;
  let options;
  const response = await handleStripeCheckout(checkoutRequest(), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: { getEntitlement: async () => null, reserveCheckout: async () => true },
    stripe: {
      checkout: { sessions: { create: async (nextParameters, nextOptions) => {
        parameters = nextParameters;
        options = nextOptions;
        return { url: "https://checkout.stripe.com/session" };
      } } },
    },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).url, "https://checkout.stripe.com/session");
  assert.equal(parameters.mode, "subscription");
  assert.deepEqual(parameters.line_items, [{ price: "price_annual", quantity: 1 }]);
  assert.equal(parameters.metadata.wendao_user_id, userId);
  assert.equal(parameters.subscription_data.metadata.wendao_plan, "wendao_companion_annual");
  assert.equal("trial_period_days" in parameters.subscription_data, false);
  assert.equal(options.idempotencyKey, `wendao-checkout-${userId}-annual`);
});

test("checkout blocks every existing active entitlement to prevent double billing", async () => {
  let called = false;
  const response = await handleStripeCheckout(checkoutRequest("monthly"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: { getEntitlement: async () => ({ status: "active", source: "apple", expires_at: "2026-09-19T00:00:00Z" }) },
    stripe: { checkout: { sessions: { create: async () => { called = true; } } } },
  });
  assert.equal(response.status, 409);
  assert.equal(called, false);
});

test("portal only opens for the owning Stripe customer", async () => {
  let parameters;
  const response = await handleStripePortal(new Request("https://api.example/api/billing/stripe-portal", {
    method: "POST",
    headers: { origin: "https://wendao.wonderelian.com", authorization: "Bearer session" },
  }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: { getEntitlement: async () => ({ source: "stripe", provider_customer_id: "cus_owner" }) },
    stripe: { billingPortal: { sessions: { create: async (next) => {
      parameters = next;
      return { url: "https://billing.stripe.com/session" };
    } } } },
  });
  assert.equal(response.status, 200);
  assert.equal(parameters.customer, "cus_owner");
});

test("normalizes subscription renewal and cancellation into unified entitlement states", () => {
  const active = normalizeStripeEvent({
    id: "evt_active",
    type: "customer.subscription.updated",
    data: { object: {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      start_date: 1_777_000_000,
      current_period_end: 1_779_000_000,
      metadata: { wendao_user_id: userId },
      items: { data: [{ price: { id: "price_annual" } }] },
    } },
  });
  assert.equal(active.status, "active");
  assert.equal(active.userId, userId);
  assert.equal(active.productId, "price_annual");
  const canceled = normalizeStripeEvent({
    id: "evt_cancel",
    type: "customer.subscription.deleted",
    data: { object: { id: "sub_1", customer: "cus_1", status: "canceled", metadata: { wendao_user_id: userId } } },
  });
  assert.equal(canceled.status, "expired");
});

test("webhook verifies the raw body and stores one hashed event", async () => {
  const raw = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
  let verifiedRaw;
  let stored;
  const response = await handleStripeWebhook(new Request("https://api.example/api/billing/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": "signed" },
    body: raw,
  }), {
    environment,
    stripe: { webhooks: { constructEventAsync: async (body) => {
      verifiedRaw = body;
      return {
        id: "evt_1",
        type: "invoice.paid",
        data: { object: { customer: "cus_1", subscription: "sub_1", lines: { data: [] } } },
      };
    } } },
    store: {
      findStripeUserByCustomer: async () => userId,
      processBillingEvent: async (event) => { stored = event; return true; },
    },
  });
  assert.equal(response.status, 200);
  assert.equal(verifiedRaw, raw);
  assert.equal(stored.userId, userId);
  assert.equal(stored.status, "active");
  assert.match(stored.payloadHash, /^[a-f0-9]{64}$/);
});

test("billing migration is idempotent, server-only, and avoids cross-provider overwrite", async () => {
  const url = new URL("../supabase/migrations/202608190006_wendao_billing_events.sql", import.meta.url);
  const sql = (await readFile(url, "utf8")).replace(/\s+/g, " ").toLowerCase();
  assert.match(sql, /on conflict \(provider, provider_event_id\) do nothing/);
  assert.match(sql, /create table public\.wendao_checkout_locks/);
  assert.match(sql, /interval '30 minutes'/);
  assert.match(sql, /'checkout\.session\.completed', 'client\.transaction\.verified'/);
  assert.match(sql, /wendao_entitlements\.source in \('none', excluded\.source\)/);
  assert.match(sql, /revoke all on function public\.process_wendao_billing_event[^;]+from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.process_wendao_billing_event[^;]+to service_role/);
});
