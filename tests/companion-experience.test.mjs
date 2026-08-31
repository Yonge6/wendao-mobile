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
  assert.match(panel, /event\.key !== "Enter" \|\| event\.shiftKey/);
  assert.doesNotMatch(panel, /本月 \$\{state\.usage\.used_questions\}/);
  assert.doesNotMatch(panel, /wendao_usage_periods/);
  assert.doesNotMatch(panel, /Enter 发送 · Shift\+Enter 换行/);
  assert.match(panel, /<\/form>\s*<div className="companion-compose-meta">[\s\S]*?<p className="companion-response-status"/);
  assert.match(panel, /复制回应/);
  assert.match(panel, /分享图片/);
  assert.doesNotMatch(panel, /继续追问/);
  assert.match(css, /width:\s*min\(1040px, calc\(100vw - 32px\)\)/);
  assert.match(
    css,
    /@media \(max-width: 720px\) \{[\s\S]*?\.companion-question-form textarea,[\s\S]*?\.companion-delete-confirmation input\s*\{[\s\S]*?font-size:\s*16px/,
  );
  assert.match(css, /\.companion-message-content strong/);
  assert.match(css, /\.companion-message-actions\s*\{[^}]*justify-content:\s*flex-end/s);
  assert.match(css, /\.companion-response-status\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.companion-home-actions:empty\s*\{[\s\S]*?display:\s*none/);
  assert.doesNotMatch(css, /\.companion-compose-zone\s*\{[^}]*border-top:/s);
  assert.doesNotMatch(panel, /companion-status-row/);
  assert.doesNotMatch(panel, /会员有效/);
  assert.match(panel, /aria-label=\{isZh \? "打开问道设置"/);
  assert.match(panel, /role="menu"/);
  assert.doesNotMatch(panel, /className="companion-tools"/);
  assert.match(css, /--companion-usable-height:\s*min\(/);
  assert.match(css, /calc\(100dvh - var\(--companion-viewport-top, 0px\)\)/);
  assert.match(css, /\.companion-dialog\s*\{[^}]*--companion-control-top:/s);
  assert.match(css, /\.companion-dialog-header > button\s*\{[^}]*top:\s*var\(--companion-control-top\)/s);
  assert.match(css, /\.companion-settings\s*\{[^}]*top:\s*var\(--companion-control-top\)/s);
  assert.match(css, /\.companion-settings\s*\{[^}]*right:\s*calc\(var\(--companion-control-right\) \+ var\(--companion-control-size\) \+ 8px\)/s);
  assert.match(css, /\.companion-home\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.companion-home\s*\{[^}]*grid-template-areas:[\s\S]*?"thread"[\s\S]*?"compose"/s);
  assert.match(css, /\.companion-compose-zone\s*\{[^}]*grid-area:\s*compose/s);
  assert.match(css, /\.companion-question-form textarea\s*\{[^}]*height:\s*52px[^}]*max-height:\s*52px/s);
  assert.doesNotMatch(panel, /input\.style\.height/);
  assert.match(panel, /className="companion-thinking-dots"/);
  assert.match(css, /@keyframes companion-thinking-pulse/);
});

test("memory actions explain their effect and require confirmation", async () => {
  const [memoryPanel, accountPanel, css] = await Promise.all([
    readFile(new URL("../src/companion/MemoryPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/companion/AccountPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/prototype.css", import.meta.url), "utf8"),
  ]);

  assert.match(memoryPanel, /不再用于后续回答/);
  assert.match(memoryPanel, /历史对话不会被删除/);
  assert.match(memoryPanel, /window\.confirm/);
  assert.doesNotMatch(memoryPanel, /这件事已过去/);
  assert.match(accountPanel, /返回对话/);
  assert.match(css, /\.companion-memory-panel > \.companion-text-button,[\s\S]*?justify-self:\s*start/s);
});

test("conversation image sharing reuses the chapter poster and canonical QR flow", async () => {
  const [panel, prototype, sharePanel, shareCard] = await Promise.all([
    readFile(new URL("../src/companion/CompanionPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Prototype.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/ShareCardPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/shareCard.ts", import.meta.url), "utf8"),
  ]);

  assert.match(panel, /onShareAnswer\?\.\(message\.content\)/);
  assert.match(prototype, /title=\{companionShare/);
  assert.match(sharePanel, /buildCompanionShareCardContent/);
  assert.match(shareCard, /shareChapterUrl\(chapter\.id, "inspiration", language\)/);
  assert.match(shareCard, /const hasSecondary = Boolean\(content\.secondary\.trim\(\)\)/);
  assert.match(shareCard, /secondaryLabel: ""/);
  assert.match(shareCard, /chapterTitle: ""/);
  assert.match(shareCard, /content\.chapterTitle\.trim\(\) \? 490 : 320/);
  assert.match(shareCard, /QRCode\.toCanvas/);
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
