import assert from "node:assert/strict";
import test from "node:test";

import {
  FREE_CHAPTER_LIMIT,
  chapterIsReadable,
  freeChapterSlotsRemaining,
  keepFreeChapter,
  loadFreeChapterIds,
} from "../src/readingAccess.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("today's chapter is free without consuming one of ten choices", () => {
  assert.equal(chapterIsReadable({ chapterId: 64, dailyChapterId: 64, freeChapterIds: [], hasFullAccess: false }), true);
  assert.equal(freeChapterSlotsRemaining([]), FREE_CHAPTER_LIMIT);
});

test("only ten deliberately kept chapters are stored", () => {
  const storage = memoryStorage();
  for (let chapterId = 1; chapterId <= 12; chapterId += 1) keepFreeChapter(chapterId, storage);
  assert.deepEqual(loadFreeChapterIds(storage), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(freeChapterSlotsRemaining(loadFreeChapterIds(storage)), 0);
});

test("full access unlocks any chapter while free choices remain limited", () => {
  assert.equal(chapterIsReadable({ chapterId: 81, dailyChapterId: 1, freeChapterIds: [2], hasFullAccess: false }), false);
  assert.equal(chapterIsReadable({ chapterId: 81, dailyChapterId: 1, freeChapterIds: [2], hasFullAccess: true }), true);
});
