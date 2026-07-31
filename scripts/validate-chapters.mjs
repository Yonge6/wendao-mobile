import { readFile } from "node:fs/promises";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));
const errors = [];
const hanziCount = (value) => Array.from(value).filter((character) => /\p{Script=Han}/u.test(character)).length;
const hasTone = (value) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]/u.test(value);

if (chapters.length !== 81) errors.push(`Expected 81 chapters, got ${chapters.length}`);
const ids = chapters.map((chapter) => chapter.id).sort((a, b) => a - b);
for (let id = 1; id <= 81; id += 1) {
  if (ids.filter((candidate) => candidate === id).length !== 1) errors.push(`Received chapter ${id} must appear exactly once`);
}

for (const chapter of chapters) {
  const prefix = `Chapter ${chapter.id}`;
  if (!chapter.sources?.literalSilkB || !chapter.sources?.receivedReference) errors.push(`${prefix}: missing witness/reference`);
  if (hanziCount(chapter.sources?.receivedReference ?? "") < 20) errors.push(`${prefix}: received comparison appears incomplete`);
  if (!chapter.zh?.verse?.length || hanziCount(chapter.zh.verse.join("")) < 10) errors.push(`${prefix}: Chinese scripture appears incomplete`);
  if (hanziCount(chapter.zh.verse.join("")) < hanziCount(chapter.sources?.receivedReference ?? "") * 0.6) errors.push(`${prefix}: reading text is unexpectedly short against received comparison`);
  if (chapter.zh.verse.length !== chapter.zh.pinyin?.length) errors.push(`${prefix}: Chinese line/Pinyin line mismatch`);
  chapter.zh.verse.forEach((line, index) => {
    const syllables = chapter.zh.pinyin[index] ?? [];
    if (hanziCount(line) !== syllables.length) errors.push(`${prefix} line ${index + 1}: ${hanziCount(line)} Hanzi vs ${syllables.length} Pinyin`);
    if (syllables.some((syllable) => !hasTone(syllable) && !/^[aeiouü]$/i.test(syllable))) errors.push(`${prefix} line ${index + 1}: untoned Pinyin syllable`);
  });
  for (const language of ["zh", "en"]) {
    const copy = chapter[language];
    if (!copy?.eyebrow || !copy.title || !copy.variant || !copy.action) errors.push(`${prefix}/${language}: incomplete core structure`);
    if (copy.explanation?.length !== 3) errors.push(`${prefix}/${language}: expected three explanation layers`);
    if (copy.related?.length !== 5) errors.push(`${prefix}/${language}: expected four life lenses plus life manual`);
    if (!copy.related?.[4]?.title.toLowerCase().includes(language === "zh" ? "人生说明书" : "life manual")) errors.push(`${prefix}/${language}: life manual must be last`);
  }
  if (!chapter.en.verse?.length || chapter.en.verse.join(" ").length < 20) errors.push(`${prefix}: English scripture appears incomplete`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${chapters.length} chapters: unique 1-81, complete bilingual structure, witnesses, and strict Hanzi/Pinyin alignment.`);
