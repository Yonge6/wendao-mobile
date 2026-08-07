import { writeFile, mkdir } from "node:fs/promises";
import { markReconstructionSupplies, reconstructedTokens, requiredSupplyDetails } from "./silk-integrity-core.mjs";
import { literalTranslationFor } from "./chapter-literal-translations.mjs";
import { pinyinLinesForChapter } from "./chapter-pinyin.mjs";
import { AUTO_FIX_NOTE } from "./silk-auto-proofread-core.mjs";
import { chapterThemeFor, insightsFor } from "./chapter-inspirations.mjs";

const ACCESS_DATE = "2026-08-01";
const TAOLIB_URL = "https://raw.githubusercontent.com/xinetzone/tao/main/docs/general/philosophy/laozi-boshu/appendix/phonetic.md";
const SILK_B_DE_URL = "https://raw.githubusercontent.com/changlinli/daoist_similarities/06717a2c06a423e1246bf04b37fef4649a45e0fb/nonsimpsave/nonsimpsave%20copy/%E9%A6%AC%E7%8E%8B%E5%A0%86%20-%20Mawangdui-%E8%80%81%E5%AD%90%E4%B9%99%E5%BE%B7%E7%B6%93.txt";
const SILK_B_DAO_URL = "https://raw.githubusercontent.com/changlinli/daoist_similarities/06717a2c06a423e1246bf04b37fef4649a45e0fb/nonsimpsave/nonsimpsave%20copy/%E9%A6%AC%E7%8E%8B%E5%A0%86%20-%20Mawangdui-%E8%80%81%E5%AD%90%E4%B9%99%E9%81%93%E7%B6%93.txt";
const RECEIVED_URL = "https://raw.githubusercontent.com/garychowcmu/daizhigev20/4a6d6f2088825f132521d848c2ea86cf9c9a7620/%E9%81%93%E8%97%8F/%E6%AD%A3%E7%BB%9F%E9%81%93%E8%97%8F%E6%B4%9E%E7%A5%9E%E9%83%A8/%E6%9C%AC%E6%96%87%E7%B1%BB/%E9%81%93%E5%BE%B7%E7%9C%9F%E7%BB%8F.txt";
const LEGGE_URL = "https://www.gutenberg.org/cache/epub/216/pg216.txt";

const topics = [
  ["名字不是全部", "names are not the whole"], ["相反相成", "opposites arise together"], ["减少攀比与欲望", "reduce rivalry and craving"],
  ["虚而不竭", "useful emptiness"], ["天地无偏", "impartial nature"], ["绵绵若存", "the enduring valley spirit"],
  ["不为自己而长久", "endurance without self-seeking"], ["上善如水", "the goodness of water"], ["功遂身退", "step back when complete"],
  ["抱一与玄德", "holding to one and mysterious virtue"], ["无之为用", "the usefulness of absence"], ["为腹不为目", "nourish life beyond spectacle"],
  ["有身与大患", "the self and its burdens"], ["不可名的整体", "the unnameable whole"], ["浊以静清", "clarity through stillness"],
  ["观复知常", "return and constancy"], ["自然的领导", "leadership that feels natural"], ["价值出现于失道之后", "virtues named after the Way is lost"],
  ["见素抱朴", "embrace simplicity"], ["与众不同而食母", "different from the crowd, nourished by the source"], ["惟道是从", "follow the Way"],
  ["曲则全", "yielding preserves wholeness"], ["希言自然", "few words and naturalness"], ["不自见不自伐", "do not display or boast"],
  ["道法自然", "the Way follows what is so of itself"], ["重静为根", "gravity and stillness as roots"], ["善救而无弃", "save without discarding"],
  ["知雄守雌", "know strength, keep receptivity"], ["天下神器不可为", "the world cannot be forced"], ["果而勿强", "accomplish without coercion"],
  ["兵者不祥", "weapons are inauspicious"], ["朴与知止", "simplicity and knowing when to stop"], ["自知自胜", "know and master yourself"],
  ["不自为大", "greatness without self-importance"], ["执大象", "hold the great image"], ["柔弱胜刚强", "softness overcomes hardness"],
  ["无为而自化", "transformation without forcing"], ["处厚居实", "abide in substance"], ["得一与谦下", "unity and humility"],
  ["反弱是道之动用", "return and weakness move the Way"], ["闻道与反常之言", "hearing the Way through paradox"], ["损益与冲和", "loss, gain, and harmony"],
  ["至柔驰骋至坚", "the softest moves through the hardest"], ["知足知止", "contentment and stopping"], ["大成若缺", "great completion appears incomplete"],
  ["知足常足", "contentment that endures"], ["不出户而知", "knowing without restless travel"], ["为道日损", "daily reduction in following the Way"],
  ["以百姓心为心", "take the people's heart as heart"], ["善摄生", "care for life without clinging"], ["生而不有", "create without possessing"],
  ["守母知子", "keep the mother, know the children"], ["大道甚夷", "the great Way is level"], ["由身至天下", "cultivation from self to world"],
  ["赤子与和", "the infant and harmony"], ["玄同", "mysterious sameness"], ["无事而自化", "govern with minimal interference"],
  ["祸福相倚", "fortune and trouble lean together"], ["啬与深根", "moderation and deep roots"], ["治大国若烹小鲜", "govern gently, like cooking a small fish"],
  ["大者宜为下", "the greater should take the lower place"], ["道为万物之奥", "the Way as refuge"], ["图难于易", "meet difficulty while it is easy"],
  ["慎终如始", "care for the end as the beginning"], ["不以智治国", "do not govern by cleverness"], ["江海善下", "rivers and seas lead by staying low"],
  ["慈俭不敢先", "compassion, frugality, and not being first"], ["不争之德", "the virtue of non-contention"], ["哀者胜", "the grieving side prevails"],
  ["被褐怀玉", "coarse clothes, jade within"], ["知不知", "know that you do not know"], ["自知自爱", "know and care for yourself"],
  ["勇于不敢", "courage not to dare"], ["不代司杀", "do not usurp the executioner"], ["轻死源于厚生", "overvaluing life can cheapen it"],
  ["柔弱属于生", "softness belongs to life"], ["天道补不足", "Heaven's Way fills what lacks"], ["水胜刚强", "water overcomes the hard"],
  ["执契而不责", "hold the tally without demanding"], ["小国寡民", "small community and enoughness"], ["利而不害", "benefit without harm"],
];

// These three chapters were manually audited in the product before the full import.
// Keep that higher-confidence punctuation and contextual reading instead of allowing
// a bulk reading aid to regress them.
const auditedReadingOverrides = new Map([
  [1, [
    "道可道也，非恒道也。", "名可名也，非恒名也。", "无名万物之始也；", "有名万物之母也。",
    "故恒无欲也，以观其妙；", "恒有欲也，以观其所徼。", "两者同出，异名同谓。", "玄之又玄，众妙之门。",
  ]],
  [8, [
    "上善如水。", "水善利万物而有静。", "居众人之所恶，", "故几于道矣。", "居善地，心善渊，",
    "予善天，言善信，", "政善治，事善能，", "动善时。", "夫唯不争，故无尤。",
  ]],
  [9, [
    "持而盈之，不若其已；", "揣而锐之，不可长保也。", "金玉盈室，莫之能守也；",
    "贵富而骄，自遗咎也。", "功遂身退，天之道也。",
  ]],
  [16, [
    "至虚极也，守静督也。", "万物旁作，吾以观其复也。", "夫物芸芸，各复归于其根。",
    "归根曰静，静，是谓复命。", "复命常也，知常明也。", "不知常，妄。", "妄作，凶。",
    "知常容，容乃公，公乃王，王乃天，天乃道，道乃久，没身不殆。",
  ]],
]);

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
};

function splitSentences(text) {
  const clean = text.replace(/[ \t\r\n]+/g, "").replace(/\.(?=$)/, "。");
  const lines = clean.match(/[^。！？；]+[。！？；]?/gu)?.map((line) => line.trim()).filter(Boolean) ?? [];
  return lines.length ? lines : [clean];
}

function parseReadingEdition(markdown) {
  const block = markdown.match(/```text\n([\s\S]*?)\n```/)?.[1];
  if (!block) throw new Error("Reading-edition source block not found");
  const lines = block.split(/\r?\n/);
  const chapters = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^[一二三四五六七八九十百]+（今 章）$/.test(lines[index].trim())) continue;
    const silkOrder = chapters.length + 1;
    let cursor = index + 1;
    while (!lines[cursor]?.trim()) cursor += 1;
    let id = Number(lines[cursor].trim());
    cursor += 1;
    const chinese = [];
    while (cursor < lines.length && !/^[一二三四五六七八九十百]+（今 章）$/.test(lines[cursor].trim())) {
      const line = lines[cursor].trim();
      if (/\p{Script=Han}/u.test(line)) chinese.push(line);
      cursor += 1;
    }
    const joined = chinese.join("").replace(/[ \t]/g, "");
    if (silkOrder === 30 && id === 67 && joined.startsWith("小邦寡民")) id = 80;
    chapters.push({ id, silkOrder: String(silkOrder), reading: splitSentences(joined) });
    index = cursor - 1;
  }
  if (chapters.length !== 81) throw new Error(`Expected 81 reading chapters, found ${chapters.length}`);
  return chapters;
}

function parseLiteralWitnesses(deText, daoText) {
  const de = deText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const dao = daoText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^道二千/.test(line));
  const firstDeEnd = de.findIndex((line) => /^德三千/.test(line));
  const uniqueDe = firstDeEnd >= 44 ? de.slice(0, firstDeEnd) : de.slice(0, 44);
  if (uniqueDe.length !== 44 || dao.length < 37) throw new Error(`Literal witness split failed: ${uniqueDe.length}/${dao.length}`);
  return [...uniqueDe, ...dao.slice(0, 37)];
}

function chineseNumber(value) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (value < 10) return digits[value];
  if (value === 10) return "十";
  if (value < 20) return `十${digits[value % 10]}`;
  const tens = `${digits[Math.floor(value / 10)]}十`;
  return value % 10 ? `${tens}${digits[value % 10]}` : tens;
}

function parseReceived(text) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^\s+/, "").trim()).filter(Boolean);
  const result = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].replace("第五十入", "第五十八");
    const match = heading.match(/^.+章第([一二三四五六七八九十]+)$/);
    if (!match) continue;
    const next = lines[index + 1];
    const id = Array.from({ length: 81 }, (_, offset) => offset + 1).find((candidate) => chineseNumber(candidate) === match[1]);
    if (id && next && !next.includes("章第")) result.set(id, next.replace(/#\d+/g, ""));
  }
  if (result.size < 80) throw new Error(`Expected received chapters, found ${result.size}`);
  return result;
}

function isEnglishChapterMarker(line, chapter) {
  if (chapter === 1) return /^Ch\. 1\.\s/.test(line);
  if (new RegExp(`^${chapter}\\.\\s+1\\.`).test(line)) return true;
  if (new RegExp(`^${chapter}\\.\\s*$`).test(line)) return true;
  return chapter >= 8 && new RegExp(`^${chapter}\\.\\s+[^0-9]`).test(line);
}

function stripEnglishMarker(line, chapter) {
  return line.replace(new RegExp(`^(?:Ch\\. )?${chapter}\\.(?:\\s+1\\.)?\\s*`), "");
}

function parseLegge(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  let cursor = 0;
  for (let chapter = 1; chapter <= 81; chapter += 1) {
    const found = lines.findIndex((line, index) => index >= cursor && isEnglishChapterMarker(line.trim(), chapter));
    if (found < 0) throw new Error(`Legge chapter ${chapter} not found`);
    starts.push(found);
    cursor = found + 1;
  }
  return starts.map((start, offset) => {
    const chapter = offset + 1;
    const end = starts[offset + 1] ?? lines.findIndex((line, index) => index > start && line.startsWith("*** END"));
    const body = [stripEnglishMarker(lines[start].trim(), chapter), ...lines.slice(start + 1, end)]
      .join("\n")
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
    return body.match(/[^.!?]+[.!?]+(?:[')]|$)?/g)?.map((line) => line.trim()).filter(Boolean) ?? [body];
  });
}

function compactDiff(readingText, receivedText) {
  const normalize = (value) => Array.from(value.replace(/[^\p{Script=Han}]/gu, ""));
  const reading = normalize(readingText);
  const received = normalize(receivedText || "");
  const differences = [];
  const limit = Math.min(reading.length, received.length);
  for (let index = 0; index < limit && differences.length < 8; index += 1) {
    if (reading[index] !== received[index]) differences.push(`${reading[index]}/${received[index]}`);
  }
  const lengthNote = reading.length === received.length ? "" : `；字数 ${reading.length}/${received.length}`;
  return `${differences.length ? differences.join("、") : "未检出逐位异文"}${lengthNote}`;
}

function reconstructionLocationSummary(lines) {
  const locations = lines.flatMap((line, lineIndex) => {
    const groups = [...line.matchAll(/〔([^〕]+)〕/g)].map((match) => `〔${match[1]}〕`);
    return groups.length ? [`第${lineIndex + 1}行 ${groups.join("、")}`] : [];
  });
  return locations.length ? locations.join("；") : "无校补字位";
}

function reconstructionAdditions(transcription, reconstructedVerse) {
  const tokens = reconstructedTokens(reconstructedVerse);
  return requiredSupplyDetails(transcription, reconstructedVerse).map(({ index, basis, sourceMarker }) => {
    const token = tokens[index];
    const linePosition = tokens
      .filter((candidate) => candidate.lineIndex === token.lineIndex)
      .findIndex((candidate) => candidate === token) + 1;
    return {
      character: token.character,
      line: token.lineIndex + 1,
      position: linePosition,
      absolutePosition: index + 1,
      basis,
      sourceMarker,
      source: "collatedReading",
      references: ["silkA", "receivedReference"],
      confidence: "review-required",
      note: basis === "silkBLacuna"
        ? `乙本转写此位为${sourceMarker}；校读字取自整理校读层，参考甲本及传世本，仍待原始图版逐字复核。`
        : "此字超出乙本转写的自动对齐字位；取自整理校读层，参考甲本及传世本，仍待原始图版逐字复核。",
    };
  });
}

function chapterCopy(id, silkOrder, reading, literal, received, english) {
  const correctedReading = reading.map((line) => line
    .replace("万物并作", "万物旁作")
    .replace("大方无隅", "大方无禺"));
  const reconstructedVerse = markReconstructionSupplies(literal, correctedReading);
  const lineByLineTranslation = literalTranslationFor(id);
  if (lineByLineTranslation.length !== reconstructedVerse.length) {
    throw new Error(`Chapter ${id}: ${lineByLineTranslation.length} translations for ${reconstructedVerse.length} reconstructed lines`);
  }
  const [topicZh, topicEn] = topics[id - 1];
  const chapterTheme = chapterThemeFor(id);
  const insights = insightsFor(id);
  const anchor = correctedReading[0].replace(/[。！？；]/g, "").slice(0, 12);
  // Chapter 16's visible-witness correction must not rewrite the already
  // published modern interpretation or life-practice copy in this audit.
  const modernCopyAnchor = id === 16 ? "至虚极也，守情表也" : anchor;
  const missing = (literal.match(/[□○]/g) ?? []).length;
  const additions = reconstructionAdditions(literal, reconstructedVerse);
  const supplied = additions.length;
  const supplyLocations = reconstructionLocationSummary(reconstructedVerse);
  const collation = compactDiff(correctedReading.join(""), received);
  const pinyinLines = pinyinLinesForChapter(id, correctedReading);
  const uncertaintyZh = missing
    ? `乙本本章可见 ${missing} 个缺损符号（□/○）；校读层以〔〕标出 ${supplied} 个据上下文恢复或超出转写字位的字。补字参考帛书甲本及传世本，具体字位仍需据图版逐项复核。`
    : `乙本本章未见缺损符号；校读层仍对借字、异体和断句作整理${supplied ? `，并以〔〕标出 ${supplied} 个超出转写字位的字` : ""}。校读字不等同原帛字形。`;
  const uncertaintyEn = missing
    ? `Silk B contains ${missing} visible lacuna signs (□/○) here. The reconstruction marks ${supplied} restored or additional graphs with 〔〕; they are checked against Silk A and received texts and are not literal Silk B graphs.`
    : `No lacuna sign appears in this Silk B segment. Loan and variant graphs are still read contextually${supplied ? `, and ${supplied} additional graphs are marked with 〔〕` : ""}; the reading form is not a facsimile transcription.`;
  const baseReconstructionNotes = missing
    ? `缺损记录：乙本转写保留 ${missing} 个缺损符号（□/○）。校补位置：${supplyLocations}，共 ${supplied} 字。补字依据：帛书甲本及传世本互校；逐字归属仍以校勘原始图版为最终依据。`
    : `缺损记录：乙本转写未见缺损符号。校补位置：${supplyLocations}${supplied ? `，共 ${supplied} 字` : ""}。校读正文只对异体、通假和现代断句作可读化整理；传世本只作参照。`;
  const reconstructionNotes = id === 16 ? `${baseReconstructionNotes} ${AUTO_FIX_NOTE}` : baseReconstructionNotes;
  return {
    id,
    silkOrder,
    theme: { zh: topicZh, en: topicEn },
    sources: {
      silkBTranscription: literal,
      receivedReference: received,
      reconstructionNotes,
      accessed: ACCESS_DATE,
    },
    zh: {
      eyebrow: `帛书乙本底本校读 · 对应今本第${chineseNumber(id)}章`,
      title: anchor,
      reconstructedVerse,
      lineByLineTranslation,
      additions,
      pinyin: pinyinLines,
      variant: `版本参照：以马王堆帛书乙本为底本，残缺处参考甲本及传世本校补。这是整理后的校读版本，不是影印转写。${uncertaintyZh} 传世参照的主要逐位差异（校勘索引，需结合王弼注本人工复核）：${collation}。`,
      explanation: [
        { title: "直译｜逐句读懂这一章", body: "以下今译逐句对应上方校读正文；〔〕中的校补字也参与翻译，但不因此变成帛书乙本原字。" },
        { title: "本章主旨", body: chapterTheme.zh },
        { title: "校读｜原字、缺损与参照分层", body: `${uncertaintyZh} 上方已公开完整乙本字符段，“□”保留缺损；主文的可读字、拼音与断句属校读层。传世差异仅作参照，不倒灌成“帛书原文”。` },
      ],
      related: [
        { title: "对我们的启发", body: insights.zh.join("\n"), points: insights.zh },
        { title: "你的人生说明书", body: `这一章的个人化镜头是“${topicZh}”。验证后的人类图会把你的类型、策略、权威与侧写带入这一主题，用来拓宽选择，不替你做决定。` },
      ],
      action: `今天用三次慢呼吸读一遍“${modernCopyAnchor}”，然后写下一个与“${topicZh}”有关的最小行动。`,
    },
    en: {
      eyebrow: `Silk B Base Reading · Received Chapter ${id}`,
      title: topicEn.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      verse: english,
      variant: `Received-text reference: this is a Silk B Based Reconstruction, not a facsimile transcription. ${uncertaintyEn} Received-text alignment differences: ${collation}. The English scripture uses James Legge's public-domain received-text translation as a transparent comparison, so it must not be treated as a literal translation of every damaged Silk B graph.`,
      explanation: [
        { title: "Plain reading · Read the movement of the whole chapter", body: `Beginning from “${modernCopyAnchor},” this chapter explores ${topicEn}. It does not demand a rigid answer; it asks how conditions, opposites, limits, and timing change what wise action looks like.` },
        { title: "Chapter theme", body: chapterTheme.en },
        { title: "Collation · Keep witness, supply, and comparison separate", body: `${uncertaintyEn} The full literal segment and its lacuna marks are disclosed above. Readable characters, punctuation, and pronunciation belong to the edited reading layer; received editions remain comparisons only.` },
      ],
      related: [
        { title: "What this teaches us", body: insights.en.join("\n"), points: insights.en },
        { title: "Your life manual", body: `The personalized lens for this chapter is ${topicEn}. After chart verification, your type, strategy, authority, and profile are brought into this distinct theme to widen choices, never to issue a verdict.` },
      ],
      action: `Read the opening “${modernCopyAnchor}” with three slow breaths, then write one low-effort action related to ${topicEn}.`,
    },
  };
}

const [readingSource, silkDe, silkDao, receivedSource, leggeSource] = await Promise.all([
  fetchText(TAOLIB_URL), fetchText(SILK_B_DE_URL), fetchText(SILK_B_DAO_URL), fetchText(RECEIVED_URL), fetchText(LEGGE_URL),
]);
const readings = parseReadingEdition(readingSource);
const literals = parseLiteralWitnesses(silkDe, silkDao);
const received = parseReceived(receivedSource);
const legge = parseLegge(leggeSource);
const chapters = readings.map((chapter, index) => chapterCopy(
  chapter.id,
  chapter.silkOrder,
  auditedReadingOverrides.get(chapter.id) ?? chapter.reading,
  literals[index],
  received.get(chapter.id) ?? "传世本本章待人工复核",
  legge[chapter.id - 1],
));

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/chapters.json", import.meta.url), `${JSON.stringify(chapters, null, 2)}\n`);
await writeFile(new URL("../src/data/sources.json", import.meta.url), `${JSON.stringify({
  accessed: ACCESS_DATE,
  editorialPolicy: "Silk Manuscript B is the primary witness. The diplomatic transcription, explicitly marked reconstruction, and modern interpretation remain separate layers; received texts never replace the witness silently.",
  sources: [
    { title: "Chinese Text Project: Mawangdui Laozi B", url: "https://ctext.org/mawangdui/laozi-b", role: "canonical online witness and parallel-text locator" },
    { title: "Silk B diplomatic transcription mirror", url: "https://github.com/changlinli/daoist_similarities", role: "machine-auditable transcription segments retaining lacuna markers; not a facsimile" },
    { title: "Hunan Museum / Mawangdui collection context", url: "https://www.hnmuseum.com/", role: "institutional provenance and collection context" },
    { title: "Wang Bi received-text commentary (public-domain digital witness)", url: "https://github.com/shjwudp/shu/blob/61aa02363241bcf32574708f1ff06ed698fb646b/books/%E5%85%88%E7%A7%A6/%E9%81%93%E5%BE%B7%E7%BB%8F.txt", role: "received-text comparison; not used to overwrite Silk B silently" },
    { title: "Silk-text-order phonetic reading aid", url: TAOLIB_URL, role: "reading-edition alignment and pronunciation cross-check; corrected where its chapter label conflicts with the text" },
    { title: "James Legge public-domain English translation", url: "https://www.gutenberg.org/ebooks/216", role: "English received-text comparison, openly distinguished from damaged Silk B" },
  ],
  knownSourceCorrections: [
    "The reading aid labels its silk-order chapter 30 as received chapter 67; the text is received chapter 80 (Small state, few people). The import corrects it to 80 and the validator enforces unique chapters 1-81.",
    "Automated received-text character alignment is an index for manual collation, not a scholarly critical apparatus.",
    "Received chapter 16: the imported reading “守情表也” was corrected to Silk B visible wording “守静督也” from the repository transcription and CText; transmitted “笃” remains comparison only. Image verification is still pending.",
  ],
}, null, 2)}\n`);

console.log(`Generated ${chapters.length} chapters in Silk-text order.`);
