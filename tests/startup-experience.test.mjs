import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("native launch transitions quickly into a branded first-frame placeholder", async () => {
  const [config, index] = await Promise.all([
    readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);

  const duration = Number(config.match(/launchShowDuration:\s*(\d+)/)?.[1]);
  assert.ok(Number.isFinite(duration) && duration <= 250, "launch splash must not impose a long fixed wait");
  assert.match(index, /class="wendao-boot"/);
  assert.match(index, /把真实处境，带回这一章/);
  assert.match(index, /章节 AI 对话 · 可控记忆/);
  assert.match(index, /prefers-reduced-motion/);
});

test("secondary experiences are split out of the first reading bundle", async () => {
  const prototype = await readFile(new URL("../src/Prototype.tsx", import.meta.url), "utf8");
  assert.match(prototype, /lazy\(\(\) => import\("\.\/ShareCardPanel"\)\)/);
  assert.match(prototype, /lazy\(\(\) => import\("\.\/companion\/CompanionPanel"\)\)/);
  assert.match(prototype, /await import\("tz-lookup"\)/);
  assert.doesNotMatch(prototype, /import tzLookup from "tz-lookup"/);
});
