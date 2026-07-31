import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyAllowedFixes,
  buildAuditPlan,
  CHAPTER_16_FIX,
  stableAuditView,
  structuralIssuesForChapter,
} from "../scripts/silk-auto-proofread-core.mjs";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));
const sources = JSON.parse(await readFile(new URL("../src/data/sources.json", import.meta.url), "utf8"));

test("audits all 741 additions deterministically without upgrading confidence", () => {
  const first = buildAuditPlan(chapters);
  const second = buildAuditPlan(chapters);
  assert.deepEqual(stableAuditView(first), stableAuditView(second));
  assert.equal(first.summary.totalAdditions, 741);
  assert.equal(first.summary.categoryCounts["structural-error"], 0);
  assert.equal(first.summary.categoryCounts["received-text-contamination"], 599);
  assert.equal(first.summary.categoryCounts["conflicting-witnesses"], 73);
  assert.equal(first.summary.categoryCounts["insufficient-evidence"], 69);
  assert.equal(first.summary.requiresImageReview, 741);
  assert.ok(first.additionAudits.every((item) => item.currentConfidence === "review-required"));
  assert.ok(first.additionAudits.every((item) => item.allowedToAutoFix === false));
});

test("detects duplicate, shifted, mismatched, and Pinyin-corrupt addition metadata", () => {
  const chapter = structuredClone(chapters.find((candidate) => candidate.id === 38));
  chapter.zh.additions[1].absolutePosition = chapter.zh.additions[0].absolutePosition;
  chapter.zh.additions[0].position += 1;
  chapter.zh.additions[0].character = "仁";
  chapter.zh.pinyin[chapter.zh.additions[0].line - 1][chapter.zh.additions[0].position - 1] = "zzz";
  const types = structuralIssuesForChapter(chapter).map((issue) => issue.type);
  assert.ok(types.includes("duplicate-position"));
  assert.ok(types.includes("line-position-mismatch"));
  assert.ok(types.includes("character-position-mismatch"));
  assert.ok(types.includes("pinyin-mismatch"));
});

test("a dry-run transformation leaves inputs untouched and applies only allowed fixes", () => {
  const inputChapters = structuredClone(chapters);
  const chapter16 = inputChapters.find((chapter) => chapter.id === 16);
  chapter16.zh.reconstructedVerse[0] = CHAPTER_16_FIX.currentReadingLine;
  const inputSources = structuredClone(sources);
  const beforeChapters = JSON.stringify(inputChapters);
  const beforeSources = JSON.stringify(inputSources);
  const plan = { safeFixes: [{ ...CHAPTER_16_FIX, silkOrder: chapter16.silkOrder }] };
  const result = applyAllowedFixes(inputChapters, inputSources, plan);
  assert.equal(JSON.stringify(inputChapters), beforeChapters);
  assert.equal(JSON.stringify(inputSources), beforeSources);
  assert.equal(result.changes.length, 1);
  assert.equal(result.chapters.find((chapter) => chapter.id === 16).zh.reconstructedVerse[0], CHAPTER_16_FIX.proposedReadingLine);
});

test("write synchronization updates Pinyin but not additions, confidence, or modern life interpretation", () => {
  const inputChapters = structuredClone(chapters);
  const chapter16 = inputChapters.find((chapter) => chapter.id === 16);
  chapter16.zh.reconstructedVerse[0] = CHAPTER_16_FIX.currentReadingLine;
  const protectedCopy = structuredClone({
    explanation: chapter16.zh.explanation,
    related: chapter16.zh.related,
    action: chapter16.zh.action,
  });
  const additionCount = inputChapters.flatMap((chapter) => chapter.zh.additions).length;
  const plan = { safeFixes: [{ ...CHAPTER_16_FIX, silkOrder: chapter16.silkOrder }] };
  const first = applyAllowedFixes(inputChapters, sources, plan);
  const updated = first.chapters.find((chapter) => chapter.id === 16);
  assert.equal(updated.zh.pinyin[0][5], "jìng");
  assert.equal(updated.zh.pinyin[0][6], "dū");
  assert.equal(first.chapters.flatMap((chapter) => chapter.zh.additions).length, additionCount);
  assert.ok(first.chapters.flatMap((chapter) => chapter.zh.additions).every((addition) => addition.confidence === "review-required"));
  assert.deepEqual({ explanation: updated.zh.explanation, related: updated.zh.related, action: updated.zh.action }, protectedCopy);
  const second = applyAllowedFixes(first.chapters, first.sources, plan);
  assert.equal(second.changes.length, 0);
});

test("disallowed conflicting-witness fix cannot be applied", () => {
  const plan = {
    safeFixes: [{
      ...CHAPTER_16_FIX,
      id: "disallowed-conflict",
      auditCategory: "conflicting-witnesses",
      allowedToAutoFix: false,
    }],
  };
  const result = applyAllowedFixes(chapters, sources, plan);
  assert.equal(result.changes.length, 0);
  assert.deepEqual(result.chapters, chapters);
});
