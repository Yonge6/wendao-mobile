import { createHash } from "node:crypto";
import Stripe from "stripe";

import { HttpError } from "./http.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createStripeClient(environment, dependencies = {}) {
  return dependencies.stripe ?? new Stripe(environment.stripeSecretKey, {
    maxNetworkRetries: 2,
    timeout: environment.requestTimeoutMs,
  });
}

export function stripePayloadHash(rawBody) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function objectId(value) {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

function isoTimestamp(value) {
  return Number.isFinite(value) && value > 0
    ? new Date(value * 1000).toISOString()
    : null;
}

function metadataUserId(object) {
  const value = object?.metadata?.wendao_user_id
    ?? object?.subscription_details?.metadata?.wendao_user_id
    ?? object?.parent?.subscription_details?.metadata?.wendao_user_id;
  return typeof value === "string" && UUID.test(value) ? value : null;
}

function firstPriceId(object) {
  return object?.items?.data?.[0]?.price?.id
    ?? object?.lines?.data?.[0]?.price?.id
    ?? object?.lines?.data?.[0]?.pricing?.price_details?.price
    ?? null;
}

function latestLinePeriodEnd(object) {
  const values = (object?.lines?.data ?? [])
    .map((line) => line?.period?.end)
    .filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) : null;
}

function subscriptionStatus(status) {
  if (["active", "trialing"].includes(status)) return "active";
  if (["past_due", "unpaid", "paused"].includes(status)) return "past_due";
  if (["canceled", "incomplete_expired"].includes(status)) return "expired";
  return "none";
}

export function normalizeStripeEvent(event) {
  const object = event?.data?.object;
  if (!event?.id || !event?.type || !object) {
    throw new HttpError(400, "invalid_stripe_event", "Invalid Stripe event");
  }

  const base = {
    provider: "stripe",
    providerEventId: event.id,
    eventType: event.type,
    userId: metadataUserId(object),
    customerId: objectId(object.customer),
    subscriptionId: null,
    productId: null,
    startsAt: null,
    expiresAt: null,
    status: null,
  };

  if (event.type === "checkout.session.completed") {
    return {
      ...base,
      subscriptionId: objectId(object.subscription),
      status: ["paid", "no_payment_required"].includes(object.payment_status)
        ? "active"
        : null,
    };
  }

  if (event.type.startsWith("customer.subscription.")) {
    return {
      ...base,
      subscriptionId: object.id,
      productId: firstPriceId(object),
      startsAt: isoTimestamp(object.start_date),
      expiresAt: isoTimestamp(object.current_period_end),
      status: event.type === "customer.subscription.deleted"
        ? "expired"
        : subscriptionStatus(object.status),
    };
  }

  if (["invoice.paid", "invoice.payment_failed"].includes(event.type)) {
    return {
      ...base,
      subscriptionId: objectId(object.subscription)
        ?? objectId(object.parent?.subscription_details?.subscription),
      productId: firstPriceId(object),
      expiresAt: isoTimestamp(latestLinePeriodEnd(object)),
      status: event.type === "invoice.paid" ? "active" : "past_due",
    };
  }

  if (event.type === "charge.refunded" && object.amount_refunded >= object.amount) {
    return { ...base, status: "revoked" };
  }

  return base;
}

export function isStripeEntitlementCurrent(entitlement, now = new Date()) {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  const expiresAt = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}
