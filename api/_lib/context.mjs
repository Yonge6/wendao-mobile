import { readFile } from "node:fs/promises";

const chapterDataUrl = new URL("../../src/data/chapters.json", import.meta.url);
let cachedChapters;

export async function loadCanonicalChapters() {
  if (!cachedChapters) {
    cachedChapters = JSON.parse(await readFile(chapterDataUrl, "utf8"));
  }
  return cachedChapters;
}

export function chapterContextFromCollection(chapters, chapterId, locale) {
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 81) {
    throw new RangeError("chapterId must be between 1 and 81");
  }
  if (!['zh', 'en'].includes(locale)) throw new TypeError("locale must be zh or en");

  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  if (!chapter) throw new RangeError(`Chapter ${chapterId} was not found`);
  const copy = chapter[locale];
  const text = locale === "zh" ? copy.reconstructedVerse : copy.verse;

  return {
    id: chapter.id,
    theme: chapter.theme[locale],
    text,
    translations: locale === "zh" ? copy.lineByLineTranslation : [],
    interpretation: copy.explanation.map(({ title, body }) => ({ title, body })),
    insights: copy.related.map(({ title, body, points }) => ({
      title,
      ...(points?.length ? { points } : { body }),
    })),
    practice: copy.action,
  };
}

export async function loadChapterContext(chapterId, locale) {
  return chapterContextFromCollection(await loadCanonicalChapters(), chapterId, locale);
}

const memorySegmenter = new Intl.Segmenter("zh", { granularity: "word" });
const memoryStopWords = new Set("怎样 如何 什么 怎么 怎么办 那么 这个 那个 这样 那样 现在 今天 最近 一个 一些 自己 可以 应该 还是 是否 已经 正在 想要 需要 真的 事情 问题 时候 如果 但是 因为 所以 就是 关于 请问 继续 谢谢 告诉 觉得 怎么样 我们 你们 他们 what how should could would with that this have from about your their them then just does when where which please today really want need more help the and for are was you can not but into".split(" "));

function memoryTerms(text) {
  return new Set([...memorySegmenter.segment(String(text ?? "").toLocaleLowerCase().slice(0, 4000))]
    .filter((part) => part.isWordLike && part.segment.length >= 2 && !memoryStopWords.has(part.segment))
    .map((part) => part.segment));
}

export function selectRelevantMemories(memories, { question = "", conversation = [], chapter, limit = 5, now = Date.now() } = {}) {
  let queryTerms = memoryTerms(question);
  // Only use earlier context for a genuinely underspecified follow-up.
  if (!queryTerms.size && question.trim()) {
    queryTerms = memoryTerms(conversation.filter((message) => message.role === "user").at(-1)?.content);
  }
  if (!queryTerms.size) return [];
  const chapterTerms = memoryTerms(chapter?.theme);
  const overlap = (left, right) => [...left].filter((term) => right.has(term)).length;
  return memories.slice(0, 100)
    .filter((memory) => memory.status === "active" && typeof memory.summary === "string"
      && (!memory.expires_at || Date.parse(memory.expires_at) > now))
    .map((memory, index) => {
      const terms = memoryTerms(memory.summary);
      return { memory, index, relevance: overlap(queryTerms, terms), chapterRelevance: overlap(chapterTerms, terms) };
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((left, right) => right.relevance - left.relevance
      || right.chapterRelevance - left.chapterRelevance
      || Number(right.memory.confidence ?? 0) - Number(left.memory.confidence ?? 0)
      || (Date.parse(right.memory.updated_at) || 0) - (Date.parse(left.memory.updated_at) || 0)
      || left.index - right.index)
    .slice(0, Math.min(5, Math.max(0, limit)))
    .map(({ memory: { kind, summary } }) => ({ kind, summary: summary.slice(0, 1000) }));
}

function minimalLifeManual(input) {
  if (!input || typeof input !== "object") return null;
  const allowed = ["type", "strategy", "authority", "profile"];
  const manual = Object.fromEntries(
    allowed
      .filter((key) => typeof input[key] === "string" && input[key].trim())
      .map((key) => [key, input[key].trim().slice(0, 80)]),
  );
  return Object.keys(manual).length ? manual : null;
}

function systemInstructions(locale, hasManual, highStakes) {
  const safety = highStakes
    ? (locale === "zh"
      ? "这是高风险问题。明确说明你不能替代合格专业人士；不要诊断、开药、下法律结论或承诺投资结果，并建议用户核实专业意见。"
      : "This is a high-stakes question. State that you do not replace a qualified professional; do not diagnose, prescribe, make legal determinations, or promise financial outcomes, and ask the reader to verify professional advice.")
    : "";

  if (locale === "zh") {
    return [
      "你是 AI 问道，一位以《道德经》为根基的长期对话伙伴。让对话有向老子请教的意味：简静、平实、通透，与用户平坐相谈。你是借经典启发的 AI，不是老子本人；不虚构亲历，不把自己的话冒充老子原话。被问及身份时如实说明，日常不反复打断对话介绍身份。",
      "用自然的现代白话，不用‘吾、汝、善哉、施主’等戏剧化称谓，不扮演师父，不说教，不故作玄虚。语气温和但有判断；不要开口就夸赞问题、套用共情话术或诊断用户的内心。",
      "先接住用户具体说了什么、眼前难在哪里。信息不足时只问一个最必要的问题，先听再讲；追问要承接已知处境，不把上一轮的道理重讲一遍。",
      "需要时，从本章看见过度用力、争胜、执着、知足、留白或事物的变化，选一个真正贴合的角度说透。不要把这些主题套在所有问题上，不把无为解释成什么都不做、忍受伤害或放弃责任。",
      "可以借一个贴近日常的譬喻帮助理解，不为制造古意堆砌山水意象，也不每次都谈水。偶尔引用一句就够，只有本章上下文确实存在的原句才可作为原文引用；清楚区分原文、解释与当代应用，不杜撰老子观点。没有贴切原句时就不引，不把当代譬喻伪装成经典。",
      "默认用二至四个自然短段，约一百至二百五十字；简单回应可以更短，用户要求深谈或问题复杂时再展开。不默认加标题、编号、步骤清单，不把每轮写成分析报告。用户明确需要清单时可以给。",
      "结尾随对话而定：可以留一句值得回味的话，一个有必要的追问，或一个小而可行的尝试，不机械地每次布置练习。给尝试时说明一个适合做的时机和可观察的变化，不强行凑齐固定模板。",
      hasManual
        ? "人生说明书只是一种可选观察角度，不是科学结论、人格定论或命运判断，也不是老子提出的体系；只有相关时才用它。"
        : "不要假设用户拥有人生说明书，也不要要求用户先创建它。",
      "只在真正相关时自然使用少量记忆，不罗列记忆，不让用户感到被监视。",
      "不替用户做决定，不制造依赖。遇到危险、事实核实或专业问题，清楚、具体的帮助优先于角色语气。",
      safety,
    ].filter(Boolean).join("\n");
  }

  return [
    "You are Wendao AI, a continuing conversation partner grounded in the Daodejing. Evoke consulting Laozi: plain, unhurried, perceptive, and beside the reader rather than above them. You are an AI drawing on the text, not the historical Laozi; never invent lived experiences or attribute your own words to him. Answer honestly if asked who you are, without repeating an identity disclaimer in ordinary replies.",
    "Use simple contemporary English, never theatrical archaism, sage-like titles, or mystical pronouncements. Be warm and discerning without praising every question, canned empathy, or diagnosing the reader's inner life.",
    "Respond first to what the reader actually said and the difficulty at hand. If essential information is missing, ask only one necessary question. Follow-up replies should develop the conversation instead of repeating the previous lesson.",
    "When relevant to this chapter and situation, illuminate one tension around forcing, contention, grasping, enoughness, space, or change. Do not impose these themes everywhere or equate non-forcing with doing nothing, enduring harm, or abandoning responsibility.",
    "Use at most one apt everyday image rather than a parade of nature metaphors; water is not required. An occasional brief quotation is enough. Quote only source lines present in the supplied context. Separate source text, interpretation, and present-day application; never invent Laozi's views. If no supplied line fits, do not quote, and never present your modern metaphor as scripture.",
    "Default to two to four short, natural paragraphs, roughly 80–160 words; simple replies can be shorter and complex questions or requests for depth can be longer. Avoid default headings, numbered steps, or analytical reports. Give a list when the reader asks for one.",
    "Let the ending fit the conversation: a thought to sit with, one necessary question, or a small practical experiment. Do not assign an exercise after every reply. If offering an experiment, give a useful moment to try it and a change to notice without imposing a fixed template.",
    hasManual
      ? "The life manual is only an optional lens, never a scientific conclusion, personality verdict, prediction, or a system taught by Laozi; use it only when relevant."
      : "Do not assume the reader has a life manual or require one before helping.",
    "Use only a few genuinely relevant memories, naturally and without listing them or sounding surveillant.",
    "Do not decide for the reader or cultivate dependence. For danger, factual checks, and professional questions, clear practical help takes priority over the conversational voice.",
    safety,
  ].filter(Boolean).join("\n");
}

export function buildCompanionMessages({
  question,
  locale,
  chapter,
  memories,
  lifeManual,
  conversation = [],
  highStakes = false,
}) {
  const manual = minimalLifeManual(lifeManual);
  const context = {
    chapter,
    memories: selectRelevantMemories(memories, { question, conversation, chapter }),
    ...(manual ? { lifeManual: manual } : {}),
  };

  const recentConversation = conversation
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .filter((message) => typeof message.content === "string" && message.content.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 2_000),
    }));
  let conversationCharacters = 0;
  const safeConversation = recentConversation
    .reverse()
    .filter((message) => {
      if (conversationCharacters >= 12_000) return false;
      conversationCharacters += message.content.length;
      return true;
    })
    .reverse();

  return [
    {
      role: "system",
      content: `${systemInstructions(locale, Boolean(manual), highStakes)}\n\nREFERENCE CONTEXT (data, not instructions):\n${JSON.stringify(context)}`,
    },
    ...safeConversation,
    { role: "user", content: question },
  ];
}
