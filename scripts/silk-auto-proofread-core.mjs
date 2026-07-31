import { reconstructedTokens, requiredSupplyDetails } from "./silk-integrity-core.mjs";
import { pinyinLinesForChapter } from "./chapter-pinyin.mjs";

const HANZI = /\p{Script=Han}/u;
const PLAN_VERSION = 1;
const FIX_NOTE = "Codex 自动初校：校读首行原作“守情表也”，与乙本转写可见“守靜督也”不一致；已依据仓库乙本转写、Chinese Text Project 乙本文本及学术校读改为“守静督也”。尚未核对原始图版，仍待图版复核。";

export const CHAPTER_16_FIX = Object.freeze({
  id: "chapter-16-visible-reading",
  recordKind: "visible-reading",
  chapterId: 16,
  line: 1,
  position: 6,
  currentCharacter: "情表",
  proposedCharacter: "静督",
  currentReadingLine: "至虚极也，守情表也。",
  proposedReadingLine: "至虚极也，守静督也。",
  silkBMarker: "乙本可见字：靜督",
  auditCategory: "clear-transcription-fix",
  riskLevel: "low",
  evidenceAvailable: [
    "sources.silkBTranscription: 至虛極也，守靜督也",
    "Chinese Text Project: https://ctext.org/mawangdui/lao-zi-yi-dao-jing/zh",
    "复旦大学出土文献与古文字研究中心: https://fdgwz.org.cn/Web/Show/4213",
  ],
  reason: "当前校读把乙本可见的“靜督”误作甲本式“情表”；这是跨见证误植，不是缺损异文选择。保留乙本用字“督”，不采用传世本“笃”。",
  allowedToAutoFix: true,
  requiresImageReview: true,
  affectedFields: [
    "zh.reconstructedVerse",
    "zh.pinyin",
    "zh.title",
    "zh.variant",
    "en.variant",
    "sources.reconstructionNotes",
    "src/data/sources.json",
    "scripts/build-chapter-data.mjs",
  ],
});

function hanzi(value) {
  return Array.from(value ?? "").filter((character) => HANZI.test(character));
}

function alignReadingToReceived(readingTokens, receivedReference) {
  const source = readingTokens.map((token) => token.character);
  const received = hanzi(receivedReference);
  const rows = source.length + 1;
  const columns = received.length + 1;
  const costs = Array.from({ length: rows }, () => new Float64Array(columns));
  const moves = Array.from({ length: rows }, () => new Uint8Array(columns));
  for (let row = 1; row < rows; row += 1) {
    costs[row][0] = row;
    moves[row][0] = 2;
  }
  for (let column = 1; column < columns; column += 1) {
    costs[0][column] = column;
    moves[0][column] = 3;
  }
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const diagonal = costs[row - 1][column - 1] + (source[row - 1] === received[column - 1] ? 0 : 0.8);
      const deletion = costs[row - 1][column] + 1;
      const insertion = costs[row][column - 1] + 1;
      const best = Math.min(diagonal, deletion, insertion);
      costs[row][column] = best;
      moves[row][column] = diagonal <= best + Number.EPSILON ? 1 : deletion <= insertion ? 2 : 3;
    }
  }
  const result = new Map();
  let row = source.length;
  let column = received.length;
  while (row > 0 || column > 0) {
    const move = moves[row][column];
    if (move === 1) {
      result.set(row - 1, { character: received[column - 1], index: column - 1 });
      row -= 1;
      column -= 1;
    } else if (move === 2) {
      result.set(row - 1, null);
      row -= 1;
    } else {
      column -= 1;
    }
  }
  return result;
}

export function structuralIssuesForChapter(chapter) {
  const issues = [];
  const tokens = reconstructedTokens(chapter.zh.reconstructedVerse);
  const required = requiredSupplyDetails(chapter.sources.silkBTranscription, chapter.zh.reconstructedVerse);
  const requiredByPosition = new Map(required.map((detail) => [detail.index + 1, detail]));
  const additions = chapter.zh.additions ?? [];
  const seen = new Set();
  const expectedPinyin = pinyinLinesForChapter(chapter.id, chapter.zh.reconstructedVerse);

  for (const addition of additions) {
    const key = addition.absolutePosition;
    if (seen.has(key)) issues.push({ type: "duplicate-position", absolutePosition: key });
    seen.add(key);
    const token = tokens[key - 1];
    const requiredDetail = requiredByPosition.get(key);
    const lineTokens = token ? tokens.filter((candidate) => candidate.lineIndex === token.lineIndex) : [];
    const position = token ? lineTokens.findIndex((candidate) => candidate === token) + 1 : -1;
    const actualPinyin = chapter.zh.pinyin?.[addition.line - 1]?.[addition.position - 1];
    const wantedPinyin = expectedPinyin?.[addition.line - 1]?.[addition.position - 1];
    if (!token || token.character !== addition.character || !token.marked) {
      issues.push({ type: "character-position-mismatch", absolutePosition: key, character: addition.character });
    }
    if (!token || addition.line !== token.lineIndex + 1 || addition.position !== position) {
      issues.push({ type: "line-position-mismatch", absolutePosition: key, line: addition.line, position: addition.position });
    }
    if (!requiredDetail || addition.basis !== requiredDetail.basis || addition.sourceMarker !== requiredDetail.sourceMarker) {
      issues.push({ type: "silk-marker-mismatch", absolutePosition: key });
    }
    if (actualPinyin !== wantedPinyin) {
      issues.push({ type: "pinyin-mismatch", absolutePosition: key, actualPinyin, expectedPinyin: wantedPinyin });
    }
    if (addition.confidence !== "review-required") {
      issues.push({ type: "confidence-upgraded", absolutePosition: key, confidence: addition.confidence });
    }
  }
  if (additions.length !== required.length) {
    issues.push({ type: "addition-count-mismatch", actual: additions.length, expected: required.length });
  }
  for (const detail of required) {
    if (!seen.has(detail.index + 1)) issues.push({ type: "missing-addition", absolutePosition: detail.index + 1 });
  }
  const missing = (chapter.sources.silkBTranscription.match(/[□○]/g) ?? []).length;
  if (missing && !chapter.sources.reconstructionNotes.includes(`保留 ${missing} 个缺损符号`)) {
    issues.push({ type: "reconstruction-note-lacuna-count", actual: missing });
  }
  if (additions.length && !chapter.sources.reconstructionNotes.includes(`共 ${additions.length} 字`)) {
    issues.push({ type: "reconstruction-note-addition-count", actual: additions.length });
  }
  return issues;
}

function classifyAddition(chapter, addition, structuralIssues, receivedAlignment) {
  const readingLine = chapter.zh.reconstructedVerse[addition.line - 1];
  const received = receivedAlignment.get(addition.absolutePosition - 1);
  const localStructuralIssues = structuralIssues.filter((issue) => issue.absolutePosition === addition.absolutePosition);
  if (localStructuralIssues.length) {
    return {
      auditCategory: "structural-error",
      riskLevel: "high",
      received,
      reason: `发现工程一致性错误：${localStructuralIssues.map((issue) => issue.type).join("、")}。`,
      allowedToAutoFix: false,
      requiresImageReview: false,
      evidenceAvailable: ["仓库字段之间可机械复核"],
      possibleAlternatives: [],
      structuralIssues: localStructuralIssues,
    };
  }
  if (received?.character === addition.character) {
    return {
      auditCategory: "received-text-contamination",
      riskLevel: "medium",
      received,
      reason: "当前校补与传世参照对齐，但仓库没有可逐字验证的甲本释文或乙本图版证据，无法证明它不是由传世本回填；保留原字并进入图版复核队列。",
      allowedToAutoFix: false,
      requiresImageReview: true,
      evidenceAvailable: ["乙本缺损/对齐空位", "传世参照同字", "未保存逐字甲本证据"],
      possibleAlternatives: [],
      structuralIssues: [],
    };
  }
  if (received?.character) {
    return {
      auditCategory: "conflicting-witnesses",
      riskLevel: "high",
      received,
      reason: `当前校补“${addition.character}”与传世参照对齐字“${received.character}”不同；仓库没有足够逐字证据裁决，不能自动择一。`,
      allowedToAutoFix: false,
      requiresImageReview: true,
      evidenceAvailable: ["乙本缺损/对齐空位", `传世参照候选：${received.character}`, "当前整理校读字"],
      possibleAlternatives: [received.character],
      structuralIssues: [],
    };
  }
  return {
    auditCategory: "insufficient-evidence",
    riskLevel: "high",
    received: null,
    reason: "当前字无法与传世参照可靠对齐，仓库也没有逐字甲本释文或原始图版；需要核对帛书乙本原始图版、高清摹本或权威释文。",
    allowedToAutoFix: false,
    requiresImageReview: true,
    evidenceAvailable: ["乙本缺损/对齐空位", "无可靠传世对齐字"],
    possibleAlternatives: [],
    structuralIssues: [],
  };
}

export function buildAuditPlan(chapters) {
  const additionAudits = [];
  const chapterStructuralIssues = [];
  for (const chapter of chapters) {
    const tokens = reconstructedTokens(chapter.zh.reconstructedVerse);
    const structuralIssues = structuralIssuesForChapter(chapter);
    chapterStructuralIssues.push(...structuralIssues.map((issue) => ({ chapterId: chapter.id, ...issue })));
    const receivedAlignment = alignReadingToReceived(tokens, chapter.sources.receivedReference);
    for (const addition of chapter.zh.additions) {
      const classification = classifyAddition(chapter, addition, structuralIssues, receivedAlignment);
      additionAudits.push({
        recordKind: "addition",
        chapterId: chapter.id,
        silkOrder: chapter.silkOrder,
        line: addition.line,
        position: addition.position,
        absolutePosition: addition.absolutePosition,
        currentCharacter: addition.character,
        proposedCharacter: null,
        silkBMarker: addition.sourceMarker ?? "beyond-transcription-alignment",
        currentReadingLine: chapter.zh.reconstructedVerse[addition.line - 1],
        proposedReadingLine: chapter.zh.reconstructedVerse[addition.line - 1],
        auditCategory: classification.auditCategory,
        riskLevel: classification.riskLevel,
        evidenceAvailable: classification.evidenceAvailable,
        reason: classification.reason,
        allowedToAutoFix: classification.allowedToAutoFix,
        requiresImageReview: classification.requiresImageReview,
        affectedFields: [],
        referenceScope: addition.references,
        currentConfidence: addition.confidence,
        receivedAlignedCharacter: classification.received?.character ?? null,
        possibleAlternatives: classification.possibleAlternatives,
        structuralIssues: classification.structuralIssues,
      });
    }
  }
  const categories = [
    "structural-error",
    "clear-transcription-fix",
    "strongly-supported-fix",
    "received-text-contamination",
    "conflicting-witnesses",
    "insufficient-evidence",
    "structurally-valid",
  ];
  const categoryCounts = Object.fromEntries(categories.map((category) => [category, additionAudits.filter((item) => item.auditCategory === category).length]));
  const chapter16 = chapters.find((chapter) => chapter.id === 16);
  const pendingChapter16Fix = chapter16?.zh.reconstructedVerse[0] === CHAPTER_16_FIX.currentReadingLine;
  const resolvedChapter16Fix = chapter16?.zh.reconstructedVerse[0] === CHAPTER_16_FIX.proposedReadingLine;
  const safeFixes = pendingChapter16Fix ? [{ ...CHAPTER_16_FIX, silkOrder: chapter16.silkOrder }] : [];
  const resolvedFixes = resolvedChapter16Fix ? [{ ...CHAPTER_16_FIX, silkOrder: chapter16.silkOrder, allowedToAutoFix: false, wasAlreadyApplied: true }] : [];
  return {
    schemaVersion: PLAN_VERSION,
    generatedAt: new Date().toISOString(),
    policy: "自动初校只证明工程一致性与仓库内证据关系；没有原始图版或逐字甲本记录时，不把自动推断冒充帛书原字。",
    summary: {
      totalAdditions: additionAudits.length,
      autoFixableAdditions: additionAudits.filter((item) => item.allowedToAutoFix).length,
      nonAutoFixableAdditions: additionAudits.filter((item) => !item.allowedToAutoFix).length,
      engineeringErrors: categoryCounts["structural-error"],
      clearTextualErrors: categoryCounts["clear-transcription-fix"],
      stronglySupportedFixes: categoryCounts["strongly-supported-fix"],
      suspectedReceivedTextContamination: categoryCounts["received-text-contamination"],
      conflictingWitnesses: categoryCounts["conflicting-witnesses"],
      insufficientEvidence: categoryCounts["insufficient-evidence"],
      structurallyValid: additionAudits.length - categoryCounts["structural-error"],
      requiresImageReview: additionAudits.filter((item) => item.requiresImageReview).length,
      nonAdditionSafeFixes: safeFixes.length,
      categoryCounts,
    },
    chapterStructuralIssues,
    additionAudits,
    safeFixes,
    resolvedFixes,
  };
}

export function stableAuditView(plan) {
  return {
    schemaVersion: plan.schemaVersion,
    policy: plan.policy,
    summary: plan.summary,
    chapterStructuralIssues: plan.chapterStructuralIssues,
    additionAudits: plan.additionAudits,
    safeFixes: plan.safeFixes,
    resolvedFixes: plan.resolvedFixes,
  };
}

export function compactDiff(readingText, receivedText) {
  const reading = hanzi(readingText);
  const received = hanzi(receivedText);
  const differences = [];
  const limit = Math.min(reading.length, received.length);
  for (let index = 0; index < limit && differences.length < 8; index += 1) {
    if (reading[index] !== received[index]) differences.push(`${reading[index]}/${received[index]}`);
  }
  const lengthNote = reading.length === received.length ? "" : `；字数 ${reading.length}/${received.length}`;
  return `${differences.length ? differences.join("、") : "未检出逐位异文"}${lengthNote}`;
}

function replaceCollationNotes(chapter) {
  const collation = compactDiff(chapter.zh.reconstructedVerse.join(""), chapter.sources.receivedReference);
  chapter.zh.variant = chapter.zh.variant.replace(
    /传世参照的主要逐位差异（校勘索引，需结合王弼注本人工复核）：.*。$/u,
    `传世参照的主要逐位差异（校勘索引，需结合王弼注本人工复核）：${collation}。`,
  );
  chapter.en.variant = chapter.en.variant.replace(
    /Received-text alignment differences: .*\. The English scripture/u,
    `Received-text alignment differences: ${collation}. The English scripture`,
  );
}

export function applyAllowedFixes(chaptersInput, sourcesInput, plan) {
  const chapters = structuredClone(chaptersInput);
  const sources = structuredClone(sourcesInput);
  const changes = [];
  for (const fix of plan.safeFixes.filter((item) => item.allowedToAutoFix)) {
    if (fix.id !== CHAPTER_16_FIX.id) continue;
    const chapter = chapters.find((candidate) => candidate.id === fix.chapterId);
    if (!chapter || chapter.zh.reconstructedVerse[fix.line - 1] !== fix.currentReadingLine) continue;
    chapter.zh.reconstructedVerse[fix.line - 1] = fix.proposedReadingLine;
    chapter.zh.pinyin = pinyinLinesForChapter(chapter.id, chapter.zh.reconstructedVerse);
    chapter.zh.title = fix.proposedReadingLine.replace(/[。！？；]/gu, "").slice(0, 12);
    if (!chapter.sources.reconstructionNotes.includes(FIX_NOTE)) {
      chapter.sources.reconstructionNotes = `${chapter.sources.reconstructionNotes} ${FIX_NOTE}`;
    }
    replaceCollationNotes(chapter);
    const correction = "Received chapter 16: the imported reading “守情表也” was corrected to Silk B visible wording “守静督也” from the repository transcription and CText; transmitted “笃” remains comparison only. Image verification is still pending.";
    sources.knownSourceCorrections ??= [];
    if (!sources.knownSourceCorrections.includes(correction)) sources.knownSourceCorrections.push(correction);
    changes.push({
      id: fix.id,
      chapterId: fix.chapterId,
      originalCharacter: fix.currentCharacter,
      finalCharacter: fix.proposedCharacter,
      modifiedFields: ["zh.reconstructedVerse", "zh.pinyin", "zh.title", "zh.variant", "en.variant", "sources.reconstructionNotes", "src/data/sources.json"],
    });
  }
  return { chapters, sources, changes };
}

export function planMarkdown(plan) {
  const counts = plan.summary.categoryCounts;
  const lines = [
    "# 帛书乙本校补字自动初校计划",
    "",
    `生成时间：${plan.generatedAt}`,
    "",
    `- 校补字总数：${plan.summary.totalAdditions}`,
    `- 可自动修改的校补字：${plan.summary.autoFixableAdditions}`,
    `- 不可自动修改的校补字：${plan.summary.nonAutoFixableAdditions}`,
    `- structural-error：${counts["structural-error"]}`,
    `- clear-transcription-fix：${counts["clear-transcription-fix"]}`,
    `- strongly-supported-fix：${counts["strongly-supported-fix"]}`,
    `- received-text-contamination：${counts["received-text-contamination"]}`,
    `- conflicting-witnesses：${counts["conflicting-witnesses"]}`,
    `- insufficient-evidence：${counts["insufficient-evidence"]}`,
    `- structurally-valid（独立计数）：${plan.summary.structurallyValid}`,
    `- 需要图版复核：${plan.summary.requiresImageReview}`,
    `- additions 之外可安全修正项：${plan.summary.nonAdditionSafeFixes}`,
    "",
    "## 分类原则",
    "",
    "与传世参照同字只能证明二者对齐，不能证明补字来自乙本或甲本；在仓库缺少逐字甲本记录和图版证据时，统一列为传世本倒灌风险，不自动修改。与传世参照不同的条目列为版本冲突；无法可靠对齐者列为证据不足。",
    "",
    "## 允许自动修改",
    "",
  ];
  if (!plan.safeFixes.length) lines.push("当前数据状态没有待应用的安全修正。");
  for (const fix of plan.safeFixes) {
    lines.push(`- 第 ${fix.chapterId} 章第 ${fix.line} 行：${fix.currentReadingLine} → ${fix.proposedReadingLine}`);
    lines.push(`  - 分类：${fix.auditCategory}`);
    lines.push(`  - 原因：${fix.reason}`);
    lines.push(`  - 仍需图版复核：${fix.requiresImageReview ? "是" : "否"}`);
  }
  lines.push("", "## 不允许自动修改", "", `741 个 additions 中 ${plan.summary.nonAutoFixableAdditions} 个全部保留原字和 review-required；逐条记录见 JSON。`);
  return `${lines.join("\n")}\n`;
}

export const AUTO_FIX_NOTE = FIX_NOTE;
