import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { filterLifeStories } from "../src/lifeStoryBrowse.ts";

const stories = JSON.parse(readFileSync(new URL("../growth/copy.json", import.meta.url), "utf8"));
const filters = {query:"",theme:"",chapter:"",kind:"comic"};
test("comic collection covers every chapter while archived essays remain available", () => {
  const comics = filterLifeStories(stories, filters);
  assert.equal(comics.length, 81);
  assert.equal(new Set(comics.map(s=>s.chapter)).size, 81);
  const essays = filterLifeStories(stories, {...filters,kind:"essay"});
  assert.equal(comics.length + essays.length, stories.length);
  assert.ok(essays.every(s=>!s.comic));
});
test("chapter, theme and normalized search combine without changing canonical stories", () => {
  const story = stories.find(s=>s.comic && s.chapter===32);
  const result = filterLifeStories(stories,{...filters,chapter:"32",theme:story.theme,query:story.title});
  assert.deepEqual(result,[story]);
  assert.ok(filterLifeStories(stories,{...filters,query:"３２"}).every(s=>s.chapter===32));
  assert.deepEqual(filterLifeStories(stories,{...filters,chapter:"32",theme:"missing"}),[]);
});
