import englishStories from "../growth/copy-en.json";
import type { LifeStory } from "./lifeStoryShare";

export type LifeStoryTranslation = Pick<LifeStory, "theme" | "title" | "teaser" | "paragraphs" | "quote" | "practice"> & {
  comicTitle: string;
  comicAlt: string;
  comic?: Pick<NonNullable<LifeStory["comic"]>, "image" | "original" | "width" | "height">;
};
const english: Record<string, LifeStoryTranslation> = englishStories;

/** A missing English asset must never masquerade as an English comic. */
export function localizeLifeStory(story: LifeStory, language: "zh" | "en", translations: Record<string, LifeStoryTranslation> = english): LifeStory {
  const translation = language === "en" ? translations[story.slug] : undefined;
  if (!translation) return { ...story, language: "zh" };
  const { comic, comicTitle, comicAlt, ...copy } = translation;
  const style = story.comic?.style;
  return {
    ...story,
    ...copy,
    language: "en",
    comicPending: Boolean(story.comic && !comic),
    comic: comic ? {
      ...comic, title: comicTitle, alt: comicAlt,
      style: style ? { ...style, url: englishStyleUrl(style.url) } : undefined,
    } : undefined,
  };
}

function englishStyleUrl(url: string) {
  const target = new URL(url);
  target.searchParams.set("lang", "en");
  return target.toString();
}
