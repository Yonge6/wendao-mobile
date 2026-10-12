import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { removeBundledComics } from "../scripts/prepare-ios-web-bundle.mjs";

test("native bundle preparation removes comic media without touching other assets", async () => {
  const webDir = await mkdtemp(path.join(os.tmpdir(), "wendao-ios-bundle-"));
  const comicsDir = path.join(webDir, "assets", "wendao", "comics");
  const otherAsset = path.join(webDir, "assets", "wendao", "app-icon.png");
  await mkdir(comicsDir, { recursive: true });
  await writeFile(path.join(comicsDir, "chapter-1-qr.png"), "original");
  await writeFile(path.join(comicsDir, "chapter-1-qr.webp"), "display");
  await writeFile(otherAsset, "keep");

  const result = await removeBundledComics(webDir);

  assert.equal(result.removedFiles, 2);
  await assert.rejects(stat(comicsDir));
  assert.equal(await readFile(otherAsset, "utf8"), "keep");
});

test("native comic URLs use the public origin while web keeps same-origin paths", async () => {
  const source = await readFile(new URL("../src/lifeStoryAssets.ts", import.meta.url), "utf8");
  assert.match(source, /surface === "web"/);
  assert.match(source, /new URL\(path, CANONICAL_URL\)/);
});
