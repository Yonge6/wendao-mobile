import { FormEvent, useEffect, useMemo, useState } from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/600.css";

type Language = "zh" | "en";

type RelatedItem = {
  title: string;
  body: string;
};

type ChapterCopy = {
  eyebrow: string;
  title: string;
  verse: string[];
  pinyin?: string[][];
  variant: string;
  explanation: string[];
  related: RelatedItem[];
  action: string;
};

type Chapter = {
  id: number;
  silkOrder: string;
  zh: ChapterCopy;
  en: ChapterCopy;
};

const chapters: Chapter[] = [
  {
    id: 8,
    silkOrder: "44",
    zh: {
      eyebrow: "帛书校订本 · 对应今本第八章",
      title: "上善如水",
      verse: [
        "上善如水，",
        "水善利万物而有静。",
        "居众人之所恶，",
        "故几于道矣。",
        "居善地，心善渊，",
        "予善天，言善信，",
        "政善治，事善能，",
        "动善时。",
        "夫唯不争，故无尤。",
      ],
      pinyin: [
        ["shàng", "shàn", "rú", "shuǐ"],
        ["shuǐ", "shàn", "lì", "wàn", "wù", "ér", "yǒu", "jìng"],
        ["jū", "zhòng", "rén", "zhī", "suǒ", "wù"],
        ["gù", "jī", "yú", "dào", "yǐ"],
        ["jū", "shàn", "dì", "xīn", "shàn", "yuān"],
        ["yǔ", "shàn", "tiān", "yán", "shàn", "xìn"],
        ["zhèng", "shàn", "zhì", "shì", "shàn", "néng"],
        ["dòng", "shàn", "shí"],
        ["fū", "wéi", "bù", "zhēng", "gù", "wú", "yóu"],
      ],
      variant: "本页据所附校订本作“如水 / 有静 / 所恶” · 甲本“治水” · 乙本“如水” · 王弼本“若水”",
      explanation: [
        "最接近道的善，像水。它滋养万物，却不与万物争先；它总是流向低处，安静地停在人们不愿停留的位置。",
        "为什么用水来讲“道”？水没有固定形状，却始终保有自己的性质；它能顺着环境改变路径，也能用漫长而持续的力量改变环境。柔软在这里不是脆弱，而是一种不被单一姿态困住的能力。",
        "“居、心、予、言、政、事、动”把水的品性展开到生活的七个面向：所处的位置、内心的深度、给予的尺度、说话的可信、处理秩序的能力、做事的效能，以及行动的时机。道不只是一种观念，它最终要落实在这些具体选择里。",
        "“不争”也不是放弃立场。水不与万物争夺同一种形状，却始终朝自己的方向流动；它减少无谓对抗，把力量留给真正重要的事。因此“不争”带来的不是被动，而是更少怨尤、更少内耗。",
      ],
      related: [
        {
          title: "焦虑｜先回到低处",
          body: "当焦虑催你立刻向上、向前、向别人证明时，先回到身体和眼前这一步。低处不是失败的位置，而是重新蓄水、看清方向的地方。",
        },
        {
          title: "关系｜柔而不僵",
          body: "你不必立刻赢得关系。先让局面重新流动，再决定靠近或离开。柔软不是委屈自己，而是不把一时的对抗变成永久的僵局。",
        },
        {
          title: "行动｜让价值流出去",
          body: "水的力量不靠占有来证明，而在于它让生命得到滋养。今天可以问：我做的这件事，除了让我被看见，还让谁真正受益？",
        },
        {
          title: "选择｜变形，不变心",
          body: "适应不是没有原则。水可以成为溪流、雨雾或湖泊，改变的是路径和形态，不变的是它持续流动的本性。形式走不通时，换一种走法。",
        },
        {
          title: "边界｜不争不是退缩",
          body: "不必参与每一场比较，也不必回应每一种挑衅；但涉及核心价值和真实边界时，你仍可以清楚表达。省下争胜的力气，用来守住真正重要的东西。",
        },
        {
          title: "时机｜等水势形成",
          body: "有些行动太早会耗散，太晚会错过。先观察局面是否已经具备条件：信息够不够、身体是否准备好、关系里是否出现了可以流动的缝隙。",
        },
        {
          title: "你的出厂设置",
          body: "你习惯先回应世界，再照顾自己。把一小部分注意力留给内心真正的水位：此刻的顺应来自清醒，还是来自害怕失去？个性化结果会帮助你辨认两者，而不会替你做决定。",
        },
      ],
      action: "慢三次呼吸，再回应。把答案放慢一点，让真实的自己先出现。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text A · Received Chapter 8",
      title: "The Highest Good Is Like Water",
      verse: [
        "The highest good is like water.",
        "Water benefits all things and remains still.",
        "It dwells where people do not wish to stay,",
        "and so comes close to the Way.",
        "In dwelling, it favors low ground; in heart, depth.",
        "In giving, it follows Heaven; in speech, trust.",
        "In governance, order; in affairs, ability.",
        "In movement, the right time.",
        "Because it does not contend, it incurs no blame.",
      ],
      variant: "Edited silk reading shown in full · Silk A: “govern water” · Silk B: “like water” · Wang Bi: “as water”",
      explanation: [
        "The goodness closest to the Way behaves like water. It nourishes everything without racing to be first, and quietly settles in the low places others avoid.",
        "Why does water illuminate the Way? It has no fixed shape, yet never loses its nature. It changes course with its surroundings and, through patient continuity, also changes those surroundings. Here, softness means freedom from being trapped in a single posture.",
        "Dwelling, heart, giving, speech, governance, affairs, and movement extend water's qualities into seven areas of life: where you stand, how deeply you listen, what you offer, whether your word can be trusted, how you create order, how capably you act, and whether the time is right.",
        "Not contending does not mean having no position. Water does not compete to hold one shape, yet it keeps moving in its own direction. It spends less strength on needless resistance and keeps more for what matters.",
      ],
      related: [
        {
          title: "Anxiety · Return to low ground",
          body: "When anxiety pushes you upward, faster, and toward proving yourself, return to your body and the next visible step. Low ground can be where strength gathers and direction becomes clear.",
        },
        {
          title: "Relationships · Soft, not rigid",
          body: "You do not have to win the relationship today. Let the situation move again before deciding whether to come closer or step away. Softness is not self-erasure; it keeps a temporary conflict from becoming permanent.",
        },
        {
          title: "Action · Let value flow outward",
          body: "Water does not prove its power by possessing. Its strength appears in what it nourishes. Ask: beyond making me visible, who genuinely benefits from what I am doing?",
        },
        {
          title: "Choice · Change form, keep your nature",
          body: "Adaptation is not the absence of principle. Water may become stream, mist, or lake; the route and form change while its living movement remains. When one form fails, find another way through.",
        },
        {
          title: "Boundaries · Non-contention is not retreat",
          body: "You need not enter every comparison or answer every provocation. You can still speak clearly when a core value or real boundary is involved. Save the energy of winning for protecting what matters.",
        },
        {
          title: "Timing · Let the current gather",
          body: "Acting too early can scatter energy; acting too late can miss the opening. Notice whether the information, your body, and the relationship have formed enough of a channel for movement.",
        },
        {
          title: "Your native pattern",
          body: "You may respond to the world before checking on yourself. Keep attention on your inner waterline: is this adaptation coming from clarity, or fear of loss? Personalization can help you distinguish them without deciding for you.",
        },
      ],
      action: "Take three slow breaths before replying. Let your truest response arrive first.",
    },
  },
  {
    id: 9,
    silkOrder: "45",
    zh: {
      eyebrow: "帛书校订本 · 对应今本第九章",
      title: "持而盈之",
      verse: [
        "持而盈之，不若其已。",
        "揣而锐之，不可长保也。",
        "金玉盈室，莫之能守也。",
        "富贵而骄，自遗其咎也。",
        "功遂身退，天之道也。",
      ],
      pinyin: [
        ["chí", "ér", "yíng", "zhī", "bù", "ruò", "qí", "yǐ"],
        ["chuǎi", "ér", "ruì", "zhī", "bù", "kě", "cháng", "bǎo", "yě"],
        ["jīn", "yù", "yíng", "shì", "mò", "zhī", "néng", "shǒu", "yě"],
        ["fù", "guì", "ér", "jiāo", "zì", "yí", "qí", "jiù", "yě"],
        ["gōng", "suì", "shēn", "tuì", "tiān", "zhī", "dào", "yě"],
      ],
      variant: "帛书乙本作“植 / 锻而允 / 长葆 / 贵富” · 王弼本作“持 / 揣而锐 / 长保 / 富贵”",
      explanation: [
        "已经满了还要继续加，锋芒已经很盛还要反复磨砺，都难以长久。老子提醒的不是拒绝成就，而是识别“够了”的时刻。",
        "完成之后懂得退一步，是给成果留下生长的空间，也是让自己免于被成功反过来占有。",
      ],
      related: [
        {
          title: "工作",
          body: "不必用每一次加班证明价值。完成最重要的部分，然后停下来检查：继续投入是在创造，还是只是不敢结束？",
        },
        {
          title: "关系",
          body: "爱不是把彼此的空间全部填满。适当的留白，会让靠近重新成为选择，而不是义务。",
        },
        {
          title: "选择",
          body: "如果你已经得到核心结果，下一步也许不是扩张，而是整理、巩固与放下。",
        },
        {
          title: "你的出厂设置",
          body: "当你很容易把责任揽到自己身上，“功遂身退”是在练习信任：事情可以在没有你持续控制时继续运转。",
        },
      ],
      action: "今天为一件事设定“足够线”，到线就停，不再追加证明。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text A · Received Chapter 9",
      title: "Holding Until It Overflows",
      verse: [
        "Hold and fill it—better to stop.",
        "Temper an edge too sharp—it cannot last.",
        "Gold and jade fill the hall; no one can guard it.",
        "Wealth and rank joined with pride leave their own blame.",
        "The work complete, step back: this is the Way of Heaven.",
      ],
      variant: "The silk and Wang Bi texts differ in several characters and pauses",
      explanation: [
        "Adding to what is already full, or sharpening what is already keen, cannot last. The point is not to reject achievement, but to recognize the moment when it is enough.",
        "Stepping back after completion gives the work space to live—and keeps success from possessing the person who made it.",
      ],
      related: [
        {
          title: "Work",
          body: "You do not have to prove your value with every extra hour. Complete what matters, then ask whether more effort is creating value or merely avoiding an ending.",
        },
        {
          title: "Relationships",
          body: "Care does not need to fill every inch of space. A little room lets closeness become a choice again, rather than an obligation.",
        },
        {
          title: "Choice",
          body: "If the essential result is already here, the next move may be to consolidate, organize, and release—not expand.",
        },
        {
          title: "Your native pattern",
          body: "If you tend to carry every responsibility, stepping back is a practice of trust: life can continue without your constant control.",
        },
      ],
      action: "Set an “enough line” for one task today. When you reach it, stop adding proof.",
    },
  },
  {
    id: 1,
    silkOrder: "1",
    zh: {
      eyebrow: "帛书甲乙本校订 · 对应今本第一章",
      title: "道可道也",
      verse: [
        "道可道也，非恒道也。",
        "名可名也，非恒名也。",
        "无名万物之始也；",
        "有名万物之母也。",
        "故恒无欲也，以观其妙；",
        "恒有欲也，以观其所徼。",
        "两者同出，异名同谓。",
        "玄之又玄，众妙之门。",
      ],
      pinyin: [
        ["dào", "kě", "dào", "yě", "fēi", "héng", "dào", "yě"],
        ["míng", "kě", "míng", "yě", "fēi", "héng", "míng", "yě"],
        ["wú", "míng", "wàn", "wù", "zhī", "shǐ", "yě"],
        ["yǒu", "míng", "wàn", "wù", "zhī", "mǔ", "yě"],
        ["gù", "héng", "wú", "yù", "yě", "yǐ", "guān", "qí", "miào"],
        ["héng", "yǒu", "yù", "yě", "yǐ", "guān", "qí", "suǒ", "jiào"],
        ["liǎng", "zhě", "tóng", "chū", "yì", "míng", "tóng", "wèi"],
        ["xuán", "zhī", "yòu", "xuán", "zhòng", "miào", "zhī", "mén"],
      ],
      variant: "帛书作“恒 / 也 / 所徼” · 王弼本作“常”，并省去部分“也”字",
      explanation: [
        "能够被说清楚的道理，都只是此刻的一个切面；能够被命名的身份，也不能涵盖一个生命的全部。",
        "名字帮助我们理解世界，却也容易把世界固定。保留一点“不急着定义”的空间，变化才有可能被看见。",
      ],
      related: [
        {
          title: "认识自己",
          body: "性格、职业、关系身份都是真实的一部分，但没有任何一个标签等于完整的你。你可以认识自己，而不把自己锁死。",
        },
        {
          title: "关系",
          body: "当你把对方定义成“他就是这样的人”，关系也会停止变化。先描述发生了什么，再判断它意味着什么。",
        },
        {
          title: "焦虑",
          body: "你不需要立刻为不确定找到一个名字。允许暂时不知道，往往比仓促下结论更接近事实。",
        },
        {
          title: "你的出厂设置",
          body: "人类图等工具可以成为观察你的镜子，却不应成为限制你的围墙。结果用来增加选择，不是替你做决定。",
        },
      ],
      action: "把一个“我就是……”改写成“我最近常常……”，给自己留出变化的余地。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text A · Received Chapter 1",
      title: "A Way That Can Be Spoken",
      verse: [
        "A way that can be spoken is not the enduring Way.",
        "A name that can be named is not the enduring name.",
        "The unnamed is the beginning of all things.",
        "The named is the mother of all things.",
        "Thus, enduringly without desire, observe its subtlety.",
        "Enduringly with desire, observe its boundary.",
        "The two arise together and differ only in name.",
        "Mystery within mystery: the gate of all subtleties.",
      ],
      variant: "The silk text uses “enduring”; Wang Bi’s received text uses “constant”",
      explanation: [
        "Any truth we can fully explain is only one view from this moment. Any identity we can name is never the whole of a life.",
        "Names help us understand the world, yet they can also freeze it. Leave a little room before defining, and change becomes visible.",
      ],
      related: [
        {
          title: "Knowing yourself",
          body: "Personality, work, and relationship roles are real parts of you, but no label is the whole person. Self-knowledge can be a doorway rather than a cage.",
        },
        {
          title: "Relationships",
          body: "When you decide “this is simply who they are,” the relationship loses room to change. Describe what happened before deciding what it means.",
        },
        {
          title: "Anxiety",
          body: "You do not need to name every uncertainty immediately. Allowing yourself not to know can be more truthful than a hurried conclusion.",
        },
        {
          title: "Your native pattern",
          body: "Human Design and similar tools can be mirrors, not walls. Use the result to widen your choices—not to make the choice for you.",
        },
      ],
      action: "Rewrite one “I am…” as “Lately, I often…”. Leave yourself room to change.",
    },
  },
];

function validatePinyinReadings() {
  for (const chapter of chapters) {
    const { verse, pinyin } = chapter.zh;
    if (!pinyin || verse.length !== pinyin.length) {
      throw new Error(`Chapter ${chapter.id}: verse and Pinyin line counts do not match.`);
    }

    verse.forEach((line, lineIndex) => {
      const hanziCount = Array.from(line).filter((character) => /\p{Script=Han}/u.test(character)).length;
      if (hanziCount !== pinyin[lineIndex].length) {
        throw new Error(
          `Chapter ${chapter.id}, line ${lineIndex + 1}: ${hanziCount} Han characters but ${pinyin[lineIndex].length} Pinyin syllables.`,
        );
      }
    });
  }
}

validatePinyinReadings();

function reorderFrom(id: number) {
  const index = chapters.findIndex((chapter) => chapter.id === id);
  return [...chapters.slice(index), ...chapters.slice(0, index)];
}

function scrollReadingToTop() {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>("[data-testid='mobile-scroll']")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

function renderPinyinLine(text: string, pinyin: string[]) {
  let syllableIndex = 0;

  return Array.from(text).map((character, characterIndex) => {
    if (/\p{Script=Han}/u.test(character)) {
      const syllable = pinyin[syllableIndex] ?? "";
      syllableIndex += 1;
      return (
        <ruby key={`${character}-${characterIndex}`}>
          {character}
          <rt>{syllable}</rt>
        </ruby>
      );
    }

    return <span className="verse-punctuation" key={`${character}-${characterIndex}`}>{character}</span>;
  });
}

type WebSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

function WebSheet({ open, onOpenChange, title, description, children }: WebSheetProps) {
  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="web-sheet-layer">
      <button
        type="button"
        className="web-sheet-backdrop"
        aria-label="关闭"
        onClick={() => onOpenChange(false)}
      />
      <section className="bottom-sheet web-sheet" role="dialog" aria-modal="true" aria-labelledby="web-sheet-title">
        <button
          type="button"
          className="web-sheet-close"
          aria-label="关闭"
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
        <span className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title" id="web-sheet-title">{title}</h2>
        {description ? <p className="sheet-description">{description}</p> : null}
        <div className="web-sheet-content">{children}</div>
      </section>
    </div>
  );
}

export default function Prototype() {
  const [language, setLanguage] = useState<Language>("zh");
  const [chapterId, setChapterId] = useState(8);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [isReadingScrolled, setIsReadingScrolled] = useState(false);
  const orderedChapters = useMemo(() => reorderFrom(chapterId), [chapterId]);
  const isZh = language === "zh";
  const activeCopy = chapters.find((chapter) => chapter.id === chapterId)?.[language] ?? chapters[0][language];

  useEffect(() => {
    const scroll = document.querySelector<HTMLElement>("[data-testid='mobile-scroll']");
    if (!scroll) return;

    const updateReadingState = () => setIsReadingScrolled(scroll.scrollTop > 44);
    updateReadingState();
    scroll.addEventListener("scroll", updateReadingState, { passive: true });
    return () => scroll.removeEventListener("scroll", updateReadingState);
  }, []);

  const selectChapter = (id: number) => {
    setChapterId(id);
    setDirectoryOpen(false);
    scrollReadingToTop();
  };

  const meetAChapter = () => {
    const candidates = chapters.filter((chapter) => chapter.id !== chapterId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setChapterId(next.id);
    scrollReadingToTop();
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion) return;
    setSubmittedQuestion(nextQuestion);
    setInsightOpen(true);
  };

  return (
    <>
      <header
        className={`reading-header reading-header-fixed ${isReadingScrolled ? "is-scrolled" : ""}`}
        aria-label={isZh ? "阅读工具" : "Reading tools"}
        lang={isZh ? "zh-CN" : "en"}
      >
        <button className="wordmark" type="button" onClick={scrollReadingToTop}>
          {isZh ? "问道" : "Wendao"}
        </button>
        <span className="header-rule" aria-hidden="true" />
        <button className="header-action directory-action" type="button" onClick={() => setDirectoryOpen(true)}>
          {isZh ? "目录" : "Contents"}
        </button>
        <div className="header-spacer" />
        <button className="header-action encounter-action" type="button" onClick={meetAChapter}>
          {isZh ? "偶遇一章" : "Chance"}
        </button>
        <div className="language-switch" aria-label={isZh ? "语言切换" : "Language"}>
          <button
            type="button"
            className={isZh ? "is-active" : undefined}
            aria-pressed={isZh}
            onClick={() => setLanguage("zh")}
          >
            中
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            className={!isZh ? "is-active" : undefined}
            aria-pressed={!isZh}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>
      </header>

      <div className="app-screen" data-testid="mobile-scroll">
        <main
          className="reading-shell"
          data-testid="reading-screen"
          data-reading-top
          lang={isZh ? "zh-CN" : "en"}
        >
          <p className="philosophy-line">
            {isZh ? "真实自己，流动人生" : "True to yourself. Flow with life."}
          </p>

          {orderedChapters.map((chapter, chapterIndex) => {
            const copy = chapter[language];
            return (
              <article
                className={`chapter ${chapterIndex === 0 ? "chapter-current" : "chapter-continuation"}`}
                key={chapter.id}
                aria-labelledby={`chapter-${chapter.id}-${language}`}
              >
                {chapterIndex > 0 ? (
                  <div className="next-chapter-divider" aria-label={isZh ? "下一章" : "Next chapter"}>
                    <span className="divider-dot" />
                    <span className="divider-line" />
                  </div>
                ) : null}

                <div className="chapter-content">
                  <section className="section-layout original-section">
                    <aside className="section-marker marker-original" aria-hidden="true">
                      <span className="rail-dot" />
                      <span className="rail-line rail-before-label" />
                      <span className="rail-label">
                        <span>01</span>
                        <small>{isZh ? "原文" : "TEXT"}</small>
                      </span>
                      <span className="rail-line rail-fill" />
                    </aside>
                    <div className="section-copy">
                      <div className="chapter-meta">
                        <p className="chapter-eyebrow">{copy.eyebrow}</p>
                        <span className="chapter-completeness">
                          {isZh ? `全文 · ${copy.verse.length}句` : `Full text · ${copy.verse.length} lines`}
                        </span>
                      </div>
                      <h1 id={`chapter-${chapter.id}-${language}`}>{copy.title}</h1>
                      <div className="verse">
                        {copy.verse.map((line, lineIndex) => (
                          <p className={isZh ? "verse-line verse-line-ruby" : "verse-line"} key={line}>
                            {isZh && copy.pinyin
                              ? renderPinyinLine(line, copy.pinyin[lineIndex])
                              : line}
                          </p>
                        ))}
                      </div>
                      <p className="variant-note">{copy.variant}</p>
                    </div>
                  </section>

                  <section className="section-layout explanation-section" aria-label={isZh ? "解释" : "Meaning"}>
                    <aside className="section-marker" aria-hidden="true">
                      <span className="rail-label">
                        <span>02</span>
                        <small>{isZh ? "解释" : "MEANING"}</small>
                      </span>
                      <span className="rail-line rail-fill" />
                    </aside>
                    <div className="section-copy">
                      {copy.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </section>

                  <section className="section-layout related-section" aria-label={isZh ? "与你有关" : "For you"}>
                    <aside className="section-marker" aria-hidden="true">
                      <span className="rail-label">
                        <span>03</span>
                        <small>{isZh ? "与你有关" : "FOR YOU"}</small>
                      </span>
                      <span className="rail-line rail-fill" />
                    </aside>
                    <div className="section-copy">
                      {copy.related.map((item) => (
                        <div className="related-item" key={item.title}>
                          <h2>{item.title}</h2>
                          <p>{item.body}</p>
                        </div>
                      ))}
                      <div className="practice-card">
                        <span className="practice-kicker">{isZh ? "今日一练" : "A practice for today"}</span>
                        <p>{copy.action}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </article>
            );
          })}

          <footer className="reading-footer">
            <span>{isZh ? "认识 · 接纳 · 成为 · 活出" : "Know · Accept · Become · Live"}</span>
            <small>{isZh ? "帛书为主 · 多版本互校" : "Silk text first · Versions compared"}</small>
          </footer>
        </main>
      </div>

      {!directoryOpen && !insightOpen ? (
        <form
          className={`ai-composer ${isReadingScrolled ? "is-reading" : ""}`}
          onSubmit={submitQuestion}
        >
          <span className="composer-spark" aria-hidden="true">✦</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isZh ? "问问这一章与你的关系…" : "Ask how this chapter relates to you…"}
            aria-label={isZh ? "向问道提问" : "Ask Wendao"}
          />
          <button type="submit" aria-label={isZh ? "发送" : "Send"}>
            <PaperPlaneIcon />
          </button>
        </form>
      ) : null}

      <WebSheet
        open={directoryOpen}
        onOpenChange={setDirectoryOpen}
        title={isZh ? "目录" : "Contents"}
        description={isZh ? "帛书次序为主，括号内为今本章次" : "Silk-text order first; received chapter in parentheses"}
      >
        <div className="directory-list">
          {chapters.map((chapter) => {
            const copy = chapter[language];
            return (
              <button
                type="button"
                className={chapter.id === chapterId ? "directory-item is-current" : "directory-item"}
                key={chapter.id}
                onClick={() => selectChapter(chapter.id)}
              >
                <span className="directory-number">{String(chapter.silkOrder).padStart(2, "0")}</span>
                <span className="directory-copy">
                  <strong>{copy.title}</strong>
                  <small>{isZh ? `今本第 ${chapter.id} 章` : `Received chapter ${chapter.id}`}</small>
                </span>
                <span className="directory-arrow" aria-hidden="true">→</span>
              </button>
            );
          })}
        </div>
      </WebSheet>

      <WebSheet
        open={insightOpen}
        onOpenChange={setInsightOpen}
        title={isZh ? "与你有关" : "For you"}
        description={submittedQuestion}
      >
        <div className="ai-response">
          <p className="ai-response-lead">
            {isZh
              ? `先不急着得到结论。“${activeCopy.title}”给你的不是一个标准答案，而是一种看清局面的方式。`
              : `There is no need to force a conclusion yet. “${activeCopy.title}” offers a way to see the situation, not a standard answer.`}
          </p>
          <div className="ai-guidance">
            <span>{isZh ? "此刻可以问自己" : "Ask yourself now"}</span>
            <strong>
              {isZh
                ? "哪一个选择，会让事情重新流动，而不是让我继续用力僵持？"
                : "Which choice would let life move again, instead of keeping me locked in effort?"}
            </strong>
          </div>
          <p>
            {isZh
              ? "如果你愿意，先写下两个选项各自让身体产生的感觉。我们可以从更松、更真实的那个反应继续。"
              : "If you like, write down how each option feels in your body. We can continue with the response that feels more spacious and true."}
          </p>
          <div className="source-disclosure">
            <span>{isZh ? "回应依据" : "Response basis"}</span>
            <p>{isZh ? "本章原典 · 你的提问 · 已完成的出厂设置信息" : "This chapter · Your question · Your completed native-pattern profile"}</p>
          </div>
        </div>
      </WebSheet>
    </>
  );
}
