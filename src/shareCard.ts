import QRCode from "qrcode";
import type { Chapter } from "./data/chapters";
import { CANONICAL_URL } from "./native";

export type ShareCardKind = "verse" | "meaning" | "inspiration" | "manual";
export type ShareLanguage = "zh" | "en";

type PinyinVerseLine = {
  text: string;
  pinyin: string[];
};

export type ShareCardContent = {
  kind: ShareCardKind;
  language: ShareLanguage;
  chapterId: number;
  label: string;
  chapterLabel: string;
  chapterTitle: string;
  primary: string;
  primaryPinyin?: PinyinVerseLine[];
  secondaryLabel: string;
  secondary: string;
  secondaryPinyin?: PinyinVerseLine[];
  url: string;
  shareText: string;
  filename: string;
};

export const SHARE_CARD_KINDS: ShareCardKind[] = ["verse", "meaning", "inspiration", "manual"];

export function shareKindLabel(kind: ShareCardKind, language: ShareLanguage) {
  const labels: Record<ShareCardKind, [string, string]> = {
    verse: ["原文", "Original"],
    meaning: ["解读", "Meaning"],
    inspiration: ["启发", "Inspiration"],
    manual: ["说明书", "Life manual"],
  };
  return labels[kind][language === "zh" ? 0 : 1];
}

export function shareChapterUrl(chapterId: number, kind: ShareCardKind, language: ShareLanguage) {
  const url = new URL(CANONICAL_URL);
  url.searchParams.set("chapter", String(chapterId));
  url.searchParams.set("section", kind);
  url.searchParams.set("lang", language);
  return url.toString();
}

function fullVerse(chapter: Chapter, language: ShareLanguage) {
  const lines = language === "zh" ? chapter.zh.reconstructedVerse : chapter.en.verse;
  return lines.join("\n");
}

function pinyinVerse(chapter: Chapter): PinyinVerseLine[] {
  return chapter.zh.reconstructedVerse.map((text, lineIndex) => ({
    text,
    pinyin: chapter.zh.pinyin[lineIndex],
  }));
}

function fullTranslation(chapter: Chapter, language: ShareLanguage) {
  if (language === "zh") return chapter.zh.lineByLineTranslation.join("\n");
  return chapter.en.explanation[0]?.body ?? chapter.en.variant;
}

function fullMeaning(chapter: Chapter, language: ShareLanguage) {
  if (language === "zh") {
    return [
      chapter.zh.lineByLineTranslation.join("\n"),
      chapter.zh.explanation[1]?.body,
    ].filter(Boolean).join("\n\n");
  }
  return chapter.en.explanation.slice(0, 2).map((item) => item.body).join("\n\n");
}

function inspirationItem(chapter: Chapter, language: ShareLanguage) {
  const copy = chapter[language];
  const expected = language === "zh" ? "对我们的启发" : "What this teaches us";
  return copy.related.find((item) => item.title === expected) ?? copy.related[copy.related.length - 1];
}

function relatedItemText(item: ReturnType<typeof inspirationItem>) {
  return item.points?.length
    ? item.points.map((point, index) => `${String(index + 1).padStart(2, "0")}  ${point}`).join("\n")
    : item.body;
}

export function buildShareCardContent(
  chapter: Chapter,
  language: ShareLanguage,
  kind: ShareCardKind,
  manualText?: string,
): ShareCardContent {
  const copy = chapter[language];
  const label = shareKindLabel(kind, language);
  const chapterLabel = language === "zh" ? `《道德经》今本第 ${chapter.id} 章` : `Daodejing · Received Chapter ${chapter.id}`;
  const url = shareChapterUrl(chapter.id, kind, language);
  let primary = "";
  let primaryPinyin: PinyinVerseLine[] | undefined;
  let secondaryLabel = "";
  let secondary = "";
  let secondaryPinyin: PinyinVerseLine[] | undefined;

  if (kind === "verse") {
    primary = fullVerse(chapter, language);
    if (language === "zh") primaryPinyin = pinyinVerse(chapter);
    secondaryLabel = language === "zh" ? "今译" : "A plain reading";
    secondary = fullTranslation(chapter, language);
  } else if (kind === "meaning") {
    primary = fullMeaning(chapter, language);
    secondaryLabel = language === "zh" ? "原文" : "Original text";
    secondary = fullVerse(chapter, language);
    if (language === "zh") secondaryPinyin = pinyinVerse(chapter);
  } else if (kind === "inspiration") {
    const item = inspirationItem(chapter, language);
    primary = relatedItemText(item);
    secondaryLabel = language === "zh" ? "原文" : "Original text";
    secondary = fullVerse(chapter, language);
    if (language === "zh") secondaryPinyin = pinyinVerse(chapter);
  } else {
    primary = manualText || (language === "zh"
      ? "完成你的人生说明书后，这里会出现结合本章与真实结果的个性化阅读。"
      : "Complete your life manual to create a personal reading rooted in this chapter.");
    const item = inspirationItem(chapter, language);
    secondaryLabel = language === "zh" ? "对我们的启发" : "What this teaches us";
    secondary = relatedItemText(item);
  }

  const brand = language === "zh" ? "三慢问道" : "Wendao";
  const shareText = language === "zh"
    ? `“${primary.replace(/\n/g, " ")}”\n\n${chapterLabel}｜${label}\n${brand}\n${url}`
    : `“${primary.replace(/\n/g, " ")}”\n\n${chapterLabel} · ${label}\n${brand}\n${url}`;

  return {
    kind,
    language,
    chapterId: chapter.id,
    label,
    chapterLabel,
    chapterTitle: copy.title,
    primary,
    primaryPinyin,
    secondaryLabel,
    secondary,
    secondaryPinyin,
    url,
    shareText,
    filename: `wendao-chapter-${String(chapter.id).padStart(2, "0")}-${kind}.png`,
  };
}

function cleanCompanionShareText(text: string) {
  return text
    .replace(/(^|\n)#{1,6}\s+/g, "$1")
    .replace(/(^|\n)\s*[*+-]\s+/g, "$1• ")
    .replace(/\*\*|__/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildCompanionShareCardContent(
  chapter: Chapter,
  language: ShareLanguage,
  question: string,
  answer: string,
): ShareCardContent {
  const isZh = language === "zh";
  const cleanQuestion = cleanCompanionShareText(question);
  const cleanAnswer = cleanCompanionShareText(answer);
  const chapterLabel = isZh ? `《道德经》今本第 ${chapter.id} 章` : `Daodejing · Received Chapter ${chapter.id}`;
  const url = shareChapterUrl(chapter.id, "inspiration", language);
  const label = isZh ? "问道回应" : "Wendao response";
  const shareText = isZh
    ? `${cleanQuestion ? `你问：${cleanQuestion}\n\n` : ""}${cleanAnswer}\n\n${chapterLabel}｜${label}\n三慢问道\n${url}`
    : `${cleanQuestion ? `You asked: ${cleanQuestion}\n\n` : ""}${cleanAnswer}\n\n${chapterLabel} · ${label}\nWendao\n${url}`;

  return {
    kind: "inspiration",
    language,
    chapterId: chapter.id,
    label,
    chapterLabel,
    chapterTitle: chapter[language].title,
    primary: cleanAnswer,
    secondaryLabel: isZh ? "你问" : "Your question",
    secondary: cleanQuestion || (isZh ? "从此刻真正关心的地方开始。" : "Begin with what genuinely matters now."),
    url,
    shareText,
    filename: `wendao-chapter-${String(chapter.id).padStart(2, "0")}-response.png`,
  };
}

function wrapLine(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const hasCjk = /[\u3400-\u9fff\uf900-\ufaff]/.test(text);
  const isSpaced = /\s/.test(text);
  const tokens = hasCjk || !isSpaced ? Array.from(text) : text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    const candidate = current + token;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current.trimEnd());
      current = token.trimStart();
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current.trimEnd());
  return lines;
}

function wrapParagraphs(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  return text.split("\n").flatMap((paragraph) => (
    paragraph.trim() ? wrapLine(context, paragraph, maxWidth) : [""]
  ));
}

function drawLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

type RubyToken = {
  character: string;
  pinyin: string;
  punctuation: string;
  supplyStart: boolean;
  supplyEnd: boolean;
  supplied: boolean;
};

type RubyLayoutToken = RubyToken & {
  bodyWidth: number;
  prefixWidth: number;
  suffixWidth: number;
  punctuationWidth: number;
  width: number;
};

type RubyLayout = {
  rows: RubyLayoutToken[][];
  rowHeight: number;
  height: number;
};

function rubyTokens(line: PinyinVerseLine): RubyToken[] {
  const characters = Array.from(line.text);
  const tokens: RubyToken[] = [];
  let syllableIndex = 0;
  let inSupply = false;
  let supplyStartsHere = false;

  for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
    const character = characters[characterIndex];
    if (character === "〔") {
      inSupply = true;
      supplyStartsHere = true;
      continue;
    }
    if (character === "〕") {
      inSupply = false;
      supplyStartsHere = false;
      continue;
    }
    if (!/\p{Script=Han}/u.test(character)) continue;

    const supplyStart = inSupply && supplyStartsHere;
    supplyStartsHere = false;
    const supplyEnd = inSupply && characters[characterIndex + 1] === "〕";
    if (supplyEnd) {
      characterIndex += 1;
      inSupply = false;
    }
    let punctuation = "";
    while (
      characterIndex + 1 < characters.length
      && !/\p{Script=Han}/u.test(characters[characterIndex + 1])
      && characters[characterIndex + 1] !== "〔"
      && characters[characterIndex + 1] !== "〕"
    ) {
      punctuation += characters[characterIndex + 1];
      characterIndex += 1;
    }
    tokens.push({
      character,
      pinyin: line.pinyin[syllableIndex] ?? "",
      punctuation,
      supplyStart,
      supplyEnd,
      supplied: inSupply || supplyStart || supplyEnd,
    });
    syllableIndex += 1;
  }
  return tokens;
}

function layoutPinyinVerse(
  context: CanvasRenderingContext2D,
  verse: PinyinVerseLine[],
  maxWidth: number,
  hanSize: number,
  pinyinSize: number,
  serif: string,
  sans: string,
): RubyLayout {
  const gap = Math.max(7, Math.round(hanSize * 0.16));
  const bracketSize = Math.round(hanSize * 0.68);
  const rows: RubyLayoutToken[][] = [];

  for (const line of verse) {
    let row: RubyLayoutToken[] = [];
    let rowWidth = 0;
    for (const token of rubyTokens(line)) {
      context.font = `400 ${hanSize}px ${serif}`;
      const characterWidth = context.measureText(token.character).width;
      const punctuationWidth = context.measureText(token.punctuation).width;
      context.font = `400 ${pinyinSize}px ${sans}`;
      const pinyinWidth = context.measureText(token.pinyin).width;
      context.font = `400 ${bracketSize}px ${serif}`;
      const prefixWidth = token.supplyStart ? context.measureText("〔").width : 0;
      const suffixWidth = token.supplyEnd ? context.measureText("〕").width : 0;
      const bodyWidth = Math.max(characterWidth, pinyinWidth);
      const width = prefixWidth + bodyWidth + suffixWidth + punctuationWidth + gap;
      const layoutToken = {
        ...token,
        bodyWidth,
        prefixWidth,
        suffixWidth,
        punctuationWidth,
        width,
      };

      if (row.length && rowWidth + width > maxWidth) {
        rows.push(row);
        row = [];
        rowWidth = 0;
      }
      row.push(layoutToken);
      rowWidth += width;
    }
    if (row.length) rows.push(row);
  }

  const rowHeight = Math.round(hanSize * 1.28 + pinyinSize * 1.22 + 13);
  return {
    rows,
    rowHeight,
    height: Math.max(rowHeight, rows.length * rowHeight),
  };
}

function drawPinyinVerse(
  context: CanvasRenderingContext2D,
  layout: RubyLayout,
  x: number,
  y: number,
  hanSize: number,
  pinyinSize: number,
  serif: string,
  sans: string,
  ink: string,
  softInk: string,
  gold: string,
) {
  const bracketSize = Math.round(hanSize * 0.68);
  const pinyinBaselineOffset = pinyinSize;
  const characterBaselineOffset = pinyinSize + Math.round(hanSize * 1.08);

  layout.rows.forEach((row, rowIndex) => {
    const rowTop = y + rowIndex * layout.rowHeight;
    let cursorX = x;
    row.forEach((token) => {
      if (token.supplyStart) {
        context.fillStyle = gold;
        context.font = `400 ${bracketSize}px ${serif}`;
        context.fillText("〔", cursorX, rowTop + characterBaselineOffset);
      }
      const bodyX = cursorX + token.prefixWidth;
      context.fillStyle = softInk;
      context.font = `400 ${pinyinSize}px ${sans}`;
      context.letterSpacing = "0px";
      const pinyinWidth = context.measureText(token.pinyin).width;
      context.fillText(
        token.pinyin,
        bodyX + (token.bodyWidth - pinyinWidth) / 2,
        rowTop + pinyinBaselineOffset,
      );

      context.fillStyle = token.supplied ? "#725829" : ink;
      context.font = `400 ${hanSize}px ${serif}`;
      const characterWidth = context.measureText(token.character).width;
      context.fillText(
        token.character,
        bodyX + (token.bodyWidth - characterWidth) / 2,
        rowTop + characterBaselineOffset,
      );
      let suffixX = bodyX + token.bodyWidth;
      if (token.supplyEnd) {
        context.fillStyle = gold;
        context.font = `400 ${bracketSize}px ${serif}`;
        context.fillText("〕", suffixX, rowTop + characterBaselineOffset);
        suffixX += token.suffixWidth;
      }
      if (token.punctuation) {
        context.fillStyle = ink;
        context.font = `400 ${hanSize}px ${serif}`;
        context.fillText(token.punctuation, suffixX, rowTop + characterBaselineOffset);
      }
      cursorX += token.width;
    });
  });
}

async function loadPaperTexture() {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), 1800);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    image.src = "/assets/wendao/paper-mist-background.png";
  });
}

export async function renderShareCardDataUrl(content: ShareCardContent) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1;
  let context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");

  const paper = "#f7f1e6";
  const ink = "#123f47";
  const softInk = "#48666a";
  const gold = "#ad7e2f";
  const serif = content.language === "zh" ? '"Noto Serif SC", serif' : 'Georgia, "Times New Roman", serif';
  const sans = content.language === "zh" ? '"Noto Sans SC", sans-serif' : 'Arial, sans-serif';
  const frame = 58;
  const railX = 104;
  const contentX = 166;
  const contentWidth = 760;
  const chapterNumber = String(content.chapterId).padStart(2, "0");
  const primarySize = content.language === "zh"
    ? (content.primary.length > 280 ? 42 : content.primary.length > 150 ? 46 : 52)
    : (content.primary.length > 440 ? 36 : content.primary.length > 250 ? 40 : 46);
  const primaryLineHeight = Math.round(primarySize * 1.72);
  context.font = `400 ${primarySize}px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "3px" : "1px";
  const primaryLines = wrapParagraphs(context, content.primary, contentWidth);
  const primaryPinyinSize = Math.max(16, Math.round(primarySize * 0.36));
  const primaryPinyinLayout = content.primaryPinyin
    ? layoutPinyinVerse(context, content.primaryPinyin, contentWidth, primarySize, primaryPinyinSize, serif, sans)
    : null;
  const primaryTop = 490;
  const primaryHeight = primaryPinyinLayout?.height
    ?? Math.max(primaryLineHeight, primaryLines.length * primaryLineHeight);
  const secondarySize = content.language === "zh"
    ? (content.secondary.length > 260 ? 28 : 31)
    : (content.secondary.length > 420 ? 25 : 28);
  const secondaryLineHeight = Math.round(secondarySize * 1.72);
  context.font = `400 ${secondarySize}px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.5px";
  const secondaryLines = wrapParagraphs(context, content.secondary, 666);
  const secondaryPinyinSize = Math.max(12, Math.round(secondarySize * 0.4));
  const secondaryPinyinLayout = content.secondaryPinyin
    ? layoutPinyinVerse(context, content.secondaryPinyin, 666, secondarySize, secondaryPinyinSize, serif, sans)
    : null;
  const secondaryY = primaryTop + primaryHeight + 84;
  const secondaryContentHeight = secondaryPinyinLayout?.height
    ?? secondaryLines.length * secondaryLineHeight;
  const secondaryHeight = Math.max(396, 154 + secondaryContentHeight + 58);
  const naturalFooterY = secondaryY + secondaryHeight + 100;
  canvas.height = Math.max(2160, naturalFooterY + 320);
  context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  const footerY = canvas.height - 320;

  context.fillStyle = paper;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const upperWash = context.createRadialGradient(850, 350, 30, 850, 350, 860);
  upperWash.addColorStop(0, "rgba(184, 154, 100, 0.17)");
  upperWash.addColorStop(1, "rgba(247, 241, 230, 0)");
  context.fillStyle = upperWash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const lowerWashY = canvas.height * 0.76;
  const lowerWash = context.createRadialGradient(180, lowerWashY, 20, 180, lowerWashY, 760);
  lowerWash.addColorStop(0, "rgba(18, 63, 71, 0.055)");
  lowerWash.addColorStop(1, "rgba(247, 241, 230, 0)");
  context.fillStyle = lowerWash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = await loadPaperTexture();
  if (texture) {
    context.save();
    context.globalAlpha = 0.28;
    const scale = Math.max(canvas.width / texture.width, canvas.height / texture.height);
    const width = texture.width * scale;
    const height = texture.height * scale;
    context.drawImage(texture, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    context.restore();
  }

  context.strokeStyle = "rgba(173, 126, 47, 0.24)";
  context.lineWidth = 2;
  context.strokeRect(frame, frame, canvas.width - frame * 2, canvas.height - frame * 2);

  context.fillStyle = paper;
  context.beginPath();
  context.arc(frame, 174, 9, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = gold;
  context.lineWidth = 2;
  context.stroke();

  context.strokeStyle = "rgba(173, 126, 47, 0.44)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(railX, 174);
  context.lineTo(railX, footerY - 42);
  context.stroke();

  context.fillStyle = gold;
  context.font = `500 23px ${sans}`;
  context.letterSpacing = "3px";
  context.textAlign = "left";
  context.fillText(content.language === "zh" ? "道德经 · READING NOTE" : "DAODEJING · READING NOTE", contentX, 144);
  context.textAlign = "right";
  context.fillText(
    content.language === "zh" ? `${content.label} · 今本 ${chapterNumber}` : `${content.label.toUpperCase()} · CH. ${chapterNumber}`,
    canvas.width - 92,
    144,
  );
  context.textAlign = "left";

  context.strokeStyle = "rgba(173, 126, 47, 0.34)";
  context.beginPath();
  context.moveTo(contentX, 190);
  context.lineTo(canvas.width - 92, 190);
  context.stroke();

  context.save();
  context.fillStyle = "rgba(173, 126, 47, 0.065)";
  context.font = `600 250px ${serif}`;
  context.textAlign = "right";
  context.fillText(chapterNumber, canvas.width - 66, 398);
  context.restore();

  context.fillStyle = ink;
  context.font = `600 52px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "5px" : "1px";
  const titleLines = wrapLine(context, content.chapterTitle, 610);
  drawLines(context, titleLines, contentX, 318, 72);

  context.fillStyle = "rgba(173, 126, 47, 0.16)";
  context.font = `400 178px ${serif}`;
  context.fillText(content.language === "zh" ? "「" : "“", 118, 550);

  context.fillStyle = gold;
  context.fillRect(140, primaryTop - 9, 3, Math.min(124, primaryHeight + 12));
  if (primaryPinyinLayout) {
    drawPinyinVerse(
      context,
      primaryPinyinLayout,
      contentX,
      primaryTop,
      primarySize,
      primaryPinyinSize,
      serif,
      sans,
      ink,
      softInk,
      gold,
    );
  } else {
    context.fillStyle = ink;
    context.font = `400 ${primarySize}px ${serif}`;
    context.letterSpacing = content.language === "zh" ? "3px" : "1px";
    drawLines(context, primaryLines, contentX, primaryTop + primarySize, primaryLineHeight);
  }

  context.fillStyle = "rgba(238, 227, 209, 0.68)";
  context.strokeStyle = "rgba(173, 126, 47, 0.3)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.roundRect(140, secondaryY, 820, secondaryHeight, 18);
  context.fill();
  context.stroke();

  context.fillStyle = gold;
  context.fillRect(140, secondaryY, 86, 4);
  context.font = `500 19px ${sans}`;
  context.letterSpacing = "2px";
  context.fillText("02", 176, secondaryY + 70);

  context.fillStyle = gold;
  context.font = `500 24px ${sans}`;
  context.letterSpacing = "2px";
  context.fillText(content.secondaryLabel, 244, secondaryY + 70);

  if (secondaryPinyinLayout) {
    drawPinyinVerse(
      context,
      secondaryPinyinLayout,
      244,
      secondaryY + 124,
      secondarySize,
      secondaryPinyinSize,
      serif,
      sans,
      ink,
      softInk,
      gold,
    );
  } else {
    context.fillStyle = softInk;
    context.font = `400 ${secondarySize}px ${serif}`;
    context.letterSpacing = content.language === "zh" ? "2px" : "0.5px";
    drawLines(context, secondaryLines, 244, secondaryY + 144, secondaryLineHeight);
  }

  context.strokeStyle = "rgba(173, 126, 47, 0.4)";
  context.beginPath();
  context.moveTo(railX, footerY);
  context.lineTo(canvas.width - 84, footerY);
  context.stroke();

  context.fillStyle = ink;
  context.font = `600 54px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "6px" : "4px";
  context.fillText(content.language === "zh" ? "三慢问道" : "WENDAO", 140, footerY + 104);
  context.fillStyle = softInk;
  context.font = `400 24px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.4px";
  context.fillText(
    content.language === "zh" ? "读一章《道德经》，照见此刻的自己。" : "Read one chapter. Meet yourself anew.",
    140,
    footerY + 164,
  );
  context.fillStyle = gold;
  context.font = `400 20px ${sans}`;
  context.letterSpacing = "1px";
  context.fillText("wendao.wonderelian.com", 140, footerY + 222);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, content.url, {
    width: 180,
    margin: 1,
    color: { dark: ink, light: paper },
    errorCorrectionLevel: "M",
  });
  context.fillStyle = "rgba(247, 241, 230, 0.84)";
  context.strokeStyle = "rgba(173, 126, 47, 0.32)";
  context.beginPath();
  context.roundRect(772, footerY + 34, 220, 220, 16);
  context.fill();
  context.stroke();
  context.drawImage(qrCanvas, 792, footerY + 54, 180, 180);

  context.fillStyle = gold;
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height - 84, 4, 0, Math.PI * 2);
  context.fill();

  return canvas.toDataURL("image/png");
}
