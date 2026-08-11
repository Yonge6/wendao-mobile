import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { chapterInspirations, chapterThemeFor, insightsFor, inspirationFor } from "../scripts/chapter-inspirations.mjs";
import { chapterPracticalInsightDetails } from "../scripts/chapter-practical-insight-details.mjs";
import { chapterPracticalInsights } from "../scripts/chapter-practical-insights.mjs";

const chapters = JSON.parse(await readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"));

test("provides distinct bilingual inspiration for all 81 chapters", () => {
  const inspirations = chapterInspirations.slice(1);
  assert.equal(inspirations.length, 81);
  assert.equal(new Set(inspirations.map((item) => item.zh)).size, 81);
  assert.equal(new Set(inspirations.map((item) => item.en)).size, 81);
  for (let id = 1; id <= 81; id += 1) {
    const inspiration = inspirationFor(id);
    assert.ok(inspiration.zh.length >= 40, `Chapter ${id} Chinese inspiration is too short`);
    assert.ok(inspiration.en.length >= 40, `Chapter ${id} English inspiration is too short`);
  }
});

test("uses a chapter theme and exactly three insights before life manual", () => {
  assert.equal(chapters.length, 81);
  for (const chapter of chapters) {
    assert.equal(chapter.zh.explanation[1].title, "本章主旨");
    assert.equal(chapter.en.explanation[1].title, "Chapter theme");
    assert.deepEqual(chapter.zh.explanation[1].body, chapterThemeFor(chapter.id).zh);
    assert.deepEqual(chapter.en.explanation[1].body, chapterThemeFor(chapter.id).en);
    assert.equal(chapter.zh.related.length, 2, `Chapter ${chapter.id} zh related count`);
    assert.equal(chapter.en.related.length, 2, `Chapter ${chapter.id} en related count`);
    assert.equal(chapter.zh.related[0].title, "对我们的启发");
    assert.equal(chapter.en.related[0].title, "What this teaches us");
    assert.equal(chapter.zh.related[1].title, "你的人生说明书");
    assert.equal(chapter.en.related[1].title, "Your life manual");
    const expected = insightsFor(chapter.id);
    assert.deepEqual(chapter.zh.related[0].points, expected.zh);
    assert.deepEqual(chapter.en.related[0].points, expected.en);
    assert.equal(chapter.zh.related[0].points.length, 3);
    assert.equal(chapter.en.related[0].points.length, 3);
  }
});

test("uses distinct substantial bilingual insight paragraphs instead of shared frames", () => {
  const insights = chapterPracticalInsights.slice(1);
  assert.equal(insights.length, 81);
  const chinese = insights.flatMap((item) => item.zh);
  const english = insights.flatMap((item) => item.en);
  assert.equal(chinese.length, 243);
  assert.equal(english.length, 243);
  assert.equal(new Set(chinese).size, 243);
  assert.equal(new Set(english).size, 243);
  for (const [index, paragraph] of chinese.entries()) {
    assert.ok([...paragraph].length >= 90, `Chinese insight ${index + 1} is too short`);
    assert.doesNotMatch(paragraph, /先辨认现实|再检视选择|最后落到行动/);
  }
  for (const [index, paragraph] of english.entries()) {
    assert.ok(paragraph.trim().split(/\s+/).length >= 45, `English insight ${index + 1} is too short`);
    assert.doesNotMatch(paragraph, /Begin with reality|Then examine the choice|Finally, make it practical/);
  }
});

test("keeps every added practical detail chapter-specific", () => {
  const details = chapterPracticalInsightDetails.slice(1);
  assert.equal(details.length, 81);
  const chinese = details.flatMap((item) => item.zh);
  const english = details.flatMap((item) => item.en);
  assert.equal(chinese.length, 243);
  assert.equal(english.length, 243);
  assert.equal(new Set(chinese).size, 243);
  assert.equal(new Set(english).size, 243);
});

test("chapter 8 carries the reference image's six practical directions in original wording", () => {
  const body = chapterThemeFor(8).zh;
  for (const keyword of ["向下", "柔弱", "利他", "适应", "不争", "时机"]) {
    assert.ok(body.includes(keyword), `Chapter 8 inspiration must include ${keyword}`);
  }
});
