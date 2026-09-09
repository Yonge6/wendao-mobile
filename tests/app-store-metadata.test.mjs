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

  assert.equal(englishName, "Wendao AI: Daodejing");
  assert.equal(chineseName, "三慢问道 AI：道德经");
  assert.ok(englishName.length <= 30);
  assert.ok(englishSubtitle.length <= 30);
  assert.ok(chineseName.length <= 30);
  assert.ok(chineseSubtitle.length <= 30);
});

test("metadata presents chapter-grounded AI and discloses the reading limits", () => {
  assert.match(english, /Laozi’s wisdom/);
  assert.match(english, /Today’s chapter and 10 chapters you choose are free/);
  assert.match(english, /Unlock All Chapters Forever/);
  assert.match(english, /What's New in Version 1.8/);
  assert.match(chinese, /借老子的智慧/);
  assert.match(chinese, /今日一章与自选 10 章免费/);
  assert.match(chinese, /永久解锁全部章节/);
  assert.match(chinese, /版本 1.8 更新说明/);
  assert.match(index, /三慢问道 AI · 以《道德经》回应真实处境/);
});


test("store copy stays within field limits and states AI and purchase boundaries", () => {
  for (const [source, promo, description, keywords] of [
    [english, "Promotional text", "Description", "Keywords"],
    [chinese, "推广文本", "描述", "关键词"],
  ]) {
    const section = (heading) => source.split(`## ${heading}\n`)[1].split("\n## ")[0].trim();
    assert.ok(section(promo).length <= 170);
    assert.ok(section(description).length <= 4000);
    assert.ok(section(keywords).replaceAll("`", "").length <= 100);
  }
  assert.match(english, /not the historical Laozi/);
  assert.match(chinese, /不是历史上的老子/);
  assert.match(english, /AI services are not included/);
  assert.match(chinese, /此购买不含 AI 服务/);
});
