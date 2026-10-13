import type { LifeStory } from "./lifeStoryShare";

export type StoryFilters = {
  query: string;
  theme: string;
  chapter: string;
  kind: "comic" | "essay" | "all";
};

const normalized = (text: string) => text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, "");

export function filterLifeStories<T extends LifeStory>(stories: T[], filters: StoryFilters): T[] {
  const query = normalized(filters.query.trim());
  return stories.filter(story => {
    if (filters.kind === "comic" && !story.comic) return false;
    if (filters.kind === "essay" && story.comic) return false;
    if (filters.theme && story.theme !== filters.theme) return false;
    if (filters.chapter && story.chapter !== Number(filters.chapter)) return false;
    if (!query) return true;
    if (/^\d+$/.test(query)) return story.chapter === Number(query);
    return [story.title, story.teaser, story.theme].some(text => normalized(text).includes(query));
  });
}
