import type {
  CompanionAccess,
  CompanionEntitlement,
  CompanionUsage,
} from "./types";

type AccessInput = {
  isSignedIn: boolean;
  entitlement: CompanionEntitlement | null;
  usage: CompanionUsage | null;
};

export function remainingQuestions(usage: CompanionUsage): number {
  return Math.max(0, usage.questionAllowance - usage.usedQuestions);
}

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
    return { allowed: false, reason: "signed_out", remainingQuestions: null };
  }

  if (!hasCurrentEntitlement(input.entitlement, now)) {
    return {
      allowed: false,
      reason: "subscription_required",
      remainingQuestions: null,
    };
  }

  const remaining = input.usage ? remainingQuestions(input.usage) : 0;
  if (remaining === 0) {
    return {
      allowed: false,
      reason: "quota_exhausted",
      remainingQuestions: 0,
    };
  }

  return { allowed: true, reason: "active", remainingQuestions: remaining };
}

