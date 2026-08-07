import chapterData from "./chapters.json";

export type RelatedItem = {
  title: string;
  body: string;
  points?: string[];
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

export type ReconstructionAddition = {
  character: string;
  line: number;
  position: number;
  absolutePosition: number;
  basis: "silkBLacuna" | "beyondTranscriptionAlignment";
  sourceMarker: "□" | "○" | null;
  source: "collatedReading" | "silkA" | "receivedReference" | "editorialInference";
  references: Array<"silkA" | "receivedReference">;
  confidence: "review-required" | "low" | "medium" | "high";
  note: string;
};

export type ChineseChapterCopy = ChapterCopyBase & {
  reconstructedVerse: string[];
  lineByLineTranslation: string[];
  additions: ReconstructionAddition[];
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
