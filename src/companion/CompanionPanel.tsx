import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CompanionAuth from "./CompanionAuth";
import SubscriptionPanel from "./SubscriptionPanel";
import { companionClient, companionPublicConfig } from "./client";
import { streamCompanionAnswer } from "./api";
import MemoryPanel from "./MemoryPanel";

type CompanionPanelProps = {
  language: "zh" | "en";
  chapterId: number;
  initialQuestion?: string;
};

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  chapterId,
  initialQuestion,
  onSignOut,
}: CompanionPanelProps & { session: Session; onSignOut: () => Promise<void> }) {
  const [state, setState] = useState<CompanionState | null>(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [view, setView] = useState<"conversation" | "memory">("conversation");
  const abortRef = useRef<AbortController | null>(null);
  const isZh = language === "zh";

  useEffect(() => {
    if (initialQuestion) setQuestion(initialQuestion);
  }, [initialQuestion]);

  useEffect(() => () => abortRef.current?.abort(), []);

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

  if (view === "memory") {
    return <MemoryPanel session={session} language={language} onBack={() => setView("conversation")} />;
  }

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    const config = companionPublicConfig();
    if (!nextQuestion || !config || asking) return;
    const id = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setQuestion("");
    setError("");
    setAsking(true);
    setMessages((current) => [
      ...current,
      { id, role: "user", content: nextQuestion },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamCompanionAnswer({
        apiUrl: config.apiUrl,
        accessToken: session.access_token,
        requestId: id,
        threadId,
        chapterId,
        locale: language,
        question: nextQuestion,
        signal: controller.signal,
        handlers: {
          delta: ({ text }) => setMessages((current) => current.map((message) => (
            message.id === assistantId
              ? { ...message, content: message.content + text }
              : message
          ))),
          done: (payload) => {
            if (typeof payload.threadId === "string") setThreadId(payload.threadId);
            if (typeof payload.remainingQuestions === "number") {
              const nextRemaining = payload.remainingQuestions;
              setState((current) => current ? {
                ...current,
                usage: {
                  question_allowance: current.usage?.question_allowance
                    ?? nextRemaining + 1,
                  used_questions: (current.usage?.question_allowance
                    ?? nextRemaining + 1) - nextRemaining,
                },
              } : current);
            }
          },
          error: ({ message }) => {
            throw new Error(message || (isZh ? "回答暂时中断，请稍后再试。" : "The answer was interrupted. Please try again."));
          },
        },
      });
    } catch (nextError) {
      if (!controller.signal.aborted) {
        setError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法回答。" : "Unable to answer right now."));
        setMessages((current) => current.filter((message) => message.id !== assistantId || message.content));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setAsking(false);
    }
  };

  return (
    <section className="companion-home">
      <header>
        <span className="drawer-kicker">{isZh ? "我的问道" : "My Wendao"}</span>
        <h3>{isZh ? "我们从你真正关心的地方继续。" : "Let us continue from what genuinely matters to you."}</h3>
        <p>{remaining === null
          ? (isZh ? "本月额度将在第一次提问时显示。" : "This month’s allowance appears with your first question.")
          : (isZh ? `本月还可提问 ${remaining} 次` : `${remaining} questions remain this month`)}</p>
      </header>
      {initialQuestion && messages.length === 0 ? (
        <div className="companion-pending-question">
          <span>{isZh ? "你刚才想问" : "You wanted to ask"}</span>
          <p>{initialQuestion}</p>
        </div>
      ) : null}
      {messages.length ? (
        <div className="companion-conversation" aria-live="polite">
          {messages.map((message) => (
            <article className={`is-${message.role}`} key={message.id}>
              <span>{message.role === "user" ? (isZh ? "你" : "You") : (isZh ? "问道同行" : "Wendao")}</span>
              <p>{message.content || (isZh ? "正在思考…" : "Reflecting…")}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="companion-sections" aria-label={isZh ? "问道同行能力" : "Companion features"}>
          <div><strong>{isZh ? "从这一章开始" : "Begin with this chapter"}</strong><small>{isZh ? "原文、今译与本章主旨会成为回答依据" : "Source text and chapter focus ground the answer"}</small></div>
          <div><strong>{isZh ? "记住真正重要的事" : "Remember what truly matters"}</strong><small>{state.memoryEnabled ? (isZh ? "自动记忆已开启，可随时管理" : "Automatic memory is on and always manageable") : (isZh ? "自动记忆已暂停" : "Automatic memory is paused")}</small></div>
        </div>
      )}
      <form className="companion-question-form" onSubmit={ask}>
        <label htmlFor="companion-question">{isZh ? "此刻，你真正想问什么？" : "What do you genuinely want to ask now?"}</label>
        <textarea
          id="companion-question"
          maxLength={2000}
          rows={4}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={isZh ? "写下一个具体处境、矛盾或选择…" : "Describe one situation, tension, or choice…"}
          disabled={asking || remaining === 0}
        />
        <button type="submit" disabled={asking || !question.trim() || remaining === 0}>
          {asking ? (isZh ? "正在回应…" : "Responding…") : (isZh ? "问这一章" : "Ask this chapter")}
        </button>
      </form>
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
      {remaining === 0 ? <p className="companion-error">{isZh ? "本月问答额度已用完。" : "This month’s question allowance has been used."}</p> : null}
      <div className="companion-home-actions">
        <button className="companion-text-button" type="button" onClick={() => setView("memory")}>{isZh ? "管理自动记忆" : "Manage memory"}</button>
        {asking ? <button className="companion-text-button" type="button" onClick={() => abortRef.current?.abort()}>{isZh ? "停止回答" : "Stop response"}</button> : null}
        <button className="companion-text-button" type="button" onClick={() => void onSignOut()}>{isZh ? "退出当前账号" : "Sign out"}</button>
      </div>
    </section>
  );
}

export default function CompanionPanel({ language, chapterId, initialQuestion }: CompanionPanelProps) {
  return (
    <CompanionAuth language={language}>
      {(session, signOut) => (
        <SignedInCompanion
          session={session}
          language={language}
          chapterId={chapterId}
          initialQuestion={initialQuestion}
          onSignOut={signOut}
        />
      )}
    </CompanionAuth>
  );
}
