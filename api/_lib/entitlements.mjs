import { HttpError } from "./http.mjs";

export function entitlementIsCurrent(entitlement, now = new Date()) {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  const expiry = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiry) && expiry > now.getTime();
}

export function assertCompanionAccess(entitlement, _usage, now = new Date()) {
  if (!entitlementIsCurrent(entitlement, now)) {
    throw new HttpError(402, "subscription_required", "Wendao Companion is required");
  }
  return { unlimited: true };
}
