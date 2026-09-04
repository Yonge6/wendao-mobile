export const FREE_CHAPTER_LIMIT = 10;
export const FREE_CHAPTERS_STORAGE_KEY = "wendao-free-chapters-v1";
export const READING_ACCESS_CHANGED_EVENT = "wendao:reading-access-changed";

export type ReadingAccessState = {
  freeChapterIds: number[];
  hasFullAccess: boolean;
};

export type ReadingMembershipEntitlement = {
  status: string;
  expires_at: string | null;
};

export function membershipEntitlementIsActive(
  entitlement: ReadingMembershipEntitlement | null,
  now = Date.now(),
): boolean {
  if (!entitlement || !["active", "grace"].includes(entitlement.status)) return false;
  if (!entitlement.expires_at) return entitlement.status === "active";
  const expiresAt = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

function validChapterIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is number => (
    Number.isInteger(item) && item >= 1 && item <= 81
  )))].slice(0, FREE_CHAPTER_LIMIT);
}

export function loadFreeChapterIds(storage: Storage = window.localStorage): number[] {
  try {
    return validChapterIds(JSON.parse(storage.getItem(FREE_CHAPTERS_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function keepFreeChapter(chapterId: number, storage: Storage = window.localStorage): number[] {
  const current = loadFreeChapterIds(storage);
  if (current.includes(chapterId)) return current;
  if (current.length >= FREE_CHAPTER_LIMIT) return current;
  const next = [...current, chapterId];
  storage.setItem(FREE_CHAPTERS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function chapterIsReadable({
  chapterId,
  dailyChapterId,
  freeChapterIds,
  hasFullAccess,
}: ReadingAccessState & { chapterId: number; dailyChapterId: number }): boolean {
  return hasFullAccess || chapterId === dailyChapterId || freeChapterIds.includes(chapterId);
}

export function freeChapterSlotsRemaining(freeChapterIds: number[]): number {
  return Math.max(0, FREE_CHAPTER_LIMIT - freeChapterIds.length);
}

export function announceReadingAccessChanged(): void {
  window.dispatchEvent(new CustomEvent(READING_ACCESS_CHANGED_EVENT));
}
