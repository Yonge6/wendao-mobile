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

function sentenceExcerpt(text: string, limit: number) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  const sentences = cleaned.match(/[^。！？.!?；;]+[。！？.!?；;]?/g) ?? [cleaned];
  let result = "";
  for (const sentence of sentences) {
    if (result && result.length + sentence.length > limit) break;
    result += sentence;
    if (result.length >= limit * 0.62) break;
  }
  return result || sentences[0];
}

function openingVerse(chapter: Chapter, language: ShareLanguage) {
  const lines = language === "zh" ? chapter.zh.reconstructedVerse : chapter.en.verse;
  const chosen: string[] = [];
  for (const line of lines) {
    if (chosen.length >= 2 || (chosen.length > 0 && chosen.join("").length + line.length > 82)) break;
    chosen.push(line);
  }
  return chosen.join("\n");
}

function openingTranslation(chapter: Chapter, language: ShareLanguage) {
  if (language === "zh") return chapter.zh.lineByLineTranslation.slice(0, 2).join("");
  return sentenceExcerpt(chapter.en.explanation[0]?.body ?? chapter.en.variant, 180);
}

function meaningItem(chapter: Chapter, language: ShareLanguage) {
  const copy = chapter[language];
  return copy.explanation[1] ?? copy.explanation[0];
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
  primaryOverride?: string,
): ShareCardContent {
  const copy = chapter[language];
  const label = shareKindLabel(kind, language);
  const chapterLabel = language === "zh" ? `《道德经》今本第 ${chapter.id} 章` : `Daodejing · Received Chapter ${chapter.id}`;
  const url = shareChapterUrl(chapter.id, kind, language);
  let primary = "";
  let secondaryLabel = "";
  let secondary = "";

  if (kind === "verse") {
    primary = openingVerse(chapter, language);
    secondaryLabel = language === "zh" ? "今译" : "A plain reading";
    secondary = openingTranslation(chapter, language);
  } else if (kind === "meaning") {
    const item = meaningItem(chapter, language);
    primary = sentenceExcerpt(item.body, language === "zh" ? 150 : 240);
    secondaryLabel = language === "zh" ? "从原文读起" : "Rooted in the text";
    secondary = openingVerse(chapter, language);
  } else if (kind === "inspiration") {
    const item = inspirationItem(chapter, language);
    primary = sentenceExcerpt(item.body, language === "zh" ? 170 : 260);
    secondaryLabel = language === "zh" ? "今日一练" : "A practice for today";
    secondary = sentenceExcerpt(copy.action, language === "zh" ? 110 : 190);
  } else {
    primary = manualText || (language === "zh"
      ? "完成你的人生说明书后，这里会出现结合本章与真实结果的个性化阅读。"
      : "Complete your life manual to create a personal reading rooted in this chapter.");
    secondaryLabel = language === "zh" ? "分享说明" : "Privacy note";
    secondary = language === "zh"
      ? "已隐藏姓名与出生资料；这是一面自我观察的镜子，不是替你做决定的结论。"
      : "Name and birth details are hidden. This is a lens for reflection, never a verdict.";
  }

  if (primaryOverride?.trim()) {
    primary = sentenceExcerpt(primaryOverride, language === "zh" ? 190 : 290);
    if (kind === "verse") {
      secondaryLabel = language === "zh" ? "读到这里" : "Read in context";
      if (language === "zh") {
        const normalizedSelection = primaryOverride.replace(/[〔〕\s]/g, "");
        const lineIndex = chapter.zh.reconstructedVerse.findIndex((line) => {
          const normalizedLine = line.replace(/[〔〕\s]/g, "");
          return normalizedSelection.includes(normalizedLine) || normalizedLine.includes(normalizedSelection);
        });
        secondary = lineIndex >= 0
          ? chapter.zh.lineByLineTranslation[lineIndex]
          : sentenceExcerpt(chapter.zh.explanation[0].body, 120);
      } else {
        secondary = sentenceExcerpt(chapter.en.explanation[0]?.body ?? chapter.en.variant, 190);
      }
    }
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
  canvas.height = 2340;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");

  context.fillStyle = "#f7f1e6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const wash = context.createRadialGradient(820, 520, 20, 820, 520, 780);
  wash.addColorStop(0, "rgba(181, 157, 112, 0.16)");
  wash.addColorStop(1, "rgba(247, 241, 230, 0)");
  context.fillStyle = wash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = await loadPaperTexture();
  if (texture) {
    context.save();
    context.globalAlpha = 0.34;
    const scale = Math.max(canvas.width / texture.width, canvas.height / texture.height);
    const width = texture.width * scale;
    const height = texture.height * scale;
    context.drawImage(texture, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    context.restore();
  }

  const serif = content.language === "zh" ? '"Noto Serif SC", serif' : 'Georgia, "Times New Roman", serif';
  const sans = content.language === "zh" ? '"Noto Sans SC", sans-serif' : 'Arial, sans-serif';
  const ink = "#123f47";
  const softInk = "#48666a";
  const gold = "#ad7e2f";
  const margin = 104;
  const contentWidth = canvas.width - margin * 2;

  context.fillStyle = gold;
  context.font = `500 27px ${sans}`;
  context.letterSpacing = "2px";
  context.fillText(`${content.label}  ·  ${content.chapterLabel}`, margin, 145);

  context.strokeStyle = "rgba(173, 126, 47, 0.5)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(margin, 190);
  context.lineTo(canvas.width - margin, 190);
  context.stroke();

  context.fillStyle = ink;
  context.font = `600 50px ${serif}`;
  context.letterSpacing = "3px";
  const titleLines = wrapLine(context, content.chapterTitle, contentWidth);
  let cursorY = drawLines(context, titleLines, margin, 305, 74) + 85;

  context.fillStyle = gold;
  context.fillRect(margin, cursorY - 44, 3, 84);

  const primarySizes = content.primary.length > 190 ? [46, 42, 38] : content.primary.length > 105 ? [52, 46, 42] : [62, 56, 50];
  let primaryLines: string[] = [];
  let primarySize = primarySizes[0];
  for (const size of primarySizes) {
    context.font = `400 ${size}px ${serif}`;
    context.letterSpacing = content.language === "zh" ? "3px" : "1px";
    const lines = wrapParagraphs(context, content.primary, contentWidth - 42);
    primaryLines = lines;
    primarySize = size;
    if (lines.length <= 11) break;
  }

  context.fillStyle = ink;
  context.font = `400 ${primarySize}px ${serif}`;
  cursorY = drawLines(context, primaryLines, margin + 30, cursorY, Math.round(primarySize * 1.72));

  const secondaryY = Math.max(cursorY + 92, 1370);
  context.fillStyle = "rgba(238, 227, 209, 0.72)";
  context.strokeStyle = "rgba(173, 126, 47, 0.34)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(margin, secondaryY, contentWidth, 410, 24);
  context.fill();
  context.stroke();

  context.fillStyle = gold;
  context.font = `500 25px ${sans}`;
  context.letterSpacing = "2px";
  context.fillText(content.secondaryLabel, margin + 42, secondaryY + 64);

  context.fillStyle = softInk;
  context.font = `400 34px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.5px";
  const secondaryLines = wrapParagraphs(context, content.secondary, contentWidth - 84);
  drawLines(context, secondaryLines, margin + 42, secondaryY + 132, 58);

  const footerY = 1960;
  context.strokeStyle = "rgba(173, 126, 47, 0.48)";
  context.beginPath();
  context.moveTo(margin, footerY);
  context.lineTo(canvas.width - margin, footerY);
  context.stroke();

  context.fillStyle = ink;
  context.font = `600 52px ${serif}`;
  context.letterSpacing = "5px";
  context.fillText(content.language === "zh" ? "三慢问道" : "WENDAO", margin, footerY + 105);
  context.fillStyle = softInk;
  context.font = `400 25px ${serif}`;
  context.letterSpacing = content.language === "zh" ? "2px" : "0.4px";
  context.fillText(
    content.language === "zh" ? "读一章《道德经》，照见此刻的自己。" : "Read one chapter. Meet yourself anew.",
    margin,
    footerY + 165,
  );
  context.fillStyle = gold;
  context.font = `400 21px ${sans}`;
  context.letterSpacing = "1px";
  context.fillText("wendao.wonderelian.com", margin, footerY + 224);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, content.url, {
    width: 190,
    margin: 1,
    color: { dark: ink, light: "#f7f1e6" },
    errorCorrectionLevel: "M",
  });
  context.drawImage(qrCanvas, canvas.width - margin - 190, footerY + 54, 190, 190);

  return canvas.toDataURL("image/png");
}
