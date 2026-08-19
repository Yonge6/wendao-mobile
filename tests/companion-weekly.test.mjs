import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildWeeklyReflectionMessages, calendarWeekPeriod, compactWeeklySource } from "../api/_lib/weekly.mjs";

test("weekly periods begin on Monday UTC", () => {
  assert.deepEqual(calendarWeekPeriod(new Date("2026-08-19T12:00:00Z")), {
    start: "2026-08-17",
    end: "2026-08-24",
    since: "2026-08-10T00:00:00.000Z",
  });
});

test("weekly prompt is grounded and asks for one observable practice", () => {
  const prompt = buildWeeklyReflectionMessages({
    locale: "zh",
    messages: [{ role: "user", content: "临近收尾时我总想加速。" }],
    memories: [{ kind: "recurring_theme", summary: "接近完成时容易加速" }],
    chapters: [{ id: 64, text: ["慎终如始"] }],
  });
  assert.match(prompt[0].content, /只使用给定资料/);
  assert.match(prompt[0].content, /小而可观察的实践/);
  assert.match(prompt[1].content, /慎终如始/);
});

test("weekly source is bounded before it reaches the model", () => {
  const source = compactWeeklySource(
    Array.from({ length: 30 }, (_, index) => ({ role: "user", content: `${index}:${"x".repeat(2_000)}`, chapter_id: 64 })),
    Array.from({ length: 20 }, (_, index) => ({ kind: "recurring_theme", summary: `${index}:${"y".repeat(700)}` })),
  );
  assert.equal(source.messages.length, 24);
  assert.equal(source.memories.length, 12);
  assert.ok(source.messages.every((message) => message.content.length <= 1_200));
  assert.ok(source.memories.every((memory) => memory.summary.length <= 500));
});

test("weekly reflection writes are server-only and require entitlement", async () => {
  const sql = (await readFile(new URL("../supabase/migrations/202608190004_wendao_weekly_reflection.sql", import.meta.url), "utf8"))
    .replace(/\s+/g, " ").toLowerCase();
  assert.match(sql, /entitlement\.status in \('active', 'grace'\)/);
  assert.match(sql, /on conflict \(user_id, week_start\) do update/);
  assert.match(sql, /revoke all on function public\.save_wendao_weekly_reflection[^;]+from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.save_wendao_weekly_reflection[^;]+to service_role/);
});
