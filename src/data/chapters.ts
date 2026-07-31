import chapterData from "./chapters.json";

export type RelatedItem = {
  title: string;
  body: string;
};

export type ChapterCopyBase = {
  eyebrow: string;
  title: string;
  variant: string;
  explanation: RelatedItem[];
  related: RelatedItem[];
  action: string;
};

export type ChapterCopy = ChapterCopyBase & {
  verse: string[];
};

export type ChineseChapterCopy = ChapterCopyBase & {
  reconstructedVerse: string[];
  pinyin: string[][];
};

export type Chapter = {
  id: number;
  silkOrder: string;
  theme: { zh: string; en: string };
  sources: {
    silkBTranscription: string;
    receivedReference: string;
    reconstructionNotes: string;
    accessed: string;
  };
  zh: ChineseChapterCopy;
  en: ChapterCopy;
};

export const chapters = chapterData as Chapter[];
