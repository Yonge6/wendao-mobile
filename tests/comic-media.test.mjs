import assert from "node:assert/strict";
import test from "node:test";
import { COMIC_CACHE_LIMITS, ComicMediaError, RecentComicCache, fetchComicBlob } from "../src/comicMediaCore.ts";

const webp = (size = 64) => new Blob(["RIFF", "0000", "WEBP", new Uint8Array(Math.max(0, size - 12))], { type: "image/webp" });
const png = () => new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], { type: "image/png" });
const response = blob => new Response(blob, { headers: { "Content-Type": blob.type } });
function memoryStorage() {
  let entries = [];
  const blobs = new Map();
  return { persistent: true, blobs,
    index: async () => structuredClone(entries), writeIndex: async value => { entries = structuredClone(value); },
    read: async url => blobs.get(url) ?? null, write: async (url, blob) => { blobs.set(url, blob); }, remove: async url => { blobs.delete(url); } };
}

test("recent comic cache survives a new reader instance, touches LRU and evicts the oldest preview", async () => {
  const storage = memoryStorage();
  let time = 1;
  const cache = new RecentComicCache(storage, () => time++);
  for (let index = 0; index < COMIC_CACHE_LIMITS.images; index++) await cache.put(`https://test.invalid/${index}.webp`, webp());
  const reopened = new RecentComicCache(storage, () => time++);
  assert.equal((await reopened.get("https://test.invalid/0.webp")).size, 64);
  await reopened.put("https://test.invalid/new.webp", webp());
  assert.equal(await reopened.get("https://test.invalid/1.webp"), null);
  assert.ok(await reopened.get("https://test.invalid/0.webp"));
  assert.deepEqual(await reopened.stats(), { images: 12, bytes: 12 * 64, maxImages: 12, maxBytes: 16 * 1024 * 1024, persistent: true });
  await reopened.clear();
  assert.equal(storage.blobs.size, 0);
  assert.equal((await cache.stats()).images, 0);
});

test("cache enforces byte limit during concurrent writes and excludes originals", async () => {
  const storage = memoryStorage();
  const cache = new RecentComicCache(storage);
  await Promise.all(Array.from({ length: 9 }, (_, index) => cache.put(`https://test.invalid/${index}.webp`, webp(3 * 1024 * 1024))));
  const stats = await cache.stats();
  assert.equal(stats.images, 5);
  assert.ok(stats.bytes <= COMIC_CACHE_LIMITS.bytes);
  await cache.put("https://test.invalid/original.png", png());
  assert.equal(await cache.get("https://test.invalid/original.png"), null);
  assert.equal((await cache.stats()).images, 5);
});

test("OS-evicted or corrupted cached images become misses and are removed from statistics", async () => {
  const storage = memoryStorage();
  const cache = new RecentComicCache(storage);
  await cache.put("https://test.invalid/old.webp", webp());
  storage.blobs.delete("https://test.invalid/old.webp");
  assert.equal(await cache.get("https://test.invalid/old.webp"), null);
  assert.equal((await cache.stats()).images, 0);
});

test("format verification accepts PNG originals and WebP previews, rejects mislabeled error pages", async () => {
  assert.equal((await fetchComicBlob("preview", { type: "image/webp", fetcher: async () => response(webp()) })).type, "image/webp");
  assert.equal((await fetchComicBlob("original", { type: "image/png", fetcher: async () => response(png()) })).type, "image/png");
  await assert.rejects(fetchComicBlob("bad", { type: "image/png", fetcher: async () => response(new Blob(["<html>server error</html>"], { type: "image/png" })) }), error => error instanceof ComicMediaError && error.reason === "invalid");
  await assert.rejects(fetchComicBlob("failed", { type: "image/webp", fetcher: async () => new Response("missing", { status: 404 }) }), error => error.reason === "unavailable");
});

test("timeout covers stalled response bodies and aborts the request", async () => {
  let requestSignal;
  await assert.rejects(fetchComicBlob("slow", { type: "image/png", timeoutMs: 15, fetcher: async (_url, { signal }) => {
    requestSignal = signal;
    return { ok: true, blob: () => new Promise(() => {}) };
  } }), error => error.reason === "timeout");
  assert.equal(requestSignal.aborted, true);
});

test("cancellation on close stops a pending original and offline requests never start a fetch", async () => {
  const controller = new AbortController();
  let requestSignal;
  const request = fetchComicBlob("pending", { type: "image/png", signal: controller.signal, fetcher: async (_url, { signal }) => {
    requestSignal = signal;
    return new Promise(() => {});
  } });
  controller.abort();
  await assert.rejects(request, error => error.reason === "cancelled");
  assert.equal(requestSignal.aborted, true);
  let called = false;
  await assert.rejects(fetchComicBlob("offline", { type: "image/webp", online: () => false, fetcher: async () => { called = true; return response(webp()); } }), error => error.reason === "offline");
  assert.equal(called, false);
});
