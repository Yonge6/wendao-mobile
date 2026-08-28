import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("conversation renders emphasis as typography and keeps the reading area dominant", async () => {
  const [panel, css] = await Promise.all([
    readFile(new URL("../src/companion/CompanionPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/prototype.css", import.meta.url), "utf8"),
  ]);

  assert.match(panel, /<strong key=/);
  assert.match(panel, /part\.replace\(\/\\\*\\\*\/g, ""\)/);
  assert.match(panel, /Enter 发送 · Shift\+Enter 换行/);
  assert.match(panel, /复制回应/);
  assert.match(css, /width:\s*min\(1040px, calc\(100vw - 32px\)\)/);
  assert.match(css, /\.companion-message-content strong/);
});

test("weekly reflection explains actionable failure reasons", async () => {
  const [panel, endpoint] = await Promise.all([
    readFile(new URL("../src/companion/WeeklyReflectionPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../api/companion/weekly-reflection.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(panel, /本周还没有足够的有效对话/);
  assert.match(panel, /登录状态已经失效/);
  assert.match(panel, /AI 服务刚才没有完成生成/);
  assert.match(endpoint, /provider\.visibleFallback/);
  assert.match(endpoint, /weekly_ai_unavailable/);
});

