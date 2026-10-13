import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { ComicMediaError, RecentComicCache, fetchComicBlob, type ComicCacheEntry, type ComicCacheStorage } from "./comicMediaCore";

const CACHE_NAME = "wendao-recent-comics-v1";
const INDEX_URL = "https://wendao.wonderelian.com/__comic_cache_index__";
const CACHE_DIRECTORY = "wendao-recent-comics-v1";
const INDEX_PATH = `${CACHE_DIRECTORY}/index.json`;

function validIndex(value: unknown): ComicCacheEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ComicCacheEntry => entry && typeof entry.url === "string"
    && /^https?:/.test(entry.url) && Number.isFinite(entry.bytes) && entry.bytes > 0 && Number.isFinite(entry.viewedAt));
}
function absoluteUrl(url: string): string { return new URL(url, window.location.href).toString(); }
function filePath(url: string): string {
  // FNV-1a filename; URL remains in the index, so collisions are never treated as a cache hit.
  let hash = 2166136261;
  for (const character of url) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `${CACHE_DIRECTORY}/${(hash >>> 0).toString(16)}-${encodeURIComponent(new URL(url).pathname.split("/").pop() ?? "comic")}`;
}
export async function blobDataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) throw new ComicMediaError("cancelled");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cancel = () => { reader.abort(); reject(new ComicMediaError("cancelled")); };
    signal?.addEventListener("abort", cancel, { once: true });
    const cleanup = () => signal?.removeEventListener("abort", cancel);
    reader.onload = () => { cleanup(); resolve(String(reader.result)); };
    reader.onerror = () => { cleanup(); reject(new ComicMediaError("invalid")); };
    reader.onabort = () => { cleanup(); reject(new ComicMediaError("cancelled")); };
    reader.readAsDataURL(blob);
  });
}
function base64Blob(data: string): Blob {
  const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
  return new Blob([bytes], { type: "image/webp" });
}

function storage(): ComicCacheStorage {
  if (Capacitor.isNativePlatform()) return {
    persistent: true,
    async index() {
      try { const { data } = await Filesystem.readFile({ path: INDEX_PATH, directory: Directory.Cache, encoding: Encoding.UTF8 });
        return validIndex(JSON.parse(String(data))); } catch { return []; }
    },
    async writeIndex(entries) { await Filesystem.writeFile({ path: INDEX_PATH, directory: Directory.Cache, encoding: Encoding.UTF8, data: JSON.stringify(entries), recursive: true }); },
    async read(url) { try { const { data } = await Filesystem.readFile({ path: filePath(url), directory: Directory.Cache });
      return typeof data === "string" ? base64Blob(data) : data; } catch { return null; } },
    async write(url, blob) { const data = await blobDataUrl(blob); await Filesystem.writeFile({ path: filePath(url), directory: Directory.Cache, data: data.split(",")[1], recursive: true }); },
    async remove(url) { await Filesystem.deleteFile({ path: filePath(url), directory: Directory.Cache }).catch(() => undefined); },
  };
  if (typeof caches !== "undefined") return {
    persistent: true,
    async index() { const cache = await caches.open(CACHE_NAME); const response = await cache.match(INDEX_URL);
      return response ? validIndex(await response.json()) : []; },
    async writeIndex(entries) { await (await caches.open(CACHE_NAME)).put(INDEX_URL, Response.json(entries)); },
    async read(url) { return (await (await caches.open(CACHE_NAME)).match(url))?.blob() ?? null; },
    async write(url, blob) { await (await caches.open(CACHE_NAME)).put(url, new Response(blob, { headers: { "Content-Type": "image/webp" } })); },
    async remove(url) { await (await caches.open(CACHE_NAME)).delete(url); },
  };
  const blobs = new Map<string, Blob>();
  let entries: ComicCacheEntry[] = [];
  return { persistent: false, index: async () => entries.map(entry => ({ ...entry })), writeIndex: async value => { entries = value; },
    read: async url => blobs.get(url) ?? null, write: async (url, blob) => { blobs.set(url, blob); }, remove: async url => { blobs.delete(url); } };
}
let cache: RecentComicCache | undefined;
const recentCache = () => cache ??= new RecentComicCache(storage());

export async function getComicCacheStats() {
  try { return await recentCache().stats(); }
  catch { return { images: 0, bytes: 0, maxImages: 12, maxBytes: 16 * 1024 * 1024, persistent: false }; }
}
export async function clearComicCache(): Promise<void> { await recentCache().clear(); }
export async function invalidateComicPreview(url: string): Promise<void> {
  await recentCache().remove(absoluteUrl(url)).catch(() => undefined);
}

export async function loadComicPreview(url: string, signal: AbortSignal, options: { refresh?: boolean } = {}): Promise<Blob> {
  const key = absoluteUrl(url);
  if (options.refresh) await recentCache().remove(key).catch(() => undefined);
  const cached = options.refresh ? null : await recentCache().get(key).catch(() => null);
  if (signal.aborted) throw new ComicMediaError("cancelled");
  if (cached) return cached;
  const blob = await fetchComicBlob(url, { type: "image/webp", signal, online: () => navigator.onLine });
  if (signal.aborted) throw new ComicMediaError("cancelled");
  // Cache failure must never prevent reading (private mode, storage quota, or OS eviction).
  await recentCache().put(key, blob).catch(() => undefined);
  return blob;
}

/** Original PNGs are deliberately absent from the persistent preview cache. Call on save/share only. */
export async function loadComicOriginalDataUrl(url: string, signal: AbortSignal): Promise<string> {
  return blobDataUrl(await fetchComicBlob(url, { type: "image/png", signal, online: () => navigator.onLine }), signal);
}
