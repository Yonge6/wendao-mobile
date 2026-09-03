import { chapters } from "./data/chapters";

export function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dailyChapterId(dateKey = localDateKey()) {
  let hash = 0;
  for (const character of dateKey) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return chapters[hash % chapters.length].id;
}
