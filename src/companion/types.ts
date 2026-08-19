export type CompanionLocale = "zh" | "en";

export type EntitlementStatus =
  | "none"
  | "active"
  | "grace"
  | "past_due"
  | "expired"
  | "revoked";

export type CompanionEntitlement = {
  status: EntitlementStatus;
  expiresAt: string | null;
};

export type CompanionUsage = {
  questionAllowance: number;
  usedQuestions: number;
};

export type CompanionAccessReason =
  | "active"
  | "signed_out"
  | "subscription_required"
  | "quota_exhausted";

export type CompanionAccess = {
  allowed: boolean;
  reason: CompanionAccessReason;
  remainingQuestions: number | null;
};

export type MemoryKind =
  | "current_situation"
  | "recurring_theme"
  | "preference_boundary"
  | "practice_outcome"
  | "life_manual_context";

export type MemoryStatus = "active" | "resolved" | "expired";

export type MemoryCandidate = {
  kind: MemoryKind;
  summary: string;
  confidence?: number;
  occurredAt?: string | null;
  expiresAt?: string | null;
};

export type CompanionMemoryState = {
  status: MemoryStatus;
  expiresAt: string | null;
};

