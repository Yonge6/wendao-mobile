import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const english = readFileSync(new URL("../docs/app-store/metadata/en-US.md", import.meta.url), "utf8");
const chinese = readFileSync(new URL("../docs/app-store/metadata/zh-Hans.md", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function field(source, label) {
  return source.match(new RegExp("- " + label + "：?\\s*`([^`]+)`"))?.[1] ?? "";
}

test("App Store names and subtitles lead with Wendao AI within Apple limits", () => {
  const englishName = field(english, "App name:");
  const englishSubtitle = field(english, "Subtitle:");
  const chineseName = field(chinese, "App 名称");
  const chineseSubtitle = field(chinese, "副标题");

  assert.equal(englishName, "Wendao AI: Tao Companion");
  assert.equal(chineseName, "三慢问道：AI 问道");
  assert.ok(englishName.length <= 30);
  assert.ok(englishSubtitle.length <= 30);
  assert.ok(chineseName.length <= 30);
  assert.ok(chineseSubtitle.length <= 30);
});

test("metadata presents AI as the major update and discloses the reading limits", () => {
  assert.match(english, /Not generic chat/);
  assert.match(english, /Today’s chapter and 10 chapters you choose are free/);
  assert.match(english, /Unlock All Chapters Forever/);
  assert.match(english, /biggest update yet/);
  assert.match(chinese, /不是通用聊天/);
  assert.match(chinese, /今日一章与自选 10 章免费/);
  assert.match(chinese, /永久解锁全部章节/);
  assert.match(chinese, /迄今最大的更新/);
  assert.match(index, /三慢问道 AI · 以《道德经》回应真实处境/);
});
