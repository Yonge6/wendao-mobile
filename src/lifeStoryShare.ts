import { CANONICAL_URL } from "./native";
import type { ShareCardContent } from "./shareCard";

export type LifeStory = {
  slug: string;
  chapter: number;
  theme: string;
  title: string;
  teaser: string;
  paragraphs: string[];
  quote: string;
  practice: string;
};

export function lifeStoryUrl(story: LifeStory) {
  return new URL(`situations/${encodeURIComponent(story.slug)}/`, CANONICAL_URL).toString();
}

export function buildLifeStoryShareCardContent(story: LifeStory): ShareCardContent {
  const url = lifeStoryUrl(story);
  const primary = story.paragraphs.join("\n\n");
  const secondary = `${story.quote}\n《道德经》今本第 ${story.chapter} 章 · 帛书乙本底本校读节选\n\n留给今天的一点空间\n${story.practice}\n\n三慢问道创作记录 · AI 辅助编辑\n生活解读是当代观察，不是古文逐字翻译。`;
  return {
    kind: "inspiration",
    language: "zh",
    chapterId: story.chapter,
    label: "生活里的道",
    chapterLabel: story.theme,
    chapterTitle: story.title,
    primary,
    secondaryLabel: "引文与今日练习",
    secondary,
    url,
    shareText: `${story.title}\n\n${primary}\n\n${secondary}\n\n${url}`,
    filename: `wendao-story-${story.slug}.png`,
  };
}

