import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CompanionAuth from "./CompanionAuth";
import SubscriptionPanel from "./SubscriptionPanel";
import { companionClient } from "./client";

type CompanionPanelProps = {
  language: "zh" | "en";
  initialQuestion?: string;
};

type CompanionState = {
  entitlement: { status: string; expires_at: string | null } | null;
  usage: { question_allowance: number; used_questions: number } | null;
  memoryEnabled: boolean;
};

function entitlementActive(entitlement: CompanionState["entitlement"]) {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  return Date.parse(entitlement.expires_at) > Date.now();
}

function SignedInCompanion({
  session,
  language,
  initialQuestion,
  onSignOut,
}: CompanionPanelProps & { session: Session; onSignOut: () => Promise<void> }) {
  const [state, setState] = useState<CompanionState | null>(null);
  const [error, setError] = useState("");
  const isZh = language === "zh";

  const refresh = useCallback(async () => {
    const client = companionClient();
    if (!client) return;
    setError("");
    const [entitlementResult, usageResult, accountResult] = await Promise.all([
      client.from("wendao_entitlements").select("status,expires_at").eq("user_id", session.user.id).maybeSingle(),
      client.from("wendao_usage_periods").select("question_allowance,used_questions").eq("user_id", session.user.id).order("period_start", { ascending: false }).limit(1).maybeSingle(),
      client.from("wendao_accounts").select("memory_enabled").eq("user_id", session.user.id).maybeSingle(),
    ]);
    const firstError = entitlementResult.error || usageResult.error || accountResult.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }
    setState({
      entitlement: entitlementResult.data,
      usage: usageResult.data,
      memoryEnabled: accountResult.data?.memory_enabled ?? true,
    });
  }, [session.user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error) {
    return (
      <section className="companion-loading">
        <p>{isZh ? "暂时无法读取会员状态。" : "Membership status is temporarily unavailable."}</p>
        <button type="button" onClick={() => void refresh()}>{isZh ? "重新加载" : "Try again"}</button>
      </section>
    );
  }
  if (!state) {
    return <div className="companion-loading" role="status">{isZh ? "正在打开你的问道…" : "Opening your Wendao…"}</div>;
  }
  if (!entitlementActive(state.entitlement)) {
    return <SubscriptionPanel language={language} onSignOut={onSignOut} />;
  }

  const remaining = state.usage
    ? Math.max(0, state.usage.question_allowance - state.usage.used_questions)
    : null;

  return (
    <section className="companion-home">
      <header>
        <span className="drawer-kicker">{isZh ? "我的问道" : "My Wendao"}</span>
        <h3>{isZh ? "我们从你真正关心的地方继续。" : "Let us continue from what genuinely matters to you."}</h3>
        <p>{remaining === null
          ? (isZh ? "本月额度将在第一次提问时显示。" : "This month’s allowance appears with your first question.")
          : (isZh ? `本月还可提问 ${remaining} 次` : `${remaining} questions remain this month`)}</p>
      </header>
      {initialQuestion ? (
        <div className="companion-pending-question">
          <span>{isZh ? "你刚才想问" : "You wanted to ask"}</span>
          <p>{initialQuestion}</p>
        </div>
      ) : null}
      <div className="companion-sections">
        <button type="button"><strong>{isZh ? "继续对话" : "Continue a conversation"}</strong><small>{isZh ? "回到最近正在思考的事" : "Return to what you were considering"}</small></button>
        <button type="button"><strong>{isZh ? "今日与你有关" : "For you today"}</strong><small>{isZh ? "一句与当下相关的提醒" : "One gentle prompt for this moment"}</small></button>
        <button type="button"><strong>{isZh ? "这一周看见了什么" : "What this week revealed"}</strong><small>{isZh ? "回看反复主题与下一步" : "Review recurring themes and one next step"}</small></button>
        <button type="button"><strong>{isZh ? "关于我的记忆" : "What Wendao remembers"}</strong><small>{state.memoryEnabled ? (isZh ? "自动记忆已开启，可随时管理" : "Automatic memory is on and always manageable") : (isZh ? "自动记忆已暂停" : "Automatic memory is paused")}</small></button>
      </div>
      <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>{isZh ? "退出当前账号" : "Sign out"}</button>
    </section>
  );
}

export default function CompanionPanel({ language, initialQuestion }: CompanionPanelProps) {
  return (
    <CompanionAuth language={language}>
      {(session, signOut) => (
        <SignedInCompanion
          session={session}
          language={language}
          initialQuestion={initialQuestion}
          onSignOut={signOut}
        />
      )}
    </CompanionAuth>
  );
}
