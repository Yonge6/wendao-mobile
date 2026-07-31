import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectChapterIntegrity } from "../scripts/silk-integrity-core.mjs";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));
const hanzi = (value) => Array.from(value).filter((character) => /\p{Script=Han}/u.test(character));

function fixture(reconstructedVerse, silkBTranscription = reconstructedVerse.join("")) {
  return {
    id: 1,
    sources: {
      silkBTranscription,
      receivedReference: "道可道，非常道。",
      reconstructionNotes: "测试用校补说明。",
    },
    zh: { reconstructedVerse },
  };
}

test("Silk B wording passes", () => {
  assert.deepEqual(inspectChapterIntegrity(fixture(["道可道也，非恒道也。"])) , []);
});

test("received-text high-risk wording fails", () => {
  const issues = inspectChapterIntegrity(fixture(["道可道，非常道。"]));
  assert.ok(issues.some((issue) => issue.message.includes("发现“非常道”")));
});

test("bracketed supply passes", () => {
  assert.deepEqual(inspectChapterIntegrity(fixture(["上〔义〕为之"], "上□为之")), []);
});

test("unmarked supply fails", () => {
  const issues = inspectChapterIntegrity(fixture(["上义为之"], "上□为之"));
  assert.ok(issues.some((issue) => issue.message.includes("新增文字未标注来源")));
});

test("received-reference phrases do not contaminate reconstruction checks", () => {
  const chapter1 = chapters.find((chapter) => chapter.id === 1);
  const chapter41 = chapters.find((chapter) => chapter.id === 41);
  assert.ok(chapter1.sources.receivedReference.includes("非常道"));
  assert.ok(chapter41.sources.receivedReference.includes("大器晚成"));
  assert.deepEqual(inspectChapterIntegrity(chapter1), []);
  assert.deepEqual(inspectChapterIntegrity(chapter41), []);
});

test("representative chapters keep brackets outside Pinyin counting and supply Pinyin for every marked Hanzi", () => {
  for (const id of [1, 16, 38, 41, 67, 81]) {
    const chapter = chapters.find((candidate) => candidate.id === id);
    assert.ok(chapter, `Chapter ${id} must exist`);
    assert.equal(chapter.zh.reconstructedVerse.length, chapter.zh.pinyin.length);
    chapter.zh.reconstructedVerse.forEach((line, lineIndex) => {
      assert.equal(hanzi(line).length, chapter.zh.pinyin[lineIndex].length, `Chapter ${id}, line ${lineIndex + 1}`);
      for (const supply of line.matchAll(/〔([^〕]+)〕/g)) {
        const before = hanzi(line.slice(0, supply.index)).length;
        const suppliedCount = hanzi(supply[1]).length;
        const suppliedPinyin = chapter.zh.pinyin[lineIndex].slice(before, before + suppliedCount);
        assert.equal(suppliedPinyin.length, suppliedCount, `Chapter ${id}, line ${lineIndex + 1} supply`);
        assert.ok(suppliedPinyin.every(Boolean), `Chapter ${id}, line ${lineIndex + 1} supplied Pinyin`);
      }
    });
  }
});

test("chapter 16 keeps visible Silk B 督 instead of imported 甲本式 or received wording", () => {
  const chapter16 = chapters.find((chapter) => chapter.id === 16);
  assert.ok(chapter16.sources.silkBTranscription.includes("守靜督也"));
  assert.ok(chapter16.zh.reconstructedVerse[0].includes("守静督也"));
  assert.equal(chapter16.zh.reconstructedVerse[0].includes("守情表也"), false);
  assert.equal(chapter16.zh.reconstructedVerse[0].includes("守静笃"), false);
});

test("every supplied graph has position, source, and review confidence metadata", () => {
  const additions = chapters.flatMap((chapter) => chapter.zh.additions);
  assert.equal(additions.length, 741);
  for (const addition of additions) {
    assert.match(addition.character, /\p{Script=Han}/u);
    assert.ok(addition.line > 0);
    assert.ok(addition.position > 0);
    assert.ok(addition.absolutePosition > 0);
    assert.equal(addition.source, "collatedReading");
    assert.deepEqual(addition.references, ["silkA", "receivedReference"]);
    assert.equal(addition.confidence, "review-required");
    assert.ok(addition.note.includes("逐字复核"));
  }
  for (const id of [1, 16, 38, 41, 67, 81]) {
    const chapter = chapters.find((candidate) => candidate.id === id);
    assert.deepEqual(inspectChapterIntegrity(chapter), []);
  }
});

test("all 513 reconstructed lines have an original modern Chinese translation", () => {
  let lineCount = 0;
  for (const chapter of chapters) {
    assert.equal(chapter.zh.lineByLineTranslation.length, chapter.zh.reconstructedVerse.length, `Chapter ${chapter.id}`);
    chapter.zh.lineByLineTranslation.forEach((translation, index) => {
      assert.match(translation, /\p{Script=Han}{2}/u, `Chapter ${chapter.id}, line ${index + 1}`);
      assert.equal(translation.includes("本章从"), false, `Chapter ${chapter.id}, line ${index + 1} must not use the old summary template`);
    });
    lineCount += chapter.zh.lineByLineTranslation.length;
  }
  assert.equal(lineCount, 513);
});
