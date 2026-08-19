import type { CompanionAccess, CompanionEntitlement } from "./types";

type AccessInput = {
  isSignedIn: boolean;
  entitlement: CompanionEntitlement | null;
  usage?: { usedQuestions: number } | null;
};

function hasCurrentEntitlement(
  entitlement: CompanionEntitlement | null,
  now: Date,
): boolean {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) {
    return false;
  }

  if (!entitlement.expiresAt) {
    return entitlement.status === "active";
  }

  const expiresAt = Date.parse(entitlement.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

export function getCompanionAccess(
  input: AccessInput,
  now = new Date(),
): CompanionAccess {
  if (!input.isSignedIn) {
    return { allowed: false, reason: "signed_out", unlimited: false };
  }

  if (!hasCurrentEntitlement(input.entitlement, now)) {
    return {
      allowed: false,
      reason: "subscription_required",
      unlimited: false,
    };
  }
  return { allowed: true, reason: "active", unlimited: true };
}
