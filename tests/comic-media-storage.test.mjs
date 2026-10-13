import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";
import * as core from "../src/comicMediaCore.ts";

class TestFileReader {
  readAsDataURL(blob) { void blob.arrayBuffer().then(buffer => {
    this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
    this.onload?.();
  }); }
  abort() { this.onabort?.(); }
}
function moduleWith({ native = false, files = new Map(), browserCache = new Map(), unavailable = false, previews = [] } = {}) {
  let requests = 0;
  const context = { ...core, Blob, Response, URL, Uint8Array, FileReader: TestFileReader, atob,
    window: { location: { href: "https://wendao.wonderelian.com/" } }, navigator: { onLine: true },
    Capacitor: { isNativePlatform: () => native }, Directory: { Cache: "CACHE" }, Encoding: { UTF8: "utf8" },
    Filesystem: {
      readFile: async ({ path }) => { if (!files.has(path)) throw new Error("Not found"); return { data: files.get(path) }; },
      writeFile: async ({ path, data }) => { files.set(path, data); },
      deleteFile: async ({ path }) => { files.delete(path); },
    },
    caches: { open: async () => { if (unavailable) throw new Error("Storage quota"); return {
      match: async url => browserCache.get(url)?.clone(), put: async (url, response) => { browserCache.set(url, response.clone()); },
      delete: async url => browserCache.delete(url),
    }; } },
    exports: {},
  };
  // Use the production format/timeout loader with a deterministic network response.
  context.fetchComicBlob = (url, options) => core.fetchComicBlob(url, { ...options, fetcher: async () => {
    requests++;
    const blob = options.type === "image/webp"
      ? previews.shift() ?? new Blob(["RIFF0000WEBPpreview"], { type: "image/webp" })
      : new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
    return new Response(blob, { headers: { "Content-Type": blob.type } });
  } });
  const code = stripTypeScriptTypes(readFileSync(new URL("../src/comicMedia.ts", import.meta.url), "utf8"))
    .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
  vm.runInNewContext(`${code}\nObject.assign(exports, { getComicCacheStats, clearComicCache, invalidateComicPreview, loadComicPreview, loadComicOriginalDataUrl });`, context);
  return { api: context.exports, navigator: context.navigator, requests: () => requests };
}

for (const native of [false, true]) test(`${native ? "Capacitor Filesystem" : "H5 Cache API"} reuses a viewed WebP offline after restart and clear leaves unrelated storage alone`, async () => {
  const files = new Map([["other-app-file", "keep"]]);
  const browserCache = new Map([["https://other.invalid/", new Response("keep")]]);
  const first = moduleWith({ native, files, browserCache });
  const url = "https://wendao.wonderelian.com/assets/wendao/comics/example.webp";
  const firstBlob = await first.api.loadComicPreview(url, new AbortController().signal);
  assert.equal(first.requests(), 1);
  assert.equal((await first.api.getComicCacheStats()).images, 1);
  const restarted = moduleWith({ native, files, browserCache });
  restarted.navigator.onLine = false;
  const cachedBlob = await restarted.api.loadComicPreview(url, new AbortController().signal);
  assert.equal(await cachedBlob.text(), await firstBlob.text());
  assert.equal(restarted.requests(), 0);
  await restarted.api.clearComicCache();
  assert.equal((await restarted.api.getComicCacheStats()).images, 0);
  assert.equal(files.get("other-app-file"), "keep");
  assert.equal(await browserCache.get("https://other.invalid/").clone().text(), "keep");
  await assert.rejects(restarted.api.loadComicPreview(url, new AbortController().signal), error => error.reason === "offline");
});

test("storage-unavailable browser can read online and never treats failure as a successful persistent cache", async () => {
  const module = moduleWith({ unavailable: true });
  assert.equal((await module.api.loadComicPreview("/example.webp", new AbortController().signal)).type, "image/webp");
  assert.equal((await module.api.getComicCacheStats()).persistent, false);
});

test("requesting an original returns exact PNG data without adding it to recent-image storage", async () => {
  const module = moduleWith();
  assert.equal(module.requests(), 0);
  const original = await module.api.loadComicOriginalDataUrl("/example.png", new AbortController().signal);
  assert.equal(original, "data:image/png;base64,iVBORw0KGgo=");
  assert.equal(module.requests(), 1);
  assert.equal((await module.api.getComicCacheStats()).images, 0);
});

for (const native of [false, true]) test(`${native ? "native" : "web"} retry evicts only the undecodable WebP and fetches its replacement`, async () => {
  const malformed = new Blob(["RIFF0000WEBP", "truncated-pixels"], { type: "image/webp" });
  const repaired = new Blob(["RIFF0000WEBP", "repaired-pixels"], { type: "image/webp" });
  const module = moduleWith({ native, previews: [malformed, repaired] });
  const url = "https://wendao.wonderelian.com/assets/wendao/comics/failed.webp";
  assert.equal(await (await module.api.loadComicPreview(url, new AbortController().signal)).text(), await malformed.text());
  // Mirrors the browser decode-error notification, rather than treating the RIFF header as proof of usable pixels.
  await module.api.invalidateComicPreview(url);
  assert.equal((await module.api.getComicCacheStats()).images, 0);
  assert.equal(await (await module.api.loadComicPreview(url, new AbortController().signal, { refresh: true })).text(), await repaired.text());
  assert.equal(module.requests(), 2);
  module.navigator.onLine = false;
  assert.equal(await (await module.api.loadComicPreview(url, new AbortController().signal)).text(), await repaired.text());
  assert.equal(module.requests(), 2);
  assert.equal((await module.api.getComicCacheStats()).images, 1);
});
