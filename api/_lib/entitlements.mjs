import { HttpError } from "./http.mjs";

export function entitlementIsCurrent(entitlement, now = new Date()) {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  const expiry = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiry) && expiry > now.getTime();
}

export function assertCompanionAccess(entitlement, usage, now = new Date()) {
  if (!entitlementIsCurrent(entitlement, now)) {
    throw new HttpError(402, "subscription_required", "Wendao Companion is required");
  }

  const allowance = Number(usage?.question_allowance ?? 0);
  const used = Number(usage?.used_questions ?? 0);
  const remaining = Math.max(0, allowance - used);
  if (remaining === 0) {
    throw new HttpError(429, "quota_exhausted", "Monthly question allowance reached");
  }
  return { remainingQuestions: remaining };
}

