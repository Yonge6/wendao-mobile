import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  CompanionApiError,
  generateWeeklyReflection,
  loadWeeklyReflection,
  type WeeklyReflection,
} from "./api";
import { companionPublicConfig } from "./client";

function weeklyErrorMessage(error: unknown, isZh: boolean, action: "load" | "generate") {
  const code = error instanceof CompanionApiError ? error.code : "";
  const status = error instanceof CompanionApiError ? error.status : 0;
  const message = error instanceof Error ? error.message : "";

  if (code === "weekly_source_empty") {
    return isZh
      ? "本周还没有足够的有效对话。先完成一次与你真实处境有关的问答，再回来生成。"
      : "There is not enough conversation from this week yet. Complete one grounded exchange, then return here.";
  }
  if (code === "subscription_required" || status === 402) {
    return isZh
      ? "当前账号没有可用的会员权益。恢复订阅后，本周回看会继续保留在同一账号中。"
      : "This account does not currently have an active membership. Restore it to continue weekly reflection.";
  }
  if (status === 401 || status === 403 || /auth|session|token/i.test(code)) {
    return isZh
      ? "登录状态已经失效。请在“账号”中重新登录，再生成本周回看。"
      : "Your sign-in has expired. Sign in again from Account, then create the weekly reflection.";
  }
  if (/weekly_ai|ai_unavailable|ai_invalid|stream/i.test(code)) {
    return isZh
      ? "AI 服务刚才没有完成生成；你的对话、记忆和会员状态都没有丢失。请稍后直接重试。"
      : "The AI service did not finish this reflection. Your conversations, memories, and membership are safe; try again shortly.";
  }
  if (error instanceof TypeError || /network|fetch/i.test(message)) {
    return isZh
      ? "当前网络没有连接到问道服务。检查网络后重试，已保存的对话不会受影响。"
      : "Wendao could not be reached on this network. Check the connection and try again; saved conversations are unaffected.";
  }
  return action === "load"
    ? (isZh ? "暂时无法读取本周回看。服务没有返回有效结果，请稍后重试。" : "The service did not return a valid weekly reflection. Try again shortly.")
    : (isZh ? "本周回看没有完成。服务没有返回完整内容，请稍后重试。" : "The weekly reflection did not finish. The service returned incomplete content; try again shortly.");
}

export default function WeeklyReflectionPanel({
  session,
  language,
  onBack,
}: {
  session: Session;
  language: "zh" | "en";
  onBack: () => void;
}) {
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const isZh = language === "zh";
  const config = companionPublicConfig();

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const result = await loadWeeklyReflection(config.apiUrl, session.access_token);
      setWeekStart(result.weekStart);
      setReflection(result.reflection);
    } catch (nextError) {
      setError(weeklyErrorMessage(nextError, isZh, "load"));
    } finally {
      setLoading(false);
    }
  }, [config, isZh, session.access_token]);

  useEffect(() => { void load(); }, [load]);

  const generate = async () => {
    if (!config || generating) return;
    setDraft("");
    setError("");
    setGenerating(true);
    try {
      await generateWeeklyReflection({
        apiUrl: config.apiUrl,
        accessToken: session.access_token,
        locale: language,
        handlers: {
          meta: (payload) => {
            if (typeof payload.weekStart === "string") setWeekStart(payload.weekStart);
          },
          delta: ({ text }) => setDraft((current) => current + text),
          error: ({ code, message }) => {
            throw new CompanionApiError(code || "weekly_ai_unavailable", message || "Weekly reflection unavailable");
          },
        },
      });
      await load();
    } catch (nextError) {
      setError(weeklyErrorMessage(nextError, isZh, "generate"));
    } finally {
      setGenerating(false);
    }
  };

  const content = reflection?.content || draft;

  return (
    <section className="companion-weekly-panel">
      <button className="companion-text-button" type="button" onClick={onBack}>← {isZh ? "返回对话" : "Back to conversation"}</button>
      <header>
        <span className="drawer-kicker">{isZh ? "这一周看见了什么" : "What this week revealed"}</span>
        <h3>{isZh ? "不总结你，只陪你看见线索。" : "Not a verdict—just a way to notice the threads."}</h3>
        <p>{isZh ? "根据最近对话生成，每周一次，已包含在会员权益中。" : "Generated once a week from recent conversations and included with membership."}</p>
      </header>
      {weekStart ? <time>{isZh ? `本周开始于 ${weekStart}` : `Week of ${weekStart}`}</time> : null}
      {loading ? <p className="companion-memory-empty">{isZh ? "正在读取…" : "Loading…"}</p> : null}
      {content ? <article className="companion-weekly-content">{content}</article> : null}
      {!loading && !content ? (
        <button className="companion-weekly-generate" type="button" disabled={generating} onClick={() => void generate()}>
          {generating ? (isZh ? "正在回看这一周…" : "Reflecting on the week…") : (isZh ? "生成本周回看" : "Create this week's reflection")}
        </button>
      ) : null}
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
    </section>
  );
}
