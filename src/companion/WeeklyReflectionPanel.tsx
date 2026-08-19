import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  generateWeeklyReflection,
  loadWeeklyReflection,
  type WeeklyReflection,
} from "./api";
import { companionPublicConfig } from "./client";

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
    } catch {
      setError(isZh ? "暂时无法读取本周回看。" : "This week's reflection is temporarily unavailable.");
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
          error: ({ message }) => { throw new Error(message); },
        },
      });
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (isZh ? "本周回看暂时无法生成。" : "This week's reflection could not be generated."));
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
