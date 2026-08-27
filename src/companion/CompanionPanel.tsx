import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CompanionAuth from "./CompanionAuth";
import SubscriptionPanel from "./SubscriptionPanel";
import { companionClient, companionPublicConfig } from "./client";
import { streamCompanionAnswer } from "./api";
import { createStripePortal } from "./api";
import MemoryPanel from "./MemoryPanel";
import WeeklyReflectionPanel from "./WeeklyReflectionPanel";
import { Capacitor } from "@capacitor/core";
import { manageStoreKit } from "./storekit";
import AccountPanel from "./AccountPanel";

type CompanionPanelProps = {
  language: "zh" | "en";
  chapterId: number;
  initialQuestion?: string;
};

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "streaming" | "error";
  retryQuestion?: string;
};

type CompanionState = {
  entitlement: { status: string; source: string; expires_at: string | null } | null;
  usage: { question_allowance: number | null; used_questions: number } | null;
  memoryEnabled: boolean;
};

function entitlementActive(entitlement: CompanionState["entitlement"]) {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  return Date.parse(entitlement.expires_at) > Date.now();
}

function friendlyCompanionError(error: unknown, isZh: boolean) {
  const message = error instanceof Error ? error.message : "";
  if (/timed out|timeout/i.test(message)) {
    return isZh
      ? "这次整理比预期更久，回答没有完整送达。可以直接重试，我会换一条更快的路径。"
      : "This response took longer than expected and did not arrive intact. Try again and I will use a faster path.";
  }
  return isZh
    ? "这次回答没有完整送达。问题已经保留，可以直接重试。"
    : "This response did not arrive intact. Your question is preserved and ready to retry.";
}

function SignedInCompanion({
  session,
  language,
  chapterId,
  initialQuestion,
  onSignOut,
}: CompanionPanelProps & { session: Session; onSignOut: () => Promise<void> }) {
  const [state, setState] = useState<CompanionState | null>(null);
  const [accessError, setAccessError] = useState("");
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preparing" | "answering" | "slow">("idle");
  const [view, setView] = useState<"conversation" | "memory" | "weekly" | "account">("conversation");
  const abortRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<number | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const isZh = language === "zh";

  useEffect(() => {
    if (initialQuestion) setQuestion(initialQuestion);
  }, [initialQuestion]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (slowTimerRef.current !== null) window.clearTimeout(slowTimerRef.current);
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    conversation.scrollTo({ top: conversation.scrollHeight, behavior: asking ? "smooth" : "auto" });
  }, [asking, messages]);

  const refresh = useCallback(async () => {
    const client = companionClient();
    if (!client) return;
    setAccessError("");
    const [entitlementResult, usageResult, accountResult] = await Promise.all([
      client.from("wendao_entitlements").select("status,source,expires_at").eq("user_id", session.user.id).maybeSingle(),
      client.from("wendao_usage_periods").select("question_allowance,used_questions").eq("user_id", session.user.id).order("period_start", { ascending: false }).limit(1).maybeSingle(),
      client.from("wendao_accounts").select("memory_enabled").eq("user_id", session.user.id).maybeSingle(),
    ]);
    const firstError = entitlementResult.error || usageResult.error || accountResult.error;
    if (firstError) {
      setAccessError(firstError.message);
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

  if (accessError && !state) {
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
  if (view === "account") {
    return (
      <AccountPanel
        session={session}
        language={language}
        entitlementSource={state.entitlement?.source ?? null}
        onBack={() => setView("conversation")}
        onSignOut={onSignOut}
      />
    );
  }
  if (!entitlementActive(state.entitlement)) {
    return <SubscriptionPanel language={language} session={session} onSignOut={onSignOut} onMembershipChanged={refresh} onOpenAccount={() => setView("account")} />;
  }

  if (view === "memory") {
    return <MemoryPanel session={session} language={language} onBack={() => setView("conversation")} />;
  }
  if (view === "weekly") {
    return <WeeklyReflectionPanel session={session} language={language} onBack={() => setView("conversation")} />;
  }

  const askQuestion = async (rawQuestion: string) => {
    const nextQuestion = rawQuestion.trim();
    const config = companionPublicConfig();
    if (!nextQuestion || !config || asking) return;
    const id = crypto.randomUUID();
    const assistantId = crypto.randomUUID();
    setQuestion("");
    setAsking(true);
    setPhase("preparing");
    setMessages((current) => [
      ...current,
      { id, role: "user", content: nextQuestion },
      { id: assistantId, role: "assistant", content: "", status: "pending" },
    ]);
    const controller = new AbortController();
    abortRef.current = controller;
    slowTimerRef.current = window.setTimeout(() => setPhase("slow"), 18_000);
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
          meta: () => setPhase("answering"),
          delta: ({ text }) => setMessages((current) => current.map((message) => (
            message.id === assistantId
              ? { ...message, content: message.content + text, status: "streaming" }
              : message
          ))),
          done: (payload) => {
            setMessages((current) => current.map((message) => (
              message.id === assistantId ? { ...message, status: undefined } : message
            )));
            if (typeof payload.threadId === "string") setThreadId(payload.threadId);
            if (typeof payload.questionsThisMonth === "number") {
              setState((current) => current ? {
                ...current,
                usage: {
                  question_allowance: null,
                  used_questions: payload.questionsThisMonth as number,
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
      const stopped = controller.signal.aborted;
      const failureMessage = stopped
        ? (isZh ? "回答已停止。你可以调整问题，也可以原样重试。" : "The response was stopped. Edit your question or retry it as written.")
        : friendlyCompanionError(nextError, isZh);
      setMessages((current) => current.map((message) => (
        message.id === assistantId
          ? { ...message, content: message.content || failureMessage, status: "error", retryQuestion: nextQuestion }
          : message
      )));
    } finally {
      if (slowTimerRef.current !== null) window.clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
      if (abortRef.current === controller) abortRef.current = null;
      setAsking(false);
      setPhase("idle");
    }
  };

  const ask = (event: FormEvent) => {
    event.preventDefault();
    void askQuestion(question);
  };

  const manageMembership = async () => {
    const config = companionPublicConfig();
    if (!config) return;
    try {
      if (Capacitor.getPlatform() === "ios" && state.entitlement?.source === "apple") {
        await manageStoreKit();
        return;
      }
      if (!Capacitor.isNativePlatform() && state.entitlement?.source === "stripe") {
        const result = await createStripePortal(config.apiUrl, session.access_token);
        window.location.assign(result.url);
      }
    } catch (nextError) {
      setAccessError(nextError instanceof Error ? nextError.message : (isZh ? "暂时无法管理订阅。" : "Unable to manage membership."));
    }
  };

  return (
    <section className="companion-home">
      <header className="companion-home-heading">
        <div className="companion-status-row">
          <span>{isZh ? "会员有效" : "Membership active"}</span>
          <span>{state.memoryEnabled ? (isZh ? "自动记忆已开启" : "Automatic memory on") : (isZh ? "自动记忆已暂停" : "Automatic memory paused")}</span>
        </div>
        <h3>{isZh ? "从你真正关心的地方，慢慢问。" : "Begin with what genuinely matters to you."}</h3>
        <p>{state.usage
          ? (isZh ? `本月已对话 ${state.usage.used_questions} 次 · 会员期内不限问答` : `${state.usage.used_questions} conversations this month · unlimited with membership`)
          : (isZh ? "会员期内不限问答" : "Unlimited questions with membership")}</p>
      </header>
      <nav className="companion-tools" aria-label={isZh ? "问道工具" : "Wendao tools"}>
        <button type="button" onClick={() => setView("weekly")}>{isZh ? "本周回看" : "Weekly"}</button>
        <button type="button" onClick={() => setView("memory")}>{isZh ? "记忆" : "Memory"}</button>
        <button type="button" onClick={() => setView("account")}>{isZh ? "账号" : "Account"}</button>
      </nav>
      {initialQuestion && messages.length === 0 ? (
        <div className="companion-pending-question">
          <span>{isZh ? "你刚才想问" : "You wanted to ask"}</span>
          <p>{initialQuestion}</p>
        </div>
      ) : null}
      <div className="companion-thread" ref={conversationRef}>
        {messages.length ? (
        <div className="companion-conversation" aria-live="polite">
          {messages.map((message) => (
            <article className={`is-${message.role}`} key={message.id}>
              <span>{message.role === "user" ? (isZh ? "你" : "You") : (isZh ? "问道同行" : "Wendao")}</span>
              <p>{message.content || (phase === "slow"
                ? (isZh ? "仍在认真整理，这次会多用一点时间…" : "Still working carefully—this one needs a little longer…")
                : phase === "answering"
                  ? (isZh ? "正在组织回应…" : "Composing a response…")
                  : (isZh ? "正在读这一章…" : "Reading this chapter…"))}</p>
              {message.status === "error" && message.retryQuestion ? (
                <button type="button" onClick={() => void askQuestion(message.retryQuestion!)} disabled={asking}>
                  {isZh ? "重新回答" : "Try again"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="companion-empty" aria-label={isZh ? "提问建议" : "Question suggestions"}>
          <p>{isZh ? "可以从一个具体处境开始：" : "Begin with one concrete situation:"}</p>
          <div>
            {[
              isZh ? "这件事最该先看哪里？" : "What should I notice first?",
              isZh ? "我该坚持，还是放下？" : "Should I persist or let go?",
              isZh ? "怎样把这一章落到今天？" : "How can I live this chapter today?",
            ].map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>
            ))}
          </div>
          <small>{isZh ? "回答会以本章原文、今译与主旨为依据。" : "Answers are grounded in the chapter text, translation, and central idea."}</small>
        </div>
      )}
      </div>
      <div className="companion-compose-zone">
        <p className="companion-response-status" role="status">
          {asking
            ? (phase === "slow"
              ? (isZh ? "这次思考较深，正在换一条更稳定的路径。" : "This is taking longer; switching to a more reliable path.")
              : (isZh ? "正在结合本章与你的处境回应" : "Responding with this chapter and your situation in view"))
            : (isZh ? "写下一个具体处境，我会先理解，再回应。" : "Describe one concrete situation. I will understand before responding.")}
        </p>
        <form className="companion-question-form" onSubmit={ask}>
          <label htmlFor="companion-question">{isZh ? "此刻，你真正想问什么？" : "What do you genuinely want to ask now?"}</label>
          <div className="companion-question-control">
            <textarea
              id="companion-question"
              maxLength={2000}
              rows={2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={isZh ? "写下一个处境、矛盾或选择…" : "Describe a situation, tension, or choice…"}
              disabled={asking}
            />
            <button type="submit" disabled={asking || !question.trim()} aria-label={isZh ? "发送问题" : "Send question"}>↑</button>
          </div>
        </form>
        <small className="companion-compose-note">
          {isZh ? "回答会结合本章与已保存的记忆；自动记忆可随时关闭。" : "Responses use this chapter and saved memories; automatic memory can be turned off anytime."}
        </small>
        <div className="companion-home-actions">
        {(!Capacitor.isNativePlatform() && state.entitlement?.source === "stripe")
          || (Capacitor.getPlatform() === "ios" && state.entitlement?.source === "apple") ? (
            <button className="companion-text-button" type="button" onClick={() => void manageMembership()}>{isZh ? "管理会员" : "Manage membership"}</button>
          ) : null}
        {asking ? <button className="companion-text-button" type="button" onClick={() => abortRef.current?.abort()}>{isZh ? "停止回答" : "Stop response"}</button> : null}
        {accessError ? <span className="companion-error" role="alert">{isZh ? "会员信息暂时未能刷新，当前会话仍可继续。" : "Membership details could not refresh; this conversation can continue."}</span> : null}
        </div>
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
