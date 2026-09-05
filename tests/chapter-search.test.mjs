import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeSearch, searchChapters, searchExcerpt } from "../src/chapterSearch.ts";
const chapters = JSON.parse(readFileSync(new URL("../src/data/chapters.json", import.meta.url), "utf8"));

test("empty search preserves the complete silk order", () => {
  assert.deepEqual(searchChapters(chapters, "  ", "zh").map(({ chapter }) => chapter.id), chapters.map(({ id }) => id));
});
test("title matches rank first and numeric lookup does not match partial numbers", () => {
  assert.equal(searchChapters(chapters, "上善如水", "zh")[0].chapter.id, 8);
  const numbers = searchChapters(chapters, "8", "zh");
  assert.equal(numbers[0].chapter.id, 8);
  assert.ok(numbers.every(({ chapter }) => chapter.id === 8 || Number(chapter.silkOrder) === 8));
  assert.equal(searchChapters(chapters, "999", "zh").length, 0);
});
test("every result explains a real matching field, never a concatenation boundary", () => {
  const results = searchChapters(chapters, "关系", "zh");
  assert.ok(results.length > 1);
  assert.ok(results.every(({ match }) => match.normalized.includes("关系") && match.label.zh));
  const sample = structuredClone(chapters[0]);
  sample.zh.title = "onlyboundaryprefix";
  sample.theme.zh = "onlyboundarysuffix";
  assert.equal(searchChapters([sample], "onlyboundaryprefixonlyboundarysuffix", "zh").length, 0);
});
test("search includes references, translation and cross-language text", () => {
  for (const chapter of [chapters[0], chapters[10]]) {
    for (const text of [chapter.sources.silkBTranscription, chapter.sources.receivedReference, chapter.zh.lineByLineTranslation[0]]) {
      assert.ok(searchChapters(chapters, text.slice(0, 14), "zh").some((result) => result.chapter.id === chapter.id));
    }
    const result = searchChapters([chapter], chapter.en.verse[0].toUpperCase(), "zh")[0];
    assert.equal(result.match.language, "en");
  }
});
test("excerpt preserves case and whitespace, and includes a late match", () => {
  assert.equal(normalizeSearch(" 上 善 如水 "), "上善如水");
  const excerpt = searchExcerpt("起".repeat(100) + "上 善 如水" + "末".repeat(100), "上善如水", 10);
  assert.equal(excerpt.highlight, "上 善 如水");
  assert.ok(excerpt.before.startsWith("…") && excerpt.after.endsWith("…"));
  assert.equal(searchExcerpt("A literal [a+b] term", "[a+b]").highlight, "[a+b]");
  assert.equal(searchExcerpt("Try Water today", "WATER").highlight, "Water");
  assert.equal(searchExcerpt("😀 Water", "Water", 1).before, "… ");
});
