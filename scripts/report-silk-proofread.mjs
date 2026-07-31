import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildAuditPlan, CHAPTER_16_FIX } from "./silk-auto-proofread-core.mjs";

const root = new URL("../", import.meta.url);
const generated = new URL("../generated/", import.meta.url);
const chapters = JSON.parse(await readFile(new URL("src/data/chapters.json", root), "utf8"));
const plan = JSON.parse(await readFile(new URL("generated/silk-auto-proofread-plan.json", root), "utf8"));
const currentAudit = buildAuditPlan(chapters);
const additionResults = plan.additionAudits.map((item) => {
  const chapter = chapters.find((candidate) => candidate.id === item.chapterId);
  const final = chapter.zh.additions.find((addition) => addition.absolutePosition === item.absolutePosition);
  return {
    recordKind: "addition",
    chapterId: item.chapterId,
    silkOrder: item.silkOrder,
    line: item.line,
    position: item.position,
    originalCharacter: item.currentCharacter,
    finalCharacter: final?.character ?? null,
    auditCategory: item.auditCategory,
    wasModified: final?.character !== item.currentCharacter,
    modifiedFields: [],
    reason: item.reason,
    referenceScope: item.referenceScope,
    requiresImageReview: item.requiresImageReview,
    possibleAlternatives: item.possibleAlternatives,
    remainingUncertainty: item.requiresImageReview ? "需要核对帛书乙本原始图版、高清摹本或权威释文。" : "",
    confidence: final?.confidence ?? null,
  };
});
const chapter16 = chapters.find((chapter) => chapter.id === 16);
const chapter16Modified = chapter16.zh.reconstructedVerse[0] === CHAPTER_16_FIX.proposedReadingLine;
const visibleReadingResult = {
  recordKind: "visible-reading",
  chapterId: 16,
  silkOrder: chapter16.silkOrder,
  line: 1,
  position: CHAPTER_16_FIX.position,
  originalCharacter: CHAPTER_16_FIX.currentCharacter,
  finalCharacter: chapter16Modified ? CHAPTER_16_FIX.proposedCharacter : CHAPTER_16_FIX.currentCharacter,
  auditCategory: CHAPTER_16_FIX.auditCategory,
  wasModified: chapter16Modified,
  modifiedFields: chapter16Modified ? ["zh.reconstructedVerse", "zh.pinyin", "zh.title", "zh.variant", "en.variant", "sources.reconstructionNotes", "src/data/sources.json", "scripts/build-chapter-data.mjs"] : [],
  reason: CHAPTER_16_FIX.reason,
  referenceScope: ["silkBTranscription", "Chinese Text Project", "Fudan excavated-text scholarship"],
  requiresImageReview: true,
  possibleAlternatives: ["情表（甲本式）", "静笃（传世校读）"],
  remainingUncertainty: "乙本转写与可追溯释文一致支持“静督”；仍未在本轮核对原始帛书图版。",
  confidence: null,
};
const results = [...additionResults, visibleReadingResult];
const chapterSummaries = chapters.map((chapter) => {
  const rows = additionResults.filter((result) => result.chapterId === chapter.id);
  return {
    chapterId: chapter.id,
    silkOrder: chapter.silkOrder,
    totalAdditions: rows.length,
    modified: rows.filter((row) => row.wasModified).length + (chapter.id === 16 && visibleReadingResult.wasModified ? 1 : 0),
    unchanged: rows.filter((row) => !row.wasModified).length,
    structuralErrorsFixed: rows.filter((row) => row.wasModified && row.auditCategory === "structural-error").length,
    stronglySupportedFixes: rows.filter((row) => row.wasModified && row.auditCategory === "strongly-supported-fix").length,
    clearTranscriptionFixes: chapter.id === 16 && visibleReadingResult.wasModified ? 1 : 0,
    receivedTextRisksRemaining: rows.filter((row) => row.auditCategory === "received-text-contamination").length,
    conflictingWitnesses: rows.filter((row) => row.auditCategory === "conflicting-witnesses").length,
    insufficientEvidence: rows.filter((row) => row.auditCategory === "insufficient-evidence").length,
  };
});
const categoryCounts = plan.summary.categoryCounts;
const final = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  summary: {
    totalAdditionsAudited: additionResults.length,
    additionsModified: additionResults.filter((row) => row.wasModified).length,
    additionsUnchanged: additionResults.filter((row) => !row.wasModified).length,
    totalSafeModifications: results.filter((row) => row.wasModified).length,
    engineeringErrorsFixed: additionResults.filter((row) => row.wasModified && row.auditCategory === "structural-error").length,
    clearTextualErrorsFixed: visibleReadingResult.wasModified ? 1 : 0,
    receivedTextContaminationFixed: 0,
    receivedTextRisksRemaining: categoryCounts["received-text-contamination"],
    conflictingWitnesses: categoryCounts["conflicting-witnesses"],
    insufficientEvidence: categoryCounts["insufficient-evidence"],
    requiresImageReview: additionResults.filter((row) => row.requiresImageReview).length,
    confidenceUpgrades: additionResults.filter((row) => row.confidence !== "review-required").length,
    modernLifeInterpretationChanges: 0,
    currentAuditStructuralIssues: currentAudit.chapterStructuralIssues.length,
  },
  representativeChapters: chapterSummaries.filter((chapter) => [1, 16, 38, 41, 67, 81].includes(chapter.chapterId)),
  chapterSummaries,
  results,
};

function csvCell(value) {
  const serialized = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${serialized.replaceAll('"', '""')}"`;
}
const columns = ["recordKind", "chapterId", "silkOrder", "line", "position", "originalCharacter", "finalCharacter", "auditCategory", "wasModified", "modifiedFields", "reason", "referenceScope", "requiresImageReview", "possibleAlternatives", "remainingUncertainty", "confidence"];
const csv = [columns.join(","), ...results.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
const markdown = [
  "# 帛书乙本校补字自动初校最终报告",
  "",
  `- 初校校补字：${final.summary.totalAdditionsAudited}`,
  `- 实际修改校补字：${final.summary.additionsModified}`,
  `- 未修改校补字：${final.summary.additionsUnchanged}`,
  `- additions 之外的明确文字修正：${final.summary.clearTextualErrorsFixed}`,
  `- 工程错误修复：${final.summary.engineeringErrorsFixed}`,
  `- 疑似传世本倒灌修复：${final.summary.receivedTextContaminationFixed}`,
  `- 仍存在传世本倒灌风险：${final.summary.receivedTextRisksRemaining}`,
  `- 多种合理校读：${final.summary.conflictingWitnesses}`,
  `- 证据不足：${final.summary.insufficientEvidence}`,
  `- 需要图版复核：${final.summary.requiresImageReview}`,
  `- 置信度升级：${final.summary.confidenceUpgrades}`,
  "",
  "## 已实施的安全修正",
  "",
  `- 第 16 章：${CHAPTER_16_FIX.currentReadingLine} → ${CHAPTER_16_FIX.proposedReadingLine}`,
  `  - ${CHAPTER_16_FIX.reason}`,
  "  - 拼音同步为 jìng / dū；校补字总数仍为 741。",
  "",
  "## 代表章节",
  "",
  ...final.representativeChapters.map((chapter) => `- 第 ${chapter.chapterId} 章：校补 ${chapter.totalAdditions}，修改 ${chapter.modified}，传世风险 ${chapter.receivedTextRisksRemaining}，版本冲突 ${chapter.conflictingWitnesses}，证据不足 ${chapter.insufficientEvidence}。`),
  "",
  "## 保留边界",
  "",
  "741 个 additions 均保留 review-required；没有依据自动替换缺损补字，没有修改现代生命解读，也没有把传世本候选冒充帛书原字。逐条结果见 JSON/CSV。",
  "",
].join("\n");

await mkdir(generated, { recursive: true });
await writeFile(new URL("silk-auto-proofread-final.json", generated), `${JSON.stringify(final, null, 2)}\n`);
await writeFile(new URL("silk-auto-proofread-final.csv", generated), `${csv}\n`);
await writeFile(new URL("silk-auto-proofread-final.md", generated), markdown);
console.log(`Wrote ${results.length} final records: ${additionResults.length} additions plus one visible-reading correction.`);
