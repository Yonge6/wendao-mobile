import { FormEvent, useMemo, useState } from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/600.css";
import {
  BottomSheet,
  KeyboardInput,
  MobileScroll,
  useKeyboard,
  useKeyboardInsets,
} from "./mobile";

type Language = "zh" | "en";

type RelatedItem = {
  title: string;
  body: string;
};

type ChapterCopy = {
  eyebrow: string;
  title: string;
  verse: string[];
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
      eyebrow: "帛书甲本 · 对应今本第八章",
      title: "上善治水",
      verse: ["上善治水。", "水善利万物而有静，", "居众之所恶，", "故几于道矣。"],
      variant: "甲本“治 / 有静” · 王弼本“若 / 不争”",
      explanation: [
        "最接近道的善，像水。它滋养万物，却不与万物争先；它总是流向低处，安静地停在人们不愿停留的位置。",
        "水不急着证明自己，却因顺势、包容与持续，拥有改变坚硬之物的力量。所谓上善，不是退让，而是清醒地选择自己的方向。",
      ],
      related: [
        {
          title: "关系",
          body: "你不必立刻赢得关系。先让局面重新流动，再决定靠近或离开。真正的柔软，不是委屈自己，而是不把一时的对抗变成永久的僵局。",
        },
        {
          title: "焦虑",
          body: "焦虑催你向上争抢，水却提醒你：低处也能积蓄力量，慢并不等于停下。先把今天能做的一件小事做完，让身体重新感觉到确定。",
        },
        {
          title: "选择",
          body: "当两条路都难，不妨选择更少消耗、更能长久滋养你与他人的那一条。好的选择不一定喧闹，却常让内心渐渐变得宽阔。",
        },
        {
          title: "你的出厂设置",
          body: "你习惯先回应世界，再照顾自己。今天试着把一小部分注意力留给内心真正的水位：我是在顺势而行，还是只因害怕失去而勉强坚持？",
        },
      ],
      action: "慢三次呼吸，再回应。把答案放慢一点，让真实的自己先出现。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text A · Received Chapter 8",
      title: "The Highest Good Is Like Water",
      verse: [
        "The highest good follows water.",
        "Water benefits all things and rests in stillness;",
        "it dwells where others do not wish to stay,",
        "and so comes close to the Way.",
      ],
      variant: "Silk A: “follows / stillness” · Wang Bi: “is like / does not contend”",
      explanation: [
        "The goodness closest to the Way behaves like water. It nourishes everything without racing to be first, and quietly settles in the low places others avoid.",
        "Water does not hurry to prove itself. Through timing, openness, and persistence, it changes even what seems hard. This is not passive retreat; it is choosing your direction with clarity.",
      ],
      related: [
        {
          title: "Relationships",
          body: "You do not have to win the relationship today. Let the situation move again before deciding whether to come closer or step away. Softness can protect truth without hardening conflict.",
        },
        {
          title: "Anxiety",
          body: "Anxiety urges you upward and faster. Water reminds you that strength can also gather in low places. Finish one small thing you can influence today, and let your body rediscover certainty.",
        },
        {
          title: "Choice",
          body: "When both roads are difficult, consider the one that consumes less of you and can nourish life for longer. A good decision may be quiet, yet leave more room inside.",
        },
        {
          title: "Your native pattern",
          body: "You may respond to the world before checking on yourself. Keep a little attention for your inner waterline: am I moving with life, or holding on only because I fear losing something?",
        },
      ],
      action: "Take three slow breaths before replying. Let your truest response arrive first.",
    },
  },
  {
    id: 9,
    silkOrder: "45",
    zh: {
      eyebrow: "帛书甲本 · 对应今本第九章",
      title: "持而盈之",
      verse: ["持而盈之，不若其已。", "揣而锐之，不可长保也。", "金玉盈室，莫之能守也。", "功遂身退，天之道也。"],
      variant: "帛书本与王弼本在个别用字、句读上有异",
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
      eyebrow: "帛书甲本 · 对应今本第一章",
      title: "道可道也",
      verse: ["道可道也，非恒道也。", "名可名也，非恒名也。", "无名，万物之始也；", "有名，万物之母也。"],
      variant: "帛书作“恒” · 王弼本作“常”",
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
        "Without name: the beginning of all things.",
        "With name: the mother of all things.",
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

function reorderFrom(id: number) {
  const index = chapters.findIndex((chapter) => chapter.id === id);
  return [...chapters.slice(index), ...chapters.slice(0, index)];
}

function scrollReadingToTop() {
  window.requestAnimationFrame(() => {
    document.querySelector("[data-reading-top]")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export default function Prototype() {
  const [language, setLanguage] = useState<Language>("zh");
  const [chapterId, setChapterId] = useState(8);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const keyboard = useKeyboard();
  const { bottomInset } = useKeyboardInsets();
  const orderedChapters = useMemo(() => reorderFrom(chapterId), [chapterId]);
  const isZh = language === "zh";
  const activeCopy = chapters.find((chapter) => chapter.id === chapterId)?.[language] ?? chapters[0][language];

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
    keyboard.hide();
  };

  return (
    <>
      <MobileScroll className="app-screen">
        <main
          className="reading-shell"
          data-testid="reading-screen"
          data-reading-top
          lang={isZh ? "zh-CN" : "en"}
        >
          <header className="reading-header" aria-label={isZh ? "阅读工具" : "Reading tools"}>
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
                      <p className="chapter-eyebrow">{copy.eyebrow}</p>
                      <h1 id={`chapter-${chapter.id}-${language}`}>{copy.title}</h1>
                      <div className="verse">
                        {copy.verse.map((line) => <p key={line}>{line}</p>)}
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
      </MobileScroll>

      {!directoryOpen && !insightOpen ? (
        <form
          className="ai-composer"
          style={{ bottom: bottomInset + 10 }}
          onSubmit={submitQuestion}
          data-scroll-drag="ignore"
        >
          <span className="composer-spark" aria-hidden="true">✦</span>
          <KeyboardInput
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

      <BottomSheet
        open={directoryOpen}
        onOpenChange={setDirectoryOpen}
        title={isZh ? "目录" : "Contents"}
        description={isZh ? "帛书次序为主，括号内为今本章次" : "Silk-text order first; received chapter in parentheses"}
        snap={0.62}
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
      </BottomSheet>

      <BottomSheet
        open={insightOpen}
        onOpenChange={setInsightOpen}
        title={isZh ? "与你有关" : "For you"}
        description={submittedQuestion}
        snap={0.66}
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
      </BottomSheet>
    </>
  );
}
