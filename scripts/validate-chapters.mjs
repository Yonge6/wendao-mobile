import { readFile } from "node:fs/promises";
import { inspectChapterIntegrity } from "./silk-integrity-core.mjs";
import { pinyinLinesForChapter } from "./chapter-pinyin.mjs";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));
const errors = [];
const chapterThemes = { zh: [], en: [] };
const inspirationBodies = { zh: [], en: [] };
const inspirationParagraphs = { zh: [], en: [] };
const hanziCount = (value) => Array.from(value).filter((character) => /\p{Script=Han}/u.test(character)).length;
const hasTone = (value) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]/u.test(value);

if (chapters.length !== 81) errors.push(`Expected 81 chapters, got ${chapters.length}`);
const ids = chapters.map((chapter) => chapter.id).sort((a, b) => a - b);
for (let id = 1; id <= 81; id += 1) {
  if (ids.filter((candidate) => candidate === id).length !== 1) errors.push(`Received chapter ${id} must appear exactly once`);
}

for (const chapter of chapters) {
  const prefix = `Chapter ${chapter.id}`;
  if ("literalSilkB" in (chapter.sources ?? {})) errors.push(`${prefix}: deprecated sources.literalSilkB must not be present`);
  if ("verse" in (chapter.zh ?? {})) errors.push(`${prefix}: deprecated zh.verse must not be present`);
  if (!Array.isArray(chapter.zh?.additions)) errors.push(`${prefix}: zh.additions must be a structured array`);
  errors.push(...inspectChapterIntegrity(chapter).map((issue) => `${issue.severity} ${issue.message}`));
  if (hanziCount(chapter.sources?.receivedReference ?? "") < 20) errors.push(`${prefix}: received comparison appears incomplete`);
  if (!chapter.zh?.reconstructedVerse?.length || hanziCount(chapter.zh.reconstructedVerse.join("")) < 10) errors.push(`${prefix}: Chinese scripture appears incomplete`);
  if (chapter.zh?.lineByLineTranslation?.length !== chapter.zh?.reconstructedVerse?.length) errors.push(`${prefix}: line-by-line translation must align with every reconstructed line`);
  chapter.zh?.lineByLineTranslation?.forEach((line, index) => {
    if (hanziCount(line) < 2) errors.push(`${prefix} translation ${index + 1}: modern Chinese translation is empty or too short`);
    if (line.includes("本章从")) errors.push(`${prefix} translation ${index + 1}: chapter-summary template is not a line translation`);
  });
  if (hanziCount(chapter.zh.reconstructedVerse.join("")) < hanziCount(chapter.sources?.receivedReference ?? "") * 0.6) errors.push(`${prefix}: reading text is unexpectedly short against received comparison`);
  if (chapter.zh.reconstructedVerse.length !== chapter.zh.pinyin?.length) errors.push(`${prefix}: Chinese line/Pinyin line mismatch`);
  const expectedPinyin = pinyinLinesForChapter(chapter.id, chapter.zh.reconstructedVerse);
  chapter.zh.reconstructedVerse.forEach((line, index) => {
    const syllables = chapter.zh.pinyin[index] ?? [];
    if (hanziCount(line) !== syllables.length) errors.push(`${prefix} line ${index + 1}: ${hanziCount(line)} Hanzi vs ${syllables.length} Pinyin`);
    if (syllables.some((syllable) => !hasTone(syllable) && !/^[aeiouü]$/i.test(syllable))) errors.push(`${prefix} line ${index + 1}: untoned Pinyin syllable`);
    if (JSON.stringify(syllables) !== JSON.stringify(expectedPinyin[index])) errors.push(`${prefix} line ${index + 1}: Pinyin does not match the actual reconstructed characters`);
  });
  for (const language of ["zh", "en"]) {
    const copy = chapter[language];
    if (!copy?.eyebrow || !copy.title || !copy.variant || !copy.action) errors.push(`${prefix}/${language}: incomplete core structure`);
    if (copy.explanation?.length !== 3) errors.push(`${prefix}/${language}: expected three explanation layers`);
    const expectedThemeTitle = language === "zh" ? "本章主旨" : "Chapter theme";
    if (copy.explanation?.[1]?.title !== expectedThemeTitle || copy.explanation?.[1]?.body?.length < 40) errors.push(`${prefix}/${language}: chapter theme must be complete`);
    else chapterThemes[language].push(copy.explanation[1].body);
    if (copy.related?.length !== 2) errors.push(`${prefix}/${language}: expected insights and life manual only`);
    const expectedInspirationTitle = language === "zh" ? "对我们的启发" : "What this teaches us";
    const inspiration = copy.related?.[0];
    if (inspiration?.title !== expectedInspirationTitle || inspiration?.body?.length < 40) {
      errors.push(`${prefix}/${language}: insights must be complete and precede life manual`);
    }
    const forbiddenFrame = language === "zh"
      ? /先辨认现实|再检视选择|最后落到行动/
      : /Begin with reality|Then examine the choice|Finally, make it practical/;
    const insightIsTooShort = (point) => language === "zh"
      ? [...point].length < 90
      : point.trim().split(/\s+/).length < 45;
    if (!Array.isArray(inspiration?.points) || inspiration.points.length !== 3 || inspiration.points.some((point) => insightIsTooShort(point) || forbiddenFrame.test(point))) {
      errors.push(`${prefix}/${language}: insights must contain exactly three substantial practical points without shared frames`);
    } else {
      inspirationBodies[language].push(inspiration.points.join("\n"));
      inspirationParagraphs[language].push(...inspiration.points);
    }
    if (!copy.related?.[1]?.title?.toLowerCase().includes(language === "zh" ? "人生说明书" : "life manual")) errors.push(`${prefix}/${language}: life manual must be last`);
  }
  if (!chapter.en.verse?.length || chapter.en.verse.join(" ").length < 20) errors.push(`${prefix}: English scripture appears incomplete`);
}

for (const language of ["zh", "en"]) {
  if (chapterThemes[language].length !== 81 || new Set(chapterThemes[language]).size !== 81) {
    errors.push(`${language}: every chapter must have a distinct chapter theme`);
  }
  if (inspirationBodies[language].length !== 81 || new Set(inspirationBodies[language]).size !== 81) {
    errors.push(`${language}: every chapter must have a distinct insight set`);
  }
  if (inspirationParagraphs[language].length !== 243 || new Set(inspirationParagraphs[language]).size !== 243) {
    errors.push(`${language}: all 243 insight paragraphs must be distinct`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${chapters.length} chapters: unique 1-81, distinct bilingual chapter themes, 243 substantial practical insight paragraphs per language, three-layer Silk B fields, marked supplies, high-risk phrase gate, and strict Hanzi/Pinyin alignment.`);
