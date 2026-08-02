import QRCode from "qrcode";
import type { Chapter } from "./data/chapters";
import { CANONICAL_URL } from "./native";

export type ShareCardKind = "verse" | "meaning" | "inspiration" | "manual";
export type ShareLanguage = "zh" | "en";

export type ShareCardContent = {
  kind: ShareCardKind;
  language: ShareLanguage;
  chapterId: number;
  label: string;
  chapterLabel: string;
  chapterTitle: string;
  primary: string;
  secondaryLabel: string;
  secondary: string;
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
  let secondaryLabel = "";
  let secondary = "";

  if (kind === "verse") {
    primary = fullVerse(chapter, language);
    secondaryLabel = language === "zh" ? "今译" : "A plain reading";
    secondary = fullTranslation(chapter, language);
  } else if (kind === "meaning") {
    primary = fullMeaning(chapter, language);
    secondaryLabel = language === "zh" ? "原文" : "Original text";
    secondary = fullVerse(chapter, language);
  } else if (kind === "inspiration") {
    const item = inspirationItem(chapter, language);
    primary = item.body;
    secondaryLabel = language === "zh" ? "原文" : "Original text";
    secondary = fullVerse(chapter, language);
  } else {
    primary = manualText || (language === "zh"
      ? "完成你的人生说明书后，这里会出现结合本章与真实结果的个性化阅读。"
      : "Complete your life manual to create a personal reading rooted in this chapter.");
    const item = inspirationItem(chapter, language);
    secondaryLabel = language === "zh" ? "对我们的启发" : "What this teaches us";
    secondary = item.body;
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
    secondaryLabel,
    secondary,
    url,
    shareText,
    filename: `wendao-chapter-${String(chapter.id).padStart(2, "0")}-${kind}.png`,
  };
}

function wrapLine(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const isSpaced = /\s/.test(text);
  const tokens = isSpaced ? text.split(/(\s+)/).filter(Boolean) : Array.from(text);
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
  return text.split("\n").flatMap((paragraph, index, paragraphs) => {
    const lines = wrapLine(context, paragraph, maxWidth);
    return index < paragraphs.length - 1 ? [...lines, ""] : lines;
  });
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
  const primaryTop = 490;
  const primaryHeight = Math.max(primaryLineHeight, primaryLines.length * primaryLineHeight);
  const secondarySize = content.language === "zh"
    ? (content.secondary.length > 260 ? 28 : 31)
    : (content.secondary.length > 420 ? 25 : 28);
  const secondaryLineHeight = Math.round(secondarySize * 1.72);
  context.font = `400 ${secondarySize}px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.5px";
  const secondaryLines = wrapParagraphs(context, content.secondary, 666);
  const secondaryY = Math.max(1370, primaryTop + primaryHeight + 104);
  const secondaryHeight = Math.max(396, 154 + secondaryLines.length * secondaryLineHeight + 58);
  const naturalFooterY = secondaryY + secondaryHeight + 112;
  canvas.height = Math.max(2340, naturalFooterY + 340);
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

  const primaryY = primaryTop + primarySize;

  context.fillStyle = gold;
  context.fillRect(140, primaryY - primarySize - 9, 3, Math.min(124, primaryHeight + 12));
  context.fillStyle = ink;
  context.font = `400 ${primarySize}px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "3px" : "1px";
  drawLines(context, primaryLines, contentX, primaryY, primaryLineHeight);

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

  context.fillStyle = softInk;
  context.font = `400 ${secondarySize}px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.5px";
  drawLines(context, secondaryLines, 244, secondaryY + 144, secondaryLineHeight);

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
