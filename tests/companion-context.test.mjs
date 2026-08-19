import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompanionMessages,
  chapterContextFromCollection,
  selectRelevantMemories,
} from "../api/_lib/context.mjs";
import {
  classifySafetyRisk,
  immediateSafetyResponse,
  validateCompanionQuestion,
} from "../api/_lib/safety.mjs";

const chapters = [
  {
    id: 64,
    theme: { zh: "慎终如始", en: "Care at the end" },
    zh: {
      reconstructedVerse: ["慎终如始，则无败事。"],
      lineByLineTranslation: ["结束时仍像开始时一样谨慎，就不会把事情做坏。"],
      explanation: [{ title: "逐句今译", body: "" }, { title: "本章主旨", body: "照看收尾。" }],
      related: [{ title: "对我们的启发", body: "", points: ["检查交接。"] }],
      action: "完成一项交接检查。",
    },
    en: {
      verse: ["Attend to the end as to the beginning, and no task will fail."],
      explanation: [{ title: "Chapter focus", body: "Care for completion." }],
      related: [{ title: "What this can teach us", body: "Check the handoff." }],
      action: "Review one handoff.",
    },
  },
];

test("builds bilingual grounding from the canonical chapter shape", () => {
  const zh = chapterContextFromCollection(chapters, 64, "zh");
  const en = chapterContextFromCollection(chapters, 64, "en");

  assert.equal(zh.id, 64);
  assert.deepEqual(zh.text, ["慎终如始，则无败事。"]);
  assert.equal(zh.translations[0], "结束时仍像开始时一样谨慎，就不会把事情做坏。");
  assert.equal(en.text[0], "Attend to the end as to the beginning, and no task will fail.");
});

test("retrieves at most five active memories without raw account fields", () => {
  const selected = selectRelevantMemories([
    { id: "1", kind: "current_situation", summary: "正在交接一个长期项目", status: "active", confidence: 0.9, updated_at: "2026-08-19" },
    { id: "2", kind: "practice_outcome", summary: "先列清单会更平静", status: "active", confidence: 0.8, updated_at: "2026-08-18" },
    { id: "3", kind: "recurring_theme", summary: "临近完成时容易赶进度", status: "active", confidence: 0.7, updated_at: "2026-08-17" },
    { id: "4", kind: "preference_boundary", summary: "不喜欢被频繁提醒", status: "active", confidence: 0.9, updated_at: "2026-08-16" },
    { id: "5", kind: "current_situation", summary: "团队成员本周休假", status: "active", confidence: 0.6, updated_at: "2026-08-15" },
    { id: "6", kind: "current_situation", summary: "不应被选中", status: "active", confidence: 0.5, updated_at: "2026-08-14" },
    { id: "7", kind: "current_situation", summary: "已经过去", status: "resolved", confidence: 1, updated_at: "2026-08-20" },
  ]);

  assert.equal(selected.length, 5);
  assert.deepEqual(Object.keys(selected[0]).sort(), ["kind", "summary"]);
});

test("life manual is optional and strips raw birth and account data", () => {
  const withoutManual = buildCompanionMessages({
    question: "这个项目该怎么收尾？",
    locale: "zh",
    chapter: chapterContextFromCollection(chapters, 64, "zh"),
    memories: [],
    lifeManual: null,
  });
  assert.doesNotMatch(JSON.stringify(withoutManual), /birth|出生|email/i);

  const withManual = buildCompanionMessages({
    question: "这个项目该怎么收尾？",
    locale: "zh",
    chapter: chapterContextFromCollection(chapters, 64, "zh"),
    memories: [],
    lifeManual: {
      type: "Generator",
      strategy: "To Respond",
      authority: "Sacral",
      profile: "5/1",
      birthDate: "1986-06-24",
      birthPlace: "Wuhan",
      email: "reader@example.com",
    },
  });
  const serialized = JSON.stringify(withManual);
  assert.match(serialized, /Generator/);
  assert.doesNotMatch(serialized, /1986|Wuhan|reader@example/);
});

test("validates question length and separates immediate safety risk", () => {
  assert.equal(validateCompanionQuestion("  我该如何开始？  "), "我该如何开始？");
  assert.throws(() => validateCompanionQuestion(" "), /question/i);
  assert.throws(() => validateCompanionQuestion("问".repeat(2001)), /too long/i);

  assert.equal(classifySafetyRisk("我现在想自杀，已经准备好了"), "immediate");
  assert.equal(classifySafetyRisk("Could this medicine replace seeing a doctor?"), "high_stakes");
  assert.equal(classifySafetyRisk("我该怎么结束这个项目？"), "standard");
  assert.match(immediateSafetyResponse("zh"), /紧急|身边|求助/);
});
