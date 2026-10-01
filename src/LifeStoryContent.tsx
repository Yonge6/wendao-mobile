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
      <figcaption>{isZh ? "12 格生活小故事 · 点图放大，可保存分享" : "12-panel comic in Chinese · Tap to enlarge, save or share"}</figcaption>
    </figure>
    <details className="life-story-text"><summary>{isZh ? "查看文字解读" : "Read the Chinese reflection"}</summary>{text}</details>
  </>;
}
