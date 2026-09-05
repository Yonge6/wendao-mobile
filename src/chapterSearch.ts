import type { Chapter } from "./data/chapters";

type Language = "zh" | "en";
export type SearchMatch = {
  text: string;
  normalized: string;
  label: Record<Language, string>;
  language: Language;
  section: "verse" | "meaning" | "inspiration";
  weight: number;
};
export type ChapterSearchResult = { chapter: Chapter; match?: SearchMatch; score: number };
const cache = new WeakMap<Chapter, SearchMatch[]>();

export function normalizeSearch(text: string) {
  return text.toLocaleLowerCase().replace(/\s+/gu, "");
}

function indexChapter(chapter: Chapter) {
  const cached = cache.get(chapter);
  if (cached) return cached;
  const fields: SearchMatch[] = [];
  const add = (text: string, language: Language, section: SearchMatch["section"], weight: number, zh: string, en: string) => {
    if (text) fields.push({ text, normalized: normalizeSearch(text), language, section, weight, label: { zh, en } });
  };
  for (const language of ["zh", "en"] as const) {
    const copy = chapter[language];
    add(copy.title, language, "verse", 100, "标题", "Title");
    add(chapter.theme[language], language, "meaning", 55, "本章主旨", "Chapter theme");
    for (const line of language === "zh" ? chapter.zh.reconstructedVerse : chapter.en.verse) {
      add(line, language, "verse", 75, "原文", "Text");
    }
    for (const item of copy.explanation.slice(0, 2)) {
      add(item.body, language, "meaning", 50, item.title, item.title);
    }
    // Only index public guidance, never the unpersonalized life-manual template.
    for (const item of copy.related) {
      if (["你的人生说明书", "Your life manual"].includes(item.title)) continue;
      for (const text of item.points?.length ? item.points : [item.body]) {
        add(text, language, "inspiration", 45, "对我们的启发", "Inspiration");
      }
    }
    add(copy.action, language, "inspiration", 45, "今日一练", "Today's practice");
    add(copy.variant, language, "verse", 20, "校读说明", "Editorial notes");
  }
  for (const line of chapter.zh.lineByLineTranslation) add(line, "zh", "meaning", 60, "今译", "Translation");
  add(chapter.sources.silkBTranscription, "zh", "verse", 30, "乙本转写", "Silk B transcription");
  add(chapter.sources.receivedReference, "zh", "verse", 25, "传世参照", "Received reference");
  add(chapter.sources.reconstructionNotes, "zh", "verse", 20, "校读说明", "Editorial notes");
  cache.set(chapter, fields);
  return fields;
}

export function searchChapters(chapters: Chapter[], rawQuery: string, language: Language): ChapterSearchResult[] {
  const query = normalizeSearch(rawQuery.trim());
  if (!query) return chapters.map((chapter) => ({ chapter, score: 0 }));
  const chapterNumber = query.match(/^(?:第)?0*(\d+)(?:章)?$/)?.[1];
  return chapters.flatMap((chapter) => {
    const fields = indexChapter(chapter);
    if (chapterNumber) {
      if (chapter.id !== Number(chapterNumber) && Number(chapter.silkOrder) !== Number(chapterNumber)) return [];
      return [{ chapter, match: fields.find((field) => field.language === language && field.weight === 75), score: chapter.id === Number(chapterNumber) ? 300 : 200 }];
    }
    let best: SearchMatch | undefined;
    let score = 0;
    for (const field of fields) {
      if (!field.normalized.includes(query)) continue;
      const relevance = field.weight + (field.normalized === query ? 25 : 0) + (field.language === language ? 5 : 0);
      if (relevance > score) { best = field; score = relevance; }
    }
    return best ? [{ chapter, match: best, score }] : [];
  }).sort((a, b) => b.score - a.score || Number(a.chapter.silkOrder) - Number(b.chapter.silkOrder));
}

// Map normalized positions back to original text so whitespace, pinyin-free
// scripture and mixed-case English retain their actual typography.
export function searchExcerpt(text: string, rawQuery: string, context = 42) {
  const query = normalizeSearch(rawQuery.trim());
  const offsets: { start: number; end: number }[] = [];
  let normalized = "";
  let offset = 0;
  for (const character of text) {
    const folded = normalizeSearch(character);
    normalized += folded;
    for (let index = 0; index < folded.length; index += 1) offsets.push({ start: offset, end: offset + character.length });
    offset += character.length;
  }
  const hit = query ? normalized.indexOf(query) : -1;
  if (hit < 0) return { before: [...text].slice(0, context * 2).join("") + ([...text].length > context * 2 ? "…" : ""), highlight: "", after: "" };
  const start = offsets[hit].start;
  const end = offsets[hit + query.length - 1].end;
  const leading = [...text.slice(0, start)];
  const trailing = [...text.slice(end)];
  return {
    before: (leading.length > context ? "…" : "") + leading.slice(-context).join(""),
    highlight: text.slice(start, end),
    after: trailing.slice(0, context).join("") + (trailing.length > context ? "…" : ""),
  };
}
