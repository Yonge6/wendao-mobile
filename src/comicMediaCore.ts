/** Bounded recent-comic storage and cancellable media requests, independent of the UI. */
export const COMIC_CACHE_LIMITS = { images: 12, bytes: 16 * 1024 * 1024 } as const;
export const COMIC_MEDIA_TIMEOUT_MS = 25_000;

export type ComicMediaFailure = "offline" | "timeout" | "cancelled" | "unavailable" | "invalid";
export class ComicMediaError extends Error {
  readonly reason: ComicMediaFailure;
  constructor(reason: ComicMediaFailure) {
    super(`COMIC_MEDIA_${reason.toUpperCase()}`);
    this.reason = reason;
    this.name = "ComicMediaError";
  }
}
export type ComicCacheEntry = { url: string; bytes: number; viewedAt: number };
export type ComicCacheStats = { images: number; bytes: number; maxImages: number; maxBytes: number; persistent: boolean };
export interface ComicCacheStorage {
  persistent: boolean;
  index(): Promise<ComicCacheEntry[]>;
  writeIndex(entries: ComicCacheEntry[]): Promise<void>;
  read(url: string): Promise<Blob | null>;
  write(url: string, blob: Blob): Promise<void>;
  remove(url: string): Promise<void>;
}

/** Serialize index mutations: simultaneous inline and enlarged views must not lose entries. */
export class RecentComicCache {
  private pending: Promise<unknown> = Promise.resolve();
  private storage: ComicCacheStorage;
  private now: () => number;
  constructor(storage: ComicCacheStorage, now = Date.now) { this.storage = storage; this.now = now; }
  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation, operation);
    this.pending = result.catch(() => undefined);
    return result;
  }
  get(url: string): Promise<Blob | null> {
    return this.run(async () => {
      const entries = await this.storage.index();
      const entry = entries.find(value => value.url === url);
      if (!entry) return null;
      const blob = await this.storage.read(url);
      if (!blob || blob.type !== "image/webp" || blob.size !== entry.bytes) {
        await this.storage.remove(url);
        await this.storage.writeIndex(entries.filter(value => value.url !== url));
        return null;
      }
      entry.viewedAt = this.now();
      await this.storage.writeIndex(entries);
      return blob;
    });
  }
  put(url: string, blob: Blob): Promise<void> {
    return this.run(async () => {
      if (blob.type !== "image/webp" || blob.size > COMIC_CACHE_LIMITS.bytes) return;
      const entries = (await this.storage.index()).filter(value => value.url !== url);
      entries.push({ url, bytes: blob.size, viewedAt: this.now() });
      entries.sort((a, b) => b.viewedAt - a.viewedAt);
      let total = 0;
      const keep: ComicCacheEntry[] = [];
      const discard: ComicCacheEntry[] = [];
      for (const entry of entries) {
        if (keep.length < COMIC_CACHE_LIMITS.images && total + entry.bytes <= COMIC_CACHE_LIMITS.bytes) {
          keep.push(entry);
          total += entry.bytes;
        } else discard.push(entry);
      }
      await this.storage.write(url, blob);
      for (const entry of discard) await this.storage.remove(entry.url);
      await this.storage.writeIndex(keep);
    });
  }
  stats(): Promise<ComicCacheStats> {
    return this.run(async () => {
      const entries = await this.storage.index();
      return { images: entries.length, bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
        maxImages: COMIC_CACHE_LIMITS.images, maxBytes: COMIC_CACHE_LIMITS.bytes, persistent: this.storage.persistent };
    });
  }
  remove(url: string): Promise<void> {
    return this.run(async () => {
      const entries = await this.storage.index();
      await this.storage.remove(url);
      await this.storage.writeIndex(entries.filter(entry => entry.url !== url));
    });
  }
  clear(): Promise<void> {
    return this.run(async () => {
      for (const entry of await this.storage.index()) await this.storage.remove(entry.url);
      await this.storage.writeIndex([]);
    });
  }
}

export async function fetchComicBlob(url: string, options: {
  type: "image/webp" | "image/png";
  signal?: AbortSignal;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  online?: () => boolean;
}): Promise<Blob> {
  if (options.signal?.aborted) throw new ComicMediaError("cancelled");
  if (options.online?.() === false) throw new ComicMediaError("offline");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let rejectAbort: (reason: Error) => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const cancel = () => { rejectAbort(new ComicMediaError("cancelled")); controller.abort(); };
  options.signal?.addEventListener("abort", cancel, { once: true });
  timer = setTimeout(() => {
    rejectAbort(new ComicMediaError("timeout"));
    controller.abort();
  }, options.timeoutMs ?? COMIC_MEDIA_TIMEOUT_MS);
  try {
    return await Promise.race([aborted, (async () => {
      const response = await (options.fetcher ?? fetch)(url, { signal: controller.signal, cache: "default" });
      if (!response.ok) throw new ComicMediaError("unavailable");
      const blob = await response.blob();
      if (blob.type.split(";")[0] !== options.type || !blob.size) throw new ComicMediaError("invalid");
      // Check the actual format as well as Content-Type: HTML error pages must not become saved images.
      const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      const valid = options.type === "image/png"
        ? header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71 && header[4] === 13 && header[5] === 10 && header[6] === 26 && header[7] === 10
        : String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP";
      if (!valid) throw new ComicMediaError("invalid");
      return blob;
    })()]);
  } catch (error) {
    if (error instanceof ComicMediaError) throw error;
    if (options.signal?.aborted) throw new ComicMediaError("cancelled");
    throw new ComicMediaError(options.online?.() === false ? "offline" : "unavailable");
  } finally {
    clearTimeout(timer!);
    options.signal?.removeEventListener("abort", cancel);
  }
}
