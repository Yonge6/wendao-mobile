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
    const remainingQuestions = Math.max(0, 3 - (input.usage?.usedQuestions ?? 0));
    return {
      allowed: remainingQuestions > 0,
      reason: remainingQuestions > 0 ? "daily_free" : "daily_free_limit_reached",
      unlimited: false,
      remainingQuestions,
    };
  }
  return { allowed: true, reason: "active", unlimited: true };
}
