import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  clearCompanionMemories,
  loadCompanionMemories,
  setCompanionMemoryEnabled,
  setCompanionMemoryStatus,
  type CompanionMemory,
} from "./api";
import { companionPublicConfig } from "./client";

const LABELS = {
  zh: {
    current_situation: "当下处境",
    recurring_theme: "反复主题",
    preference_boundary: "偏好与边界",
    practice_outcome: "实践结果",
  },
  en: {
    current_situation: "Current situation",
    recurring_theme: "Recurring theme",
    preference_boundary: "Preference or boundary",
    practice_outcome: "Practice outcome",
  },
} as const;

export default function MemoryPanel({
  session,
  language,
  onBack,
}: {
  session: Session;
  language: "zh" | "en";
  onBack: () => void;
}) {
  const [enabled, setEnabled] = useState(true);
  const [memories, setMemories] = useState<CompanionMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isZh = language === "zh";
  const config = companionPublicConfig();

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const state = await loadCompanionMemories(config.apiUrl, session.access_token);
      setEnabled(state.enabled);
      setMemories(state.memories);
    } catch {
      setError(isZh ? "暂时无法读取记忆。" : "Memories are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [config, isZh, session.access_token]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async () => {
    if (!config || saving) return;
    setSaving(true);
    setError("");
    try {
      await setCompanionMemoryEnabled(config.apiUrl, session.access_token, !enabled);
      setEnabled((current) => !current);
    } catch {
      setError(isZh ? "暂时无法修改记忆设置。" : "The memory setting could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (memoryId: string) => {
    if (!config || saving) return;
    setSaving(true);
    try {
      await setCompanionMemoryStatus(config.apiUrl, session.access_token, memoryId, "resolved");
      setMemories((current) => current.map((memory) => (
        memory.id === memoryId ? { ...memory, status: "resolved" } : memory
      )));
    } catch {
      setError(isZh ? "暂时无法修改这条记忆。" : "This memory could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!config || saving) return;
    const confirmed = window.confirm(isZh ? "清除全部记忆？此操作无法撤销。" : "Clear every memory? This cannot be undone.");
    if (!confirmed) return;
    setSaving(true);
    try {
      await clearCompanionMemories(config.apiUrl, session.access_token);
      setMemories([]);
    } catch {
      setError(isZh ? "暂时无法清除记忆。" : "Memories could not be cleared.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="companion-memory-panel">
      <button className="companion-text-button" type="button" onClick={onBack}>← {isZh ? "返回对话" : "Back to conversation"}</button>
      <header>
        <span className="drawer-kicker">{isZh ? "关于我的记忆" : "What Wendao remembers"}</span>
        <h3>{isZh ? "你始终拥有决定权。" : "You remain in control."}</h3>
        <p>{isZh ? "这里只保留有助于下一次对话的简短摘要，不保存邮箱、付款资料或原始出生信息。" : "Only short summaries that may help a later conversation are kept—never email, payment details, or raw birth data."}</p>
      </header>
      <div className="companion-memory-switch">
        <span><strong>{isZh ? "自动记忆" : "Automatic memory"}</strong><small>{enabled ? (isZh ? "已开启" : "On") : (isZh ? "已暂停，不再提取或使用" : "Paused; no memories are extracted or used")}</small></span>
        <button type="button" role="switch" aria-checked={enabled} disabled={saving} onClick={() => void toggle()}><span /></button>
      </div>
      {loading ? <p className="companion-memory-empty">{isZh ? "正在读取…" : "Loading…"}</p> : null}
      {!loading && memories.length === 0 ? <p className="companion-memory-empty">{isZh ? "还没有形成记忆。继续对话后，真正有用的线索会出现在这里。" : "No memories yet. Useful threads will appear here as your conversations continue."}</p> : null}
      <div className="companion-memory-list">
        {memories.map((memory) => (
          <article className={memory.status !== "active" ? "is-inactive" : ""} key={memory.id}>
            <span>{LABELS[language][memory.kind]}</span>
            <p>{memory.summary}</p>
            {memory.status === "active" ? <button type="button" disabled={saving} onClick={() => void resolve(memory.id)}>{isZh ? "这件事已过去" : "This has passed"}</button> : <small>{isZh ? "已结束" : "Resolved"}</small>}
          </article>
        ))}
      </div>
      {memories.length ? <button className="companion-clear-memory" type="button" disabled={saving} onClick={() => void clear()}>{isZh ? "清除全部记忆" : "Clear all memories"}</button> : null}
      {error ? <p className="companion-error" role="alert">{error}</p> : null}
    </section>
  );
}
