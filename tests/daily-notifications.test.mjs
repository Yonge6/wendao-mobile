import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("daily encounters are opt-in, scheduled at 08:00, and refresh from canonical chapters", async () => {
  const [notifications, daily, prototype, chapters, widget] = await Promise.all([
    readFile(new URL("../src/dailyNotifications.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/dailyEncounter.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/Prototype.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/data/chapters.json", import.meta.url), "utf8"),
    readFile(new URL("../ios/WendaoWidget/WendaoWidget.swift", import.meta.url), "utf8"),
  ]);

  assert.match(notifications, /DAILY_NOTIFICATION_HOUR = 8/);
  assert.match(notifications, /SCHEDULE_DAYS = 60/);
  assert.match(notifications, /requestPermissions/);
  assert.match(notifications, /LocalNotifications\.schedule/);
  assert.match(notifications, /今日偶遇｜三慢问道/);
  assert.match(daily, /import \{ chapters \} from "\.\/data\/chapters"/);
  assert.match(prototype, /每日今日偶遇/);
  assert.match(prototype, /dailyNotificationsEnabled\(\) \? "enabled" : "disabled"/);
  assert.equal(JSON.parse(chapters).length, 81);
  assert.match(widget, /Bundle\.main\.url\(forResource: "chapters"/);
  assert.match(widget, /com\.yonge6\.wendao:\/\/chapter/);
});

test("a fresh install defaults to non-night reading without overwriting a saved choice", async () => {
  const prototype = await readFile(new URL("../src/Prototype.tsx", import.meta.url), "utf8");
  assert.match(prototype, /stored === "light" \|\| stored === "dark"/);
  assert.match(prototype, /function loadTheme\(\)[\s\S]*return "light";/);
  assert.doesNotMatch(prototype, /prefers-color-scheme: dark/);
});
