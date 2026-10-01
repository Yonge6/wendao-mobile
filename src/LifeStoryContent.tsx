import type { LifeStory } from "./lifeStoryShare";

export default function LifeStoryContent({ story, language, drawer = false, onOpenComic }: {
  story: LifeStory;
  language: "zh" | "en";
  drawer?: boolean;
  onOpenComic: () => void;
}) {
  const isZh = language === "zh";
  const [quoteClass, practiceClass, kickerClass] = drawer
    ? [undefined, "drawer-story-practice", "drawer-kicker"]
    : ["chapter-story-quote", "practice-card", "practice-kicker"];
  const text = <>
    <div className={drawer ? undefined : "chapter-life-story-body"}>{story.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    <blockquote className={quoteClass}><p>{story.quote}</p><cite>《道德经》今本第 {story.chapter} 章 · 帛书乙本底本校读节选</cite></blockquote>
    <div className={practiceClass}><span className={kickerClass}>留给今天的一点空间</span><p>{story.practice}</p></div>
  </>;
  if (!story.comic) return text;
  return <>
    <figure className="life-story-comic">
      <button type="button" className="life-story-comic-open" onClick={onOpenComic}
        aria-label={`${isZh ? "放大阅读漫画" : "Read comic in detail"}：${story.comic.title}`}>
        <img src={story.comic.image} width={story.comic.width} height={story.comic.height}
          alt={story.comic.alt} loading="lazy" decoding="async" draggable={false} />
      </button>
      <figcaption>
        {story.comic.style ? <span className="life-story-comic-style">
          <a href={story.comic.style.url} target="_blank" rel="noopener noreferrer"
            aria-label={isZh ? `在 Style Atlas 查看${story.comic.style.name}` : `Explore ${story.comic.style.nameEn} on Style Atlas`}>
            {isZh ? "图片风格：" : "Image style: "}{isZh ? story.comic.style.name : story.comic.style.nameEn} <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M5 3H3v10h10v-2M8 3h5v5M7 9l6-6" /></svg>
          </a>
        </span> : null}
      </figcaption>
    </figure>
    <details className="life-story-text"><summary>{isZh ? "查看漫画解读" : "Read the comic reflection (Chinese)"}</summary>{text}</details>
  </>;
}
