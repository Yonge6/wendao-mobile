import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { chapterInspirations, inspirationFor } from "../scripts/chapter-inspirations.mjs";

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

test("places shared inspiration after four life lenses and before life manual", () => {
  const expectedZhLenses = ["焦虑｜", "关系｜", "选择｜", "行动｜"];
  const expectedEnLenses = ["Anxiety ·", "Relationships ·", "Choice ·", "Action ·"];
  assert.equal(chapters.length, 81);
  for (const chapter of chapters) {
    assert.equal(chapter.zh.related.length, 6, `Chapter ${chapter.id} zh related count`);
    assert.equal(chapter.en.related.length, 6, `Chapter ${chapter.id} en related count`);
    expectedZhLenses.forEach((prefix, index) => assert.ok(chapter.zh.related[index].title.startsWith(prefix)));
    expectedEnLenses.forEach((prefix, index) => assert.ok(chapter.en.related[index].title.startsWith(prefix)));
    assert.equal(chapter.zh.related[4].title, "对我们的启发");
    assert.equal(chapter.en.related[4].title, "What this teaches us");
    assert.equal(chapter.zh.related[5].title, "你的人生说明书");
    assert.equal(chapter.en.related[5].title, "Your life manual");
    assert.equal(chapter.zh.related[4].body, inspirationFor(chapter.id).zh);
    assert.equal(chapter.en.related[4].body, inspirationFor(chapter.id).en);
  }
});

test("chapter 8 carries the reference image's six practical directions in original wording", () => {
  const body = inspirationFor(8).zh;
  for (const keyword of ["向下", "柔弱", "利他", "适应", "不争", "时机"]) {
    assert.ok(body.includes(keyword), `Chapter 8 inspiration must include ${keyword}`);
  }
});
