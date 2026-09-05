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
  ], { question: "项目交接完成时容易赶进度，团队成员休假，想列清单，不喜欢频繁提醒", now: Date.parse("2026-08-20") });

  assert.equal(selected.length, 5);
  assert.deepEqual(Object.keys(selected[0]).sort(), ["kind", "summary"]);
});

test("question relevance beats unrelated confidence, ignores expired memories and supports English", () => {
  const memories = [
    { kind: "current_situation", summary: "正在和同事交接项目", status: "active", confidence: 0.5 },
    { kind: "current_situation", summary: "周末准备去海边旅行", status: "active", confidence: 1 },
    { kind: "current_situation", summary: "项目交接已完成", status: "active", confidence: 1, expires_at: "2026-08-01" },
  ];
  assert.deepEqual(selectRelevantMemories(memories, { question: "项目交接时怎样与同事沟通？", now: Date.parse("2026-09-05") }).map((item) => item.summary), ["正在和同事交接项目"]);
  assert.deepEqual(selectRelevantMemories(memories, { question: "怎样练习书法？" }), []);
  assert.deepEqual(selectRelevantMemories(memories, { question: "" }), []);
  const english = [{ kind: "current_situation", summary: "Preparing a project handoff with colleagues", status: "active", confidence: 0.6 }];
  assert.equal(selectRelevantMemories(english, { question: "How should I handle the project handoff?" }).length, 1);
  assert.equal(selectRelevantMemories(english, { question: "What is the weather today?" }).length, 0);
});

test("short follow-ups may use the last user situation but an explicit new topic does not", () => {
  const memories = [{ kind: "current_situation", summary: "正在交接项目", status: "active" }];
  const conversation = [{ role: "user", content: "项目交接该怎么做？" }];
  assert.equal(selectRelevantMemories(memories, { question: "那怎么办？", conversation }).length, 1);
  assert.equal(selectRelevantMemories(memories, { question: "我想学习书法", conversation }).length, 0);
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

test("keeps only bounded user and assistant conversation context", () => {
  const messages = buildCompanionMessages({
    question: "What now?",
    locale: "en",
    chapter: chapterContextFromCollection(chapters, 64, "en"),
    memories: [],
    conversation: [
      { role: "tool", content: "must be removed" },
      { role: "user", content: "I am near the end." },
      { role: "assistant", content: "What remains unfinished?" },
    ],
  });
  assert.deepEqual(messages.slice(-3), [
    { role: "user", content: "I am near the end." },
    { role: "assistant", content: "What remains unfinished?" },
    { role: "user", content: "What now?" },
  ]);
  assert.doesNotMatch(JSON.stringify(messages), /must be removed/);
});

test("bounds prior conversation cost before sending it to the model", () => {
  const messages = buildCompanionMessages({
    question: "What now?",
    locale: "en",
    chapter: chapterContextFromCollection(chapters, 64, "en"),
    memories: [],
    conversation: Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: `${index}:${"x".repeat(3_000)}`,
    })),
  });
  const prior = messages.slice(1, -1);
  assert.equal(prior.length, 6);
  assert.ok(prior.every((message) => message.content.length <= 2_000));
  assert.ok(prior.reduce((total, message) => total + message.content.length, 0) <= 12_000);
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
