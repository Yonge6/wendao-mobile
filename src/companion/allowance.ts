import type { SupabaseClient } from "@supabase/supabase-js";
import { membershipEntitlementIsActive } from "../readingAccess";

export type CompanionPlan = "monthly" | "annual" | "lifetime";

export type CompanionAllowanceState = {
  entitlement: { status: string; source: string; expires_at: string | null } | null;
  remainingFreeQuestions: number;
  periodStart: string;
  nextResetAt: string;
};

export type CompanionAccessSnapshot = {
  status: "signed_out" | "loading" | "ready" | "error";
  isMember: boolean;
  remainingFreeQuestions: number | null;
  nextResetAt: string | null;
};

export class CompanionAccessError extends Error {
  kind: "membership" | "allowance" | "unavailable";

  constructor(kind: CompanionAccessError["kind"]) {
    super(`COMPANION_${kind.toUpperCase()}_UNAVAILABLE`);
    this.kind = kind;
  }
}

export function companionUtcPeriod(now = new Date()) {
  const periodStart = now.toISOString().slice(0, 10);
  const nextResetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
  return { periodStart, nextResetAt };
}

export function companionAccessSnapshot(state: CompanionAllowanceState | null, error = false): CompanionAccessSnapshot {
  return {
    status: error ? "error" : state ? "ready" : "loading",
    isMember: state ? membershipEntitlementIsActive(state.entitlement) : false,
    remainingFreeQuestions: error ? null : state?.remainingFreeQuestions ?? null,
    nextResetAt: state?.nextResetAt ?? null,
  };
}

// Read both account rights and today's server reservations. A failed query is
// unknown access, never a zero-use/free allowance or an inactive membership.
export async function loadCompanionAllowance(
  client: SupabaseClient | null,
  userId: string,
  signal?: AbortSignal,
  now: () => Date = () => new Date(),
): Promise<CompanionAllowanceState> {
  if (!client) throw new CompanionAccessError("unavailable");
  if (signal?.aborted) throw signal.reason ?? new Error("ABORTED");
  // iOS 16 WebKit does not expose AbortSignal.any/timeout. Link cancellation
  // manually, and settle even if the native fetch transport ignores abort.
  const controller = new AbortController();
  let rejectStopped!: (error: unknown) => void;
  const stopped = new Promise<never>((_resolve, reject) => { rejectStopped = reject; });
  const cancel = () => {
    controller.abort();
    rejectStopped(signal?.reason ?? new Error("ABORTED"));
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    controller.abort();
    rejectStopped(new CompanionAccessError("unavailable"));
  }, 10_000);
  try {
    while (true) {
      const period = companionUtcPeriod(now());
      const [entitlementResult, usageResult] = await Promise.race([
        Promise.all([
          client.from("wendao_entitlements").select("status,source,expires_at").eq("user_id", userId).abortSignal(controller.signal).maybeSingle(),
          client.from("wendao_usage_periods").select("question_allowance,used_questions").eq("user_id", userId).eq("period_start", period.periodStart).abortSignal(controller.signal).maybeSingle(),
        ]),
        stopped,
      ]);
      if (signal?.aborted) throw signal.reason ?? new Error("ABORTED");
      if (entitlementResult.error) throw new CompanionAccessError("membership");
      if (usageResult.error) throw new CompanionAccessError("allowance");
      // A lookup spanning midnight reads the new day within the same deadline.
      if (period.periodStart !== companionUtcPeriod(now()).periodStart) continue;
      const used = Number(usageResult.data?.used_questions ?? 0);
      if (!Number.isFinite(used) || used < 0) throw new CompanionAccessError("allowance");
      return {
        entitlement: entitlementResult.data,
        remainingFreeQuestions: Math.max(0, 3 - used),
        ...period,
      };
    }
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export function formatCompanionReset(nextResetAt: string, language: "zh" | "en", now = new Date()) {
  const reset = new Date(nextResetAt);
  const sameLocalDay = reset.toDateString() === now.toDateString();
  const date = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" }).format(reset);
  const time = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(reset);
  return language === "zh"
    ? `${sameLocalDay ? "今天" : date} ${time} 恢复 3 条（当地时间）`
    : `3 questions reset ${sameLocalDay ? "today" : date} at ${time} (local time)`;
}
