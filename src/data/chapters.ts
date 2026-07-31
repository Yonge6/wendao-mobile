import chapterData from "./chapters.json";

export type RelatedItem = {
  title: string;
  body: string;
};

export type ChapterCopy = {
  eyebrow: string;
  title: string;
  verse: string[];
  pinyin?: string[][];
  variant: string;
  explanation: RelatedItem[];
  related: RelatedItem[];
  action: string;
};

export type Chapter = {
  id: number;
  silkOrder: string;
  theme: { zh: string; en: string };
  sources: {
    literalSilkB: string;
    receivedReference: string;
    accessed: string;
  };
  zh: ChapterCopy;
  en: ChapterCopy;
};

export const chapters = chapterData as Chapter[];
