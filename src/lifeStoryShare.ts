import { CANONICAL_URL } from "./native";
import type { ShareCardContent } from "./shareCard";

export type LifeStory = {
  language?: "zh" | "en";
  comicPending?: boolean;
  slug: string;
  chapter: number;
  theme: string;
  title: string;
  teaser: string;
  paragraphs: string[];
  quote: string;
  practice: string;
  comic?: {
    title: string; image: string; original: string; width: number; height: number; alt: string;
    style?: { name: string; nameEn: string; url: string };
  };
};

export function lifeStoryUrl(story: LifeStory) {
  return new URL(`situations/${encodeURIComponent(story.slug)}/${story.language === "en" ? "en/" : ""}`, CANONICAL_URL).toString();
}

export function buildLifeStoryShareCardContent(story: LifeStory): ShareCardContent {
  const url = lifeStoryUrl(story);
  const primary = story.paragraphs.join("\n\n");
  const isEn = story.language === "en";
  const secondary = isEn
    ? `${story.quote}\nDaodejing · Chapter ${story.chapter} · English rendering of the Silk B base reading excerpt\n\nA little room for today\n${story.practice}\n\nWendao editorial · AI-assisted editing\nA contemporary reflection, not a line-by-line translation of the original.`
    : `${story.quote}\n《道德经》今本第 ${story.chapter} 章 · 帛书乙本底本校读节选\n\n留给今天的一点空间\n${story.practice}\n\n三慢问道创作记录 · AI 辅助编辑\n生活解读是当代观察，不是古文逐字翻译。`;
  return {
    kind: "inspiration",
    language: isEn ? "en" : "zh",
    chapterId: story.chapter,
    label: isEn ? "Tao in everyday life" : "生活里的道",
    chapterLabel: story.theme,
    chapterTitle: story.title,
    primary,
    secondaryLabel: isEn ? "A passage and a practice" : "引文与今日练习",
    secondary,
    url,
    shareText: `${story.title}\n\n${primary}\n\n${secondary}\n\n${url}`,
    filename: `wendao-story-${story.slug}${isEn ? "-en" : ""}.png`,
    imageSource: story.comic?.original,
  };
}
