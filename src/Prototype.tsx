import {
  FormEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tzLookup from "tz-lookup";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightIcon,
  ChatBubbleIcon,
  CheckIcon,
  ChevronRightIcon,
  HamburgerMenuIcon,
  InfoCircledIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PersonIcon,
  Share1Icon,
  SunIcon,
} from "@radix-ui/react-icons";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/600.css";
import {
  detailedReading,
  foundationalReading,
  type HumanDesignReadingChart,
} from "./humanDesignReading";
import { chapters, type ChapterCopyBase, type RelatedItem } from "./data/chapters";
import ShareCardPanel from "./ShareCardPanel";
import type { ShareCardKind } from "./shareCard";
import { initializeNativeShell, nativeImpact, runtimeSurface, syncNativeTheme } from "./native";

type Language = "zh" | "en";
type Theme = "light" | "dark";
type ReadingSize = "small" | "medium" | "large";
type DrawerView = "home" | "profile" | "profile-detail" | "about" | "feedback";
type ChapterEntrySource = "daily" | "directory" | "chance" | "link";

type ReadingSelectionPrompt = {
  text: string;
  kind: ShareCardKind;
  chapterId: number;
  x: number;
  y: number;
};

type LifeProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: string;
};

type ChartSnapshot = HumanDesignReadingChart & {
  schemaVersion: string;
  chartHash: string;
  verificationStatus: string;
  structure: {
    definedCenters: string[];
    channels: number[][];
    variables: Record<string, string>;
  };
};

type SaveState = "idle" | "saving" | "saved" | "error";
type AdminTab = "overview" | "profiles" | "conversations" | "feedback" | "events";

type AdminOverview = {
  summary: { profiles: number; feedback: number; conversations: number; events: number };
  profiles: Array<Record<string, unknown>>;
  feedback: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
  eventBreakdown: Record<string, number>;
};

const API_BASE = "https://pluto-human-design-api.vercel.app";
const PROFILE_STORAGE_KEY = "wendao-life-profile";
const CHART_STORAGE_KEY = "wendao-chart-snapshot";
const THEME_STORAGE_KEY = "wendao-theme";
const READING_SIZE_STORAGE_KEY = "wendao-reading-size-v2";
const CLIENT_ID_KEY = "wendao-client-id";
const ADMIN_TOKEN_KEY = "wendao-admin-token";
const APP_VERSION = "2026.08.02";
const emptyProfile: LifeProfile = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  timezone: "",
};

function loadProfile(): LifeProfile {
  if (typeof window === "undefined") return emptyProfile;

  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? { ...emptyProfile, ...JSON.parse(stored) } : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

function loadChart(): ChartSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(CHART_STORAGE_KEY);
    return stored ? JSON.parse(stored) as ChartSnapshot : null;
  } catch {
    return null;
  }
}

function loadReadingSize(): ReadingSize {
  if (typeof window === "undefined") return "small";
  const stored = window.localStorage.getItem(READING_SIZE_STORAGE_KEY);
  return stored === "medium" || stored === "large" ? stored : "small";
}

function stableId(storageKey: string) {
  if (typeof window === "undefined") return "00000000-0000-4000-8000-000000000000";
  const stored = window.localStorage.getItem(storageKey);
  if (stored) return stored;
  const id = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, id);
  return id;
}

async function apiRequest<T>(path: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const inheritedSignal = init.signal;
  const abortFromCaller = () => controller.abort();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  if (inheritedSignal?.aborted) controller.abort();
  inheritedSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const payload = await response.json() as { data: T | null; error?: { message?: string } | null };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message || "服务暂时不可用，请稍后再试。");
    }
    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("REQUEST_TIMEOUT");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    inheritedSignal?.removeEventListener("abort", abortFromCaller);
  }
}

const MAINLAND_MARKERS = [
  "中国", "中华人民共和国",
  "北京", "天津", "上海", "重庆",
  "河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南",
  "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "内蒙古", "广西", "西藏", "宁夏", "新疆",
];

const COUNTRY_CODES: Record<string, string> = {
  CHN: "CN",
  HKG: "HK",
  MAC: "MO",
  TWN: "TW",
};

type PlaceFeature = {
  properties?: { countrycode?: string };
  geometry?: { coordinates?: number[] };
};

function compactAddress(value: string) {
  return value.trim().replace(/[\s,，、/]+/g, "");
}

function inferTimezoneFromAddress(value: string) {
  const address = compactAddress(value);
  if (!address) return null;
  if (/香港|Hong\s*Kong/i.test(value)) return "Asia/Hong_Kong";
  if (/澳门|澳門|Macao|Macau/i.test(value)) return "Asia/Macau";
  if (/台湾|臺灣|Taiwan/i.test(value)) return "Asia/Taipei";
  if (MAINLAND_MARKERS.some((marker) => address.includes(marker))) return "Asia/Shanghai";
  return null;
}

function preparePhotonQuery(query: string) {
  const spaced = query.trim().replace(/([省市区县州旗])(?=[\u3400-\u9fff])/g, "$1 ");
  const timezone = inferTimezoneFromAddress(query);
  return timezone === "Asia/Shanghai" && !/中国|中华人民共和国/.test(query)
    ? `${spaced} 中国`
    : spaced;
}

function arcgisCandidatesToFeatures(data: {
  candidates?: Array<{
    attributes?: { Country?: string };
    location?: { x?: number; y?: number };
  }>;
}) {
  return (data.candidates ?? []).map((candidate) => ({
    properties: {
      countrycode: COUNTRY_CODES[candidate.attributes?.Country ?? ""] ?? candidate.attributes?.Country ?? "",
    },
    geometry: {
      coordinates: [candidate.location?.x, candidate.location?.y].filter((value): value is number => Number.isFinite(value)),
    },
  })).filter((feature) => feature.geometry.coordinates.length === 2);
}

function timezoneFromFeature(feature: PlaceFeature) {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  const countryCode = feature.properties?.countrycode?.toUpperCase();
  if (countryCode === "CN") return "Asia/Shanghai";
  if (countryCode === "HK") return "Asia/Hong_Kong";
  if (countryCode === "MO") return "Asia/Macau";
  if (countryCode === "TW") return "Asia/Taipei";

  try {
    return tzLookup(latitude, longitude);
  } catch {
    return null;
  }
}

async function fetchPhotonPlaces(query: string, signal: AbortSignal) {
  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({ q: preparePhotonQuery(query), limit: "7" }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Photon unavailable");
  const data = await response.json() as { features?: PlaceFeature[] };
  return data.features ?? [];
}

async function fetchArcgisPlaces(query: string, signal: AbortSignal) {
  const url = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
  url.search = new URLSearchParams({
    SingleLine: query,
    maxLocations: "7",
    outFields: "Country",
    forStorage: "false",
    f: "json",
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("ArcGIS unavailable");
  return arcgisCandidatesToFeatures(await response.json());
}

async function resolveBirthplaceTimezone(query: string) {
  const inferred = inferTimezoneFromAddress(query);
  if (inferred) return inferred;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    for (const search of [fetchPhotonPlaces, fetchArcgisPlaces]) {
      try {
        const features = await search(query, controller.signal);
        for (const feature of features) {
          const timezone = timezoneFromFeature(feature);
          if (timezone) return timezone;
        }
      } catch (error) {
        if (controller.signal.aborted) throw error;
      }
    }
  } finally {
    window.clearTimeout(timeout);
  }
  throw new Error("BIRTHPLACE_NOT_FOUND");
}

const humanDesignLabels: Record<string, { zh: string; en: string }> = {
  Generator: { zh: "生产者", en: "Generator" },
  "Manifesting Generator": { zh: "显示生产者", en: "Manifesting Generator" },
  Projector: { zh: "投射者", en: "Projector" },
  Manifestor: { zh: "显示者", en: "Manifestor" },
  Reflector: { zh: "反映者", en: "Reflector" },
  "To Respond": { zh: "等待回应", en: "Wait to respond" },
  "Wait for the Invitation": { zh: "等待邀请", en: "Wait for the invitation" },
  "To Inform": { zh: "告知后行动", en: "Inform before acting" },
  "Wait a Lunar Cycle": { zh: "等待月亮周期", en: "Wait a lunar cycle" },
  "Emotional - Solar Plexus": { zh: "情绪权威", en: "Emotional authority" },
  Sacral: { zh: "荐骨权威", en: "Sacral authority" },
  Splenic: { zh: "脾脏权威", en: "Splenic authority" },
  "Ego - Manifested": { zh: "意志力权威", en: "Ego authority" },
  "Ego - Projected": { zh: "意志力权威", en: "Ego authority" },
  "Self-Projected": { zh: "自我投射权威", en: "Self-projected authority" },
  "Mental - Environmental": { zh: "环境权威", en: "Environmental authority" },
  Lunar: { zh: "月亮权威", en: "Lunar authority" },
  "Single Definition": { zh: "一分人", en: "Single definition" },
  "Split Definition": { zh: "二分人", en: "Split definition" },
  "Triple Split Definition": { zh: "三分人", en: "Triple-split definition" },
  "Quadruple Split Definition": { zh: "四分人", en: "Quadruple-split definition" },
  "No Definition": { zh: "无定义", en: "No definition" },
};

function hdLabel(value: string, language: Language) {
  return humanDesignLabels[value]?.[language] ?? value;
}

function isLifeManualItem(item: RelatedItem) {
  return item.title === "你的人生说明书" || item.title === "Your life manual";
}

function personalizedAdvice(chapterId: number, chapter: ChapterCopyBase, chart: ChartSnapshot, language: Language) {
  const type = hdLabel(chart.core.type, language);
  const strategy = hdLabel(chart.core.strategy, language);
  const authority = hdLabel(chart.core.authority, language);
  if (language === "en") {
    if (chapterId === 8) {
      return `For you as a ${type}, “Be like water” begins with ${strategy}: let the situation arrive before spending your energy. Use ${authority} to sense which opening has a natural current. Flexibility here is not retreat; it is changing form without abandoning your direction.`;
    }
    if (chapterId === 9) {
      return `Your ${type} energy is valuable precisely because it is not meant to prove itself without end. In this chapter, ${strategy} helps you notice when the essential work is complete, while ${authority} helps distinguish a true next step from pressure to add more. Define an “enough line,” then allow yourself to stop.`;
    }
    if (chapterId === 1) {
      return `Labels such as ${type} and ${authority} can help you observe yourself, but they are not your final name. Practice ${strategy} as an experiment rather than an identity: describe what your body is showing now, and leave room for tomorrow to reveal something different.`;
    }
    return `For you as a ${type}, “${chapter.title}” becomes a distinct experiment: use ${strategy} to notice where this chapter's movement is already present, then let ${authority} clarify whether your next step belongs to its theme. Try the chapter's practice—“${chapter.action}”—and judge the insight by what actually changes, not by the label alone.`;
  }
  if (chapterId === 8) {
    return `对${type}的你来说，“如水”可以先从“${strategy}”开始：让局面来到面前，再把力量给真正有回应的方向。结合${authority}辨认哪一道缝隙有自然的流动。这里的柔软不是退让，而是改变形态，却不背离自己的方向。`;
  }
  if (chapterId === 9) {
    return `${type}的生命力之所以珍贵，正因为它不必被用来无止境地证明自己。这一章里，“${strategy}”帮助你看见事情何时已经完成，${authority}则帮助你分辨：下一步来自真实需要，还是来自“还不够好”的压力。为一件事划出“足够线”，到达便停。`;
  }
  if (chapterId === 1) {
    return `${type}、${authority}这些名字可以帮助你观察自己，却不是你的最终定义。把“${strategy}”当作一种生活实验，而不是新的身份标签：描述此刻身体正在呈现什么，也给明天的自己留下变化的空间。`;
  }
  return `对${type}的你，《${chapter.title}》是一项只属于本章主题的生活实验：先用“${strategy}”观察这股变化已经在哪里发生，再让${authority}澄清下一步是否真的与本章相应。试做“${chapter.action}”，用实际变化而不是身份标签检验它。`;
}

function questionResponse(question: string, chapter: ChapterCopyBase, chart: ChartSnapshot, language: Language) {
  const type = hdLabel(chart.core.type, language);
  const strategy = hdLabel(chart.core.strategy, language);
  const authority = hdLabel(chart.core.authority, language);
  if (language === "en") {
    return `In “${chapter.title}”, the useful move is not to force an immediate answer to “${question}”. As a ${type}, your experiment is ${strategy}; with ${authority}, give the decision enough space to become clear. Notice which option lets the situation move without asking you to abandon yourself.`;
  }
  return `面对“${question}”，《${chapter.title}》给你的不是一个替你决定的答案。作为${type}，你可以先实践“${strategy}”；结合${authority}，给重要决定留出澄清的空间。观察哪一个选择既让事情重新流动，也不要求你背离真实的自己。`;
}

function chapterSearchText(chapter: (typeof chapters)[number]) {
  return [
    chapter.id,
    `第${chapter.id}章`,
    chapter.silkOrder,
    chapter.theme.zh,
    chapter.theme.en,
    chapter.sources.silkBTranscription,
    chapter.sources.receivedReference,
    chapter.sources.reconstructionNotes,
    chapter.zh.title,
    ...chapter.zh.reconstructedVerse,
    ...chapter.zh.lineByLineTranslation,
    ...chapter.zh.explanation.flatMap((item) => [item.title, item.body]),
    ...chapter.zh.related.flatMap((item) => [item.title, item.body]),
    chapter.zh.action,
    chapter.en.title,
    ...chapter.en.verse,
    ...chapter.en.explanation.flatMap((item) => [item.title, item.body]),
    ...chapter.en.related.flatMap((item) => [item.title, item.body]),
    chapter.en.action,
  ].join(" ").toLocaleLowerCase().replace(/\s+/g, "");
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isAdminLocation() {
  if (typeof window === "undefined") return false;
  return /\/admin\/?$/.test(window.location.pathname) || window.location.hash === "#data-admin";
}

function publicPath() {
  const path = window.location.pathname.replace(/admin\/?$/, "");
  return path || "/";
}

type InitialReadingRequest = {
  chapterId: number | null;
  language: Language;
  section: ShareCardKind | null;
};

function initialReadingRequest(): InitialReadingRequest {
  if (typeof window === "undefined") return { chapterId: null, language: "zh", section: null };
  const params = new URLSearchParams(window.location.search);
  const parsedChapter = Number(params.get("chapter"));
  const chapterId = Number.isInteger(parsedChapter) && chapters.some((chapter) => chapter.id === parsedChapter)
    ? parsedChapter
    : null;
  const language = params.get("lang") === "en" ? "en" : "zh";
  const requestedSection = params.get("section");
  const section = requestedSection === "verse"
    || requestedSection === "meaning"
    || requestedSection === "inspiration"
    || requestedSection === "manual"
    ? requestedSection
    : null;
  return { chapterId, language, section };
}

function validatePinyinReadings() {
  for (const chapter of chapters) {
    const { reconstructedVerse, pinyin } = chapter.zh;
    if (!pinyin || reconstructedVerse.length !== pinyin.length) {
      throw new Error(`Chapter ${chapter.id}: verse and Pinyin line counts do not match.`);
    }

    reconstructedVerse.forEach((line, lineIndex) => {
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

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dailyChapterId(dateKey = localDateKey()) {
  let hash = 0;
  for (const character of dateKey) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return chapters[hash % chapters.length].id;
}

function scrollReadingToTop(behavior: ScrollBehavior = "smooth") {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>("[data-testid='mobile-scroll']")?.scrollTo({
      top: 0,
      behavior,
    });
  });
}

function renderPinyinLine(text: string, pinyin: string[]) {
  let syllableIndex = 0;
  let inSupply = false;
  let supplyStartsHere = false;
  const characters = Array.from(text);
  const tokens: ReactNode[] = [];

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
    if (/\p{Script=Han}/u.test(character)) {
      const syllable = pinyin[syllableIndex] ?? "";
      syllableIndex += 1;
      const isSupplyStart = inSupply && supplyStartsHere;
      supplyStartsHere = false;
      const isSupplyEnd = inSupply && characters[characterIndex + 1] === "〕";
      if (isSupplyEnd) {
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
      tokens.push(
        <span
          className={`verse-token ${punctuation ? "has-punctuation" : ""} ${isSupplyStart || isSupplyEnd || inSupply ? "is-supplied" : ""}`}
          key={`${character}-${characterIndex}`}
        >
          {isSupplyStart ? <span className="verse-supply-bracket">〔</span> : null}
          <ruby>
            {character}
            <rt>{syllable}</rt>
          </ruby>
          {isSupplyEnd ? <span className="verse-supply-bracket">〕</span> : null}
          {punctuation ? <span className="verse-punctuation">{punctuation}</span> : null}
        </span>,
      );
      continue;
    }

    tokens.push(<span className="verse-punctuation" key={`${character}-${characterIndex}`}>{character}</span>);
  }

  return tokens;
}

function copyVerseWithoutPinyin(event: ReactClipboardEvent<HTMLDivElement>) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (!event.currentTarget.contains(range.commonAncestorContainer)) return;

  const fragment = range.cloneContents();
  fragment.querySelectorAll?.("rt").forEach((node) => node.remove());
  const holder = document.createElement("div");
  holder.append(fragment);
  const selectedLines = Array.from(holder.querySelectorAll<HTMLElement>(".verse-line"));
  const plainText = (selectedLines.length
    ? selectedLines.map((line) => line.textContent ?? "").join("\n")
    : holder.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!plainText) return;
  event.clipboardData.setData("text/plain", plainText);
  event.preventDefault();
}

function currentReadingSelection(): ReadingSelectionPrompt | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const commonNode = range.commonAncestorContainer;
  const element = commonNode instanceof Element ? commonNode : commonNode.parentElement;
  const chapter = element?.closest<HTMLElement>("article.chapter");
  const section = element?.closest<HTMLElement>("[data-share-section]");
  const sectionKind = section?.dataset.shareSection;
  const chapterId = Number(chapter?.dataset.chapterId);
  if (!chapter || !section || !Number.isInteger(chapterId)) return null;
  if (sectionKind !== "verse" && sectionKind !== "meaning" && sectionKind !== "inspiration" && sectionKind !== "manual") return null;

  const fragment = range.cloneContents();
  fragment.querySelectorAll?.("rt").forEach((node) => node.remove());
  const holder = document.createElement("div");
  holder.append(fragment);
  const text = (holder.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;

  const rect = range.getBoundingClientRect();
  return {
    text: text.slice(0, 600),
    kind: sectionKind,
    chapterId,
    x: Math.min(window.innerWidth - 58, Math.max(58, rect.left + rect.width / 2)),
    y: Math.min(window.innerHeight - 70, Math.max(92, rect.top - 8)),
  };
}

type WebSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "share";
};

function WebSheet({ open, onOpenChange, title, description, children, variant = "default" }: WebSheetProps) {
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
      <section className={`bottom-sheet web-sheet ${variant === "share" ? "is-share-sheet" : ""}`} role="dialog" aria-modal="true" aria-labelledby="web-sheet-title">
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

type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  language: Language;
  view: DrawerView;
  onViewChange: (view: DrawerView) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  readingSize: ReadingSize;
  onReadingSizeChange: (size: ReadingSize) => void;
  profile: LifeProfile;
  profileDraft: LifeProfile;
  onProfileDraftChange: Dispatch<SetStateAction<LifeProfile>>;
  onProfileSave: (event: FormEvent) => void;
  profileState: SaveState;
  profileError: string;
  chart: ChartSnapshot | null;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  feedbackContact: string;
  onFeedbackContactChange: (contact: string) => void;
  feedbackState: SaveState;
  feedbackError: string;
  onFeedbackSubmit: (event: FormEvent) => void;
  onContactClick: (target: string) => void;
  onWorkClick: (target: string) => void;
  onVideoChannelOpen: () => void;
};

function SideDrawer({
  open,
  onClose,
  language,
  view,
  onViewChange,
  theme,
  onThemeChange,
  readingSize,
  onReadingSizeChange,
  profile,
  profileDraft,
  onProfileDraftChange,
  onProfileSave,
  profileState,
  profileError,
  chart,
  feedback,
  onFeedbackChange,
  feedbackContact,
  onFeedbackContactChange,
  feedbackState,
  feedbackError,
  onFeedbackSubmit,
  onContactClick,
  onWorkClick,
  onVideoChannelOpen,
}: SideDrawerProps) {
  const isZh = language === "zh";
  const profileComplete = Boolean(chart?.chartHash);
  const [profileEditing, setProfileEditing] = useState(false);
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    drawerScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [open, view]);

  useEffect(() => {
    if (!open || view !== "profile" || (profileState === "saved" && profileComplete)) {
      setProfileEditing(false);
    }
  }, [open, profileComplete, profileState, view]);

  if (!open) return null;

  const headerTitle = view === "home"
    ? (isZh ? "你的空间" : "Your space")
    : view === "profile"
      ? (isZh ? "人生说明书" : "Life manual")
      : view === "profile-detail"
        ? (isZh ? "详细解读" : "Detailed reading")
      : view === "about"
        ? (isZh ? "关于三慢问道" : "About Wendao")
        : (isZh ? "留下回响" : "Leave a note");

  const works = [
    {
      id: "xiazi",
      href: "https://xiazishuo.com/",
      name: isZh ? "虾子曰" : "Xiazi Says",
      tagline: isZh ? "昨日世界" : "Yesterday’s World",
      description: isZh
        ? "每天用 9 个全球热点与 18 张双语海报，把昨天的复杂世界讲清楚。"
        : "Nine global stories and eighteen bilingual posters make yesterday’s complex world easier to see.",
    },
    {
      id: "human-design",
      href: "https://human-design.wonderelian.com/",
      name: isZh ? "人类图" : "Human Design",
      tagline: isZh ? "人生使用说明书" : "A manual for your life",
      description: isZh
        ? "从出生信息生成中英双语人类图与基础解读，换一个角度认识自己的运行方式。"
        : "Turn birth details into a bilingual chart and foundational reading—a different lens on how you move through life.",
    },
    {
      id: "style-atlas",
      href: "https://style-atlas.wonderelian.com/",
      name: isZh ? "艺术风格图鉴" : "Style Atlas",
      tagline: isZh ? "学习看懂一种美" : "Learn to see a style",
      description: isZh
        ? "沿着艺术与设计风格的脉络，看懂一种美，也找到自己的观看方式。"
        : "Follow the lineages of art and design, learn to see a style, and discover your own way of looking.",
    },
  ];

  const contacts = [
    { label: isZh ? "邮箱" : "Email", value: "hustyy986@gmail.com", href: "mailto:hustyy986@gmail.com" },
    { label: isZh ? "微博" : "Weibo", value: "@1228222295", href: "https://weibo.com/u/1228222295" },
    { label: isZh ? "小红书" : "RED", value: isZh ? "打开主页" : "Open profile", href: "https://xhslink.cn/m/3OF5qu7Peui" },
    { label: isZh ? "抖音" : "Douyin", value: isZh ? "打开主页" : "Open profile", href: "https://v.douyin.com/d9L1thkye0Y/" },
    { label: "X", value: "@yongyuan1", href: "https://x.com/yongyuan1?s=11" },
    { label: "TikTok", value: "@wonderelian", href: "https://www.tiktok.com/@wonderelian?_r=1&_t=ZP-98Tvaldfrpe" },
    { label: "Facebook", value: isZh ? "打开主页" : "Open profile", href: "https://www.facebook.com/share/1Gga69WThA/?mibextid=wwXIfr" },
  ];

  return (
    <div className="drawer-layer">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label={isZh ? "关闭菜单" : "Close menu"}
        onClick={onClose}
      />
      <aside className="side-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer-header">
          {view !== "home" ? (
            <button
              type="button"
              className="drawer-icon-button"
              aria-label={isZh ? "返回" : "Back"}
              onClick={() => onViewChange(view === "profile-detail" ? "profile" : "home")}
            >
              <ArrowLeftIcon />
            </button>
          ) : <span className="drawer-orbit" aria-hidden="true" />}
          <div>
            <span className="drawer-brand">三慢问道 · WENDAO</span>
            <h2 id="drawer-title">{headerTitle}</h2>
          </div>
          <button
            type="button"
            className="drawer-close"
            aria-label={isZh ? "关闭菜单" : "Close menu"}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="drawer-scroll" ref={drawerScrollRef}>
          {view === "home" ? (
            <>
              <section className="life-manual-card">
                <span className="drawer-kicker">{isZh ? "你的人生说明书" : "Your life manual"}</span>
                <h3>
                  {profileComplete
                    ? (isZh ? `${profile.name || "你"}，说明书已生成` : `${profile.name || "Your"} manual is ready`)
                    : (isZh ? "从认识自己开始" : "Begin by knowing yourself")}
                </h3>
                <p>
                  {profileComplete
                    ? `${hdLabel(chart!.core.type, language)} · ${chart!.core.profile} · ${hdLabel(chart!.core.authority, language)}`
                    : (isZh
                      ? "出生日期、准确时间和地点，会成为个性化阅读的基础；三慢问道不绘制人类图。"
                      : "Birth date, exact time, and place form the basis of your personal reading.")}
                </p>
                <button type="button" className="drawer-primary" onClick={() => onViewChange("profile")}>
                  <PersonIcon />
                  {profileComplete
                    ? (isZh ? "查看人生说明书" : "View life manual")
                    : (isZh ? "录入出生信息" : "Enter birth details")}
                </button>
              </section>

              <nav className="drawer-nav" aria-label={isZh ? "你的空间" : "Your space"}>
                <div className="drawer-nav-row">
                  <span className="drawer-nav-icon">{theme === "dark" ? <MoonIcon /> : <SunIcon />}</span>
                  <span>
                    <strong>{isZh ? "夜读模式" : "Night mode"}</strong>
                    <small>{isZh ? "调低光线，让眼睛和心一起慢下来" : "Soften the light and let your eyes slow down"}</small>
                  </span>
                  <button
                    type="button"
                    className={`theme-toggle ${theme === "dark" ? "is-on" : ""}`}
                    role="switch"
                    aria-checked={theme === "dark"}
                    aria-label={isZh ? "切换夜间阅读" : "Toggle night reading"}
                    onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
                  >
                    <span />
                  </button>
                </div>
                <div className="drawer-nav-row text-size-row">
                  <span className="drawer-nav-icon text-size-icon" aria-hidden="true">字</span>
                  <span>
                    <strong>{isZh ? "正文字号" : "Reading size"}</strong>
                    <small>{isZh ? "选择更舒展、更合眼的阅读尺度" : "Choose the scale that feels easiest to read"}</small>
                  </span>
                  <div className="text-size-control" role="group" aria-label={isZh ? "选择阅读字号" : "Choose text size"}>
                    {(["small", "medium", "large"] as ReadingSize[]).map((size, index) => (
                      <button
                        type="button"
                        className={readingSize === size ? "is-active" : ""}
                        aria-pressed={readingSize === size}
                        onClick={() => onReadingSizeChange(size)}
                        key={size}
                      >
                        {isZh ? ["小", "中", "大"][index] : ["S", "M", "L"][index]}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => onViewChange("about")}>
                  <span className="drawer-nav-icon"><InfoCircledIcon /></span>
                  <span>
                    <strong>{isZh ? "关于三慢问道" : "About Wendao"}</strong>
                    <small>{isZh ? "我们怎样慢读原典，也慢慢认识自己" : "Why we read the classic slowly—and ourselves with it"}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
                <button type="button" onClick={() => onViewChange("feedback")}>
                  <span className="drawer-nav-icon"><ChatBubbleIcon /></span>
                  <span>
                    <strong>{isZh ? "留下回响" : "Leave a note"}</strong>
                    <small>{isZh ? "告诉我们，哪里还能做得更好" : "Tell us what could feel better"}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
              </nav>

              <section className="drawer-works" aria-labelledby="drawer-works-title">
                <header className="drawer-works-header">
                  <span className="drawer-kicker" id="drawer-works-title">{isZh ? "沿途所作" : "Works along the way"}</span>
                  <p>{isZh ? "观世界，识自己，也学习看见美。" : "See the world, know yourself, and learn to see beauty."}</p>
                </header>
                <div className="drawer-work-list">
                  {works.map((work, index) => (
                    <a
                      className="drawer-work-card"
                      href={work.href}
                      key={work.id}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onWorkClick(work.id)}
                    >
                      <span className="drawer-work-index" aria-hidden="true">
                        {isZh ? ["一", "二", "三"][index] : `0${index + 1}`}
                      </span>
                      <span className="drawer-work-copy">
                        <span className="drawer-work-title">
                          <strong>{work.name}</strong>
                          <em>{work.tagline}</em>
                        </span>
                        <small>{work.description}</small>
                      </span>
                      <ArrowTopRightIcon aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {view === "profile" ? (
            <form className={`drawer-form ${profileComplete && !profileEditing ? "is-result-only" : ""}`} onSubmit={onProfileSave}>
              {profileComplete && !profileEditing ? (
                <section className="profile-saved-summary" aria-label={isZh ? "已保存的出生信息" : "Saved birth details"}>
                  <div>
                    <span>{isZh ? "出生资料已完成" : "Birth details complete"}</span>
                    <strong>{profile.name || (isZh ? "你" : "You")}</strong>
                    <small>{profile.birthDate} · {profile.birthTime} · {profile.birthPlace}</small>
                  </div>
                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={() => {
                      onProfileDraftChange({ ...profile });
                      setProfileEditing(true);
                    }}
                  >
                    {isZh ? "修改出生信息" : "Edit birth details"}
                  </button>
                </section>
              ) : (
                <>
                  <p className="drawer-intro">
                    {isZh
                      ? "三慢问道会根据出生地点自动识别当地时区，并在产品内完成计算；只呈现类型、策略、权威等结果，不绘制人类图。出生时间越准确，解读越可靠。"
                      : "Wendao identifies the local time zone from your birthplace and calculates your result here. It shows only the useful reading—never a BodyGraph. A precise birth time gives a more reliable result."}
                  </p>
                  <label>
                    <span>{isZh ? "姓名或称呼" : "Name"}</span>
                    <input
                      required
                      value={profileDraft.name}
                      onChange={(event) => onProfileDraftChange((current) => ({ ...current, name: event.target.value }))}
                      placeholder={isZh ? "我们该如何称呼你" : "How should we address you?"}
                    />
                  </label>
                  <div className="drawer-form-grid">
                    <label>
                      <span>{isZh ? "出生日期" : "Birth date"}</span>
                      <input
                        required
                        type="date"
                        value={profileDraft.birthDate}
                        onChange={(event) => onProfileDraftChange((current) => ({ ...current, birthDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>{isZh ? "出生时间" : "Birth time"}</span>
                      <input
                        required
                        type="time"
                        value={profileDraft.birthTime}
                        onChange={(event) => onProfileDraftChange((current) => ({ ...current, birthTime: event.target.value }))}
                      />
                    </label>
                  </div>
                  <label>
                    <span>{isZh ? "出生地点" : "Birth place"}</span>
                    <input
                      required
                      value={profileDraft.birthPlace}
                      onChange={(event) => onProfileDraftChange((current) => ({ ...current, birthPlace: event.target.value }))}
                      placeholder={isZh ? "如：武汉市 / Paris, France" : "e.g. Paris, France"}
                    />
                    <small className="field-hint">
                      {isZh
                        ? "时区会根据出生地点自动识别，请尽量填写“城市 + 国家或地区”。"
                        : "The time zone is identified automatically. Include the city and country or region where possible."}
                    </small>
                  </label>
                  <p className="privacy-note">
                    {isZh
                      ? "隐私说明：出生地点会发送至地点查询服务以识别当地时区；出生资料将安全传送至三慢问道，用于计算、保存你的人生说明书和改善产品，不会公开，也不会绘制人类图。"
                      : "Privacy: your birthplace is sent to a location service to identify its time zone. Your birth details are securely sent to Wendao to calculate and save your life manual and improve the product. They are not public, and no BodyGraph is rendered."}
                  </p>
                  <button type="submit" className="drawer-primary drawer-save" disabled={profileState === "saving"}>
                    {profileState === "saved" ? <CheckIcon /> : <PersonIcon />}
                    {profileState === "saving"
                      ? (isZh ? "正在识别并计算…" : "Locating and calculating…")
                      : profileState === "saved"
                        ? (isZh ? "说明书已更新" : "Manual updated")
                        : (isZh ? "生成我的人生说明书" : "Create my life manual")}
                  </button>
                  {profileError ? <p className="form-message is-error">{profileError}</p> : null}
                </>
              )}
              {chart ? (
                <section className="profile-result" aria-label={isZh ? "人类图解读结果" : "Human Design result"}>
                  <div className="profile-result-heading">
                    <span>{isZh ? "计算结果" : "Your result"}</span>
                    <small>{isZh ? "不出图，只呈现与你有关的信息" : "Insight without the diagram"}</small>
                  </div>
                  <dl className="profile-facts">
                    <div><dt>{isZh ? "类型" : "Type"}</dt><dd>{hdLabel(chart.core.type, language)}</dd></div>
                    <div><dt>{isZh ? "策略" : "Strategy"}</dt><dd>{hdLabel(chart.core.strategy, language)}</dd></div>
                    <div><dt>{isZh ? "权威" : "Authority"}</dt><dd>{hdLabel(chart.core.authority, language)}</dd></div>
                    <div><dt>{isZh ? "人生角色" : "Profile"}</dt><dd>{chart.core.profile}</dd></div>
                    <div><dt>{isZh ? "定义" : "Definition"}</dt><dd>{hdLabel(chart.core.definition, language)}</dd></div>
                  </dl>
                  <div className="foundational-reading">
                    <span className="reading-kicker">{isZh ? "基础解读" : "Foundational reading"}</span>
                    {foundationalReading(chart, language).map((section) => (
                      <article key={section.title}>
                        <h4>{section.title}</h4>
                        <p>{section.body}</p>
                      </article>
                    ))}
                  </div>
                  <small className="profile-cross">{isZh ? "轮回交叉" : "Incarnation cross"} · {chart.core.incarnationCross}</small>
                  <button
                    type="button"
                    className="profile-detail-button"
                    onClick={() => onViewChange("profile-detail")}
                  >
                    <span>
                      <strong>{isZh ? "查看详细解读" : "Read the detailed guide"}</strong>
                      <small>{isZh ? "12 个与你有关的主题" : "12 themes shaped by your result"}</small>
                    </span>
                    <ArrowRightIcon />
                  </button>
                </section>
              ) : null}
            </form>
          ) : null}

          {view === "profile-detail" && chart ? (
            <section className="profile-detail-reading" aria-label={isZh ? "人类图详细解读" : "Detailed Human Design reading"}>
              <div className="profile-detail-intro">
                <span className="drawer-kicker">{isZh ? "你的人生说明书" : "Your life manual"}</span>
                <h3>{isZh ? "一份理解自己的地图，不是一份限制你的判词。" : "A map for understanding yourself, not a verdict that limits you."}</h3>
                <p>
                  {hdLabel(chart.core.type, language)} · {chart.core.profile} · {hdLabel(chart.core.authority, language)}
                </p>
              </div>
              <div className="profile-detail-sections">
                {detailedReading(chart, language).map((section, index) => (
                  <article key={section.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>{section.title}</h4>
                      <p>{section.body}</p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="reading-disclaimer">
                {isZh
                  ? "人类图只作为自我观察与对话的视角，不是科学结论，也不替你作决定。请把真实经验、身体感受与现实信息放在任何标签之前。"
                  : "Human Design is offered as a lens for reflection and conversation, not a scientific conclusion or a substitute for your decisions. Put lived experience, bodily awareness, and real-world information before any label."}
              </p>
            </section>
          ) : null}

          {view === "about" ? (
            <section className="drawer-prose">
              <span className="drawer-kicker">{isZh ? "真实自己，流动人生" : "True to yourself. Flow with life."}</span>
              <h3>{isZh ? "经典不是答案库，而是一面活的镜子。" : "A classic is not an answer bank. It is a living mirror."}</h3>
              <p>
                {isZh
                  ? "《三慢问道》以马王堆汉墓帛书乙本为主要底本。由于帛书存在残缺、漫漶与文字异体，本站采用“乙本转写 → 校读恢复 → 现代解读”的三层结构。残缺处参考帛书甲本及王弼本等传世版本，并明确标注，不将后世文本倒灌为帛书原文。"
                  : "Wendao uses the Mawangdui Silk Manuscript B as its primary foundation. Because the manuscript contains damaged and unclear passages, the app separates: 1. Silk B transcription; 2. Textual reconstruction; 3. Modern interpretation. Received texts such as the Wang Bi edition are provided only as references, not replacements."}
              </p>
              <section className="text-lineage-card" aria-label={isZh ? "道德经文本谱系" : "Textual lineage of the Daodejing"}>
                <span className="drawer-kicker">{isZh ? "《道德经》文本谱系" : "A textual lineage of the Daodejing"}</span>
                <ol>
                  {(isZh
                    ? [
                        ["郭店楚墓竹简", "战国中晚期"],
                        ["马王堆帛书甲、乙本", "西汉初期"],
                        ["河上公本", "传本年代有争议"],
                        ["王弼本", "魏晋"],
                        ["现代校勘整理本", "当代"],
                      ]
                    : [
                        ["Guodian Chu bamboo texts", "late Warring States"],
                        ["Mawangdui Silk A and B", "early Western Han"],
                        ["Heshang Gong edition", "received dating disputed"],
                        ["Wang Bi edition", "Wei–Jin period"],
                        ["Modern critical editions", "present day"],
                      ]
                  ).map(([name, period], index) => (
                    <li key={name}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{name}</strong><small>{period}</small></div>
                    </li>
                  ))}
                </ol>
                <p className="text-lineage-caveat">
                  {isZh
                    ? "这是一条帮助理解先后关系的简化时间线，不代表各版本之间存在单一直系抄传关系；王弼本是重要传世见证之一，不等同于“老子原文”。"
                    : "This simplified chronology shows sequence, not a single direct line of transmission. The Wang Bi edition is an important received witness, not the original words of Laozi."}
                </p>
              </section>
              <p>
                {isZh
                  ? "解释帮助初学者进入原典；“与你有关”把思想放回焦虑、关系与人生选择；人生说明书只用于增加理解和选择，不替任何人决定。"
                  : "Meaning helps newcomers enter the text; For You brings it into anxiety, relationships, and choice. Your life manual widens understanding without deciding for you."}
              </p>
              <div className="about-method">
                <span>01</span><p>{isZh ? "原典与版本透明" : "Transparent textual witnesses"}</p>
                <span>02</span><p>{isZh ? "解释清楚但不简化思想" : "Clarity without flattening the thought"}</p>
                <span>03</span><p>{isZh ? "启发行动但不制造依赖" : "Actionable guidance without dependence"}</p>
              </div>
              <section className="life-philosophy">
                <span className="drawer-kicker">{isZh ? "我们的生命观" : "Our philosophy of life"}</span>
                <h4>
                  {isZh
                    ? "生命不是用来证明自己的，而是用来认识、接纳、成为并活出自己。"
                    : "Life is not for proving yourself. It is for knowing, accepting, becoming, and living as yourself."}
                </h4>
                <p>
                  {isZh
                    ? "真正的成长，不是把自己改造成某个标准答案，而是在变化中越来越诚实地看见自己，越来越从容地选择自己的活法。"
                    : "Growth is not the work of turning yourself into a standard answer. It is learning to see yourself more honestly through change, and to choose your way of living with greater ease."}
                </p>
                <div className="life-path" aria-label={isZh ? "核心路径" : "Core path"}>
                  {(isZh
                    ? ["认识自己", "接纳自己", "成为自己", "活出自己"]
                    : ["Know yourself", "Accept yourself", "Become yourself", "Live as yourself"]
                  ).map((item, index) => (
                    <div key={item}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
                <div className="life-principles">
                  <article>
                    <strong>{isZh ? "一休" : "Pause"}</strong>
                    <p>{isZh ? "先照顾身体，安顿情绪，再继续前行。" : "Care for the body, settle emotion, then continue."}</p>
                  </article>
                  <article>
                    <strong>{isZh ? "不二" : "Wholeness"}</strong>
                    <p>{isZh ? "接纳高峰与低谷，拥抱完整而非完美。" : "Accept peaks and valleys; choose wholeness over perfection."}</p>
                  </article>
                  <article>
                    <strong>{isZh ? "三慢" : "Go slowly"}</strong>
                    <p>{isZh ? "慢下来、慢慢来、慢慢成为，尊重生命的节奏。" : "Slow down, take your time, and respect the rhythm of becoming."}</p>
                  </article>
                  <article>
                    <strong>{isZh ? "如水" : "Be Water"}</strong>
                    <p>{isZh ? "向内扎根，向外流动；顺应变化，不失本心。" : "Root inwardly, move outwardly; adapt without losing your center."}</p>
                  </article>
                </div>
                <blockquote>{isZh ? "向内认识自己，向外如水而行。" : "Know yourself within; move through the world like water."}</blockquote>
                <p className="life-vision">
                  {isZh
                    ? "我们愿陪伴彼此走过低谷与高峰，探索身心健康的工作与生活方式；真实面对自己与世界，善待自己、他人与生命，并在创造和欣赏中活出生命之美。"
                    : "We hope to accompany one another through valleys and peaks, exploring healthier ways to work and live: facing self and world truthfully, treating life with kindness, and creating and appreciating beauty."}
                </p>
              </section>
              <div className="contact-section">
                <span className="drawer-kicker">{isZh ? "联系我们" : "Contact"}</span>
                <div className="contact-list">
                  {contacts.map((contact) => (
                    <a
                      key={contact.label}
                      href={contact.href}
                      target={contact.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={contact.href.startsWith("mailto:") ? undefined : "noreferrer"}
                      onClick={() => onContactClick(contact.label)}
                    >
                      <span>{contact.label}</span>
                      <strong>{contact.value}</strong>
                      <ArrowRightIcon />
                    </a>
                  ))}
                  <button type="button" onClick={onVideoChannelOpen}>
                    <span>{isZh ? "视频号" : "WeChat Channels"}</span>
                    <strong>{isZh ? "查看二维码" : "View QR code"}</strong>
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {view === "feedback" ? (
            <form className="drawer-feedback" onSubmit={onFeedbackSubmit}>
              <p className="drawer-intro">
                {isZh
                  ? "原文、拼音、解释、设计或使用体验里，任何不准确、不顺手的地方，都欢迎告诉我们。"
                  : "If anything in the text, Pinyin, interpretation, design, or experience feels inaccurate or awkward, tell us here."}
              </p>
              <label>
                <span>{isZh ? "想说的话" : "Your note"}</span>
                <textarea
                  rows={7}
                  value={feedback}
                  onChange={(event) => onFeedbackChange(event.target.value)}
                  placeholder={isZh ? "请写下你看到的问题，或希望增加的内容…" : "Describe the issue or what you would like to see…"}
                />
              </label>
              <label>
                <span>{isZh ? "联系方式（选填）" : "Contact (optional)"}</span>
                <input
                  value={feedbackContact}
                  onChange={(event) => onFeedbackContactChange(event.target.value)}
                  placeholder={isZh ? "邮箱、微信或其他联系方式" : "Email or another way to reach you"}
                />
              </label>
              <button
                type="submit"
                className="drawer-primary feedback-submit"
                disabled={!feedback.trim() || feedbackState === "saving"}
              >
                <ChatBubbleIcon />
                {feedbackState === "saving"
                  ? (isZh ? "正在提交…" : "Submitting…")
                  : feedbackState === "saved"
                    ? (isZh ? "已收到，谢谢你" : "Received. Thank you.")
                    : (isZh ? "送出回响" : "Send note")}
              </button>
              {feedbackError ? <p className="form-message is-error">{feedbackError}</p> : null}
            </form>
          ) : null}
        </div>

        <footer className="drawer-footer">
          {isZh ? "帛书乙本底本校读 · 王弼本及其他版本参照" : "Silk B Base Reading · Wang Bi and other editions compared"}
        </footer>
      </aside>
    </div>
  );
}

function VideoChannelModal({ open, onClose, language }: { open: boolean; onClose: () => void; language: Language }) {
  if (!open) return null;
  return (
    <div className="image-modal" role="dialog" aria-modal="true" aria-label={language === "zh" ? "视频号二维码" : "WeChat Channels QR code"}>
      <button type="button" className="image-modal-backdrop" aria-label={language === "zh" ? "关闭" : "Close"} onClick={onClose} />
      <figure>
        <button type="button" aria-label={language === "zh" ? "关闭" : "Close"} onClick={onClose}>×</button>
        <img src="/assets/wendao/video-channel.jpg" alt={language === "zh" ? "三慢问道视频号二维码" : "Wendao WeChat Channels QR code"} />
        <figcaption>{language === "zh" ? "扫码关注视频号" : "Scan to follow on WeChat Channels"}</figcaption>
      </figure>
    </div>
  );
}

function formatDate(value: unknown, language: Language) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type AdminConsoleProps = {
  open: boolean;
  onClose: () => void;
  language: Language;
};

function AdminConsole({ open, onClose, language }: AdminConsoleProps) {
  const isZh = language === "zh";
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => window.sessionStorage.getItem(ADMIN_TOKEN_KEY) || "");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  const loadOverview = async (nextToken: string) => {
    setState("saving");
    try {
      const data = await apiRequest<AdminOverview>("/v1/admin/overview", {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      setOverview(data);
      setError("");
      setState("saved");
    } catch (nextError) {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      setToken("");
      setOverview(null);
      setError(nextError instanceof Error ? nextError.message : "读取失败");
      setState("error");
    }
  };

  useEffect(() => {
    if (open && token && !overview && state !== "saving") void loadOverview(token);
  }, [open, token]);

  if (!open) return null;

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setState("saving");
    try {
      const data = await apiRequest<{ token: string }>("/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      await loadOverview(data.token);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "登录失败");
      setState("error");
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setOverview(null);
    setState("idle");
  };

  const updateFeedback = async (id: string, status: string) => {
    try {
      await apiRequest<{ saved: boolean }>("/v1/admin/feedback-status", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      await loadOverview(token);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "更新失败");
    }
  };

  return (
    <section className="admin-console" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <header>
        <div>
          <span>三慢问道 · WENDAO</span>
          <h2 id="admin-title">{isZh ? "数据后台" : "Admin"}</h2>
        </div>
        <button type="button" aria-label={isZh ? "关闭" : "Close"} onClick={onClose}>×</button>
      </header>
      {!token ? (
        <form className="admin-login" onSubmit={login}>
          <LockClosedIcon />
          <h3>{isZh ? "管理者登录" : "Admin sign in"}</h3>
          <p>{isZh ? "输入管理密码查看用户、反馈、对话与行为数据。" : "Enter the admin password to view product data."}</p>
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isZh ? "管理密码" : "Password"}
            autoComplete="current-password"
          />
          <button type="submit" disabled={state === "saving"}>{state === "saving" ? "…" : (isZh ? "登录" : "Sign in")}</button>
          {error ? <p className="form-message is-error">{error}</p> : null}
        </form>
      ) : (
        <>
          <nav className="admin-tabs" aria-label={isZh ? "数据分类" : "Data sections"}>
            {([
              ["overview", isZh ? "概览" : "Overview"],
              ["profiles", isZh ? "用户" : "People"],
              ["conversations", isZh ? "对话" : "Chats"],
              ["feedback", isZh ? "反馈" : "Feedback"],
              ["events", isZh ? "行为" : "Events"],
            ] as Array<[AdminTab, string]>).map(([id, label]) => (
              <button type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} key={id}>{label}</button>
            ))}
          </nav>
          <div className="admin-scroll">
            {state === "saving" && !overview ? <p className="admin-empty">{isZh ? "正在读取…" : "Loading…"}</p> : null}
            {overview && tab === "overview" ? (
              <>
                <div className="admin-summary">
                  <article><strong>{overview.summary.profiles}</strong><span>{isZh ? "人生说明书" : "Profiles"}</span></article>
                  <article><strong>{overview.summary.conversations}</strong><span>{isZh ? "AI 对话" : "Chats"}</span></article>
                  <article><strong>{overview.summary.feedback}</strong><span>{isZh ? "反馈" : "Feedback"}</span></article>
                  <article><strong>{overview.summary.events}</strong><span>{isZh ? "行为事件" : "Events"}</span></article>
                </div>
                <section className="admin-panel">
                  <h3>{isZh ? "记录范围" : "Recorded data"}</h3>
                  <p>{isZh ? "出生资料与人类图核心结果、用户提问与产品回应、反馈及有限的功能使用事件。密码和敏感密钥不进入前端代码。" : "Birth details and chart summaries, questions and responses, feedback, and a limited set of product events. Secrets never enter frontend code."}</p>
                </section>
              </>
            ) : null}
            {overview && tab === "profiles" ? (
              <div className="admin-list">
                {overview.profiles.map((row) => {
                  const core = (row.chart_core || {}) as Record<string, unknown>;
                  return (
                    <article key={String(row.id)}>
                      <div><strong>{String(row.name || "未填写称呼")}</strong><time>{formatDate(row.updated_at, language)}</time></div>
                      <p>{String(core.type || "—")} · {String(core.profile || "—")} · {String(core.authority || "—")}</p>
                      <small>{String(row.birth_place || "—")} · {String(row.birth_date || "—")} {String(row.birth_time || "")}</small>
                    </article>
                  );
                })}
              </div>
            ) : null}
            {overview && tab === "conversations" ? (
              <div className="admin-list">
                {overview.conversations.map((row) => (
                  <article key={String(row.id)}>
                    <div><strong>{isZh ? `第 ${String(row.chapter_id || "—")} 章` : `Chapter ${String(row.chapter_id || "—")}`}</strong><time>{formatDate(row.created_at, language)}</time></div>
                    <p>{String(row.question || "")}</p>
                    <small>{String(row.answer || "")}</small>
                  </article>
                ))}
              </div>
            ) : null}
            {overview && tab === "feedback" ? (
              <div className="admin-list">
                {overview.feedback.map((row) => (
                  <article key={String(row.id)}>
                    <div><strong>{String(row.contact || (isZh ? "匿名反馈" : "Anonymous"))}</strong><time>{formatDate(row.created_at, language)}</time></div>
                    <p>{String(row.message || "")}</p>
                    <div className="status-actions">
                      {["new", "reviewing", "resolved"].map((status) => (
                        <button
                          type="button"
                          className={row.status === status ? "is-active" : ""}
                          onClick={() => void updateFeedback(String(row.id), status)}
                          key={status}
                        >
                          {status === "new" ? (isZh ? "待处理" : "New") : status === "reviewing" ? (isZh ? "处理中" : "Reviewing") : (isZh ? "已完成" : "Resolved")}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {overview && tab === "events" ? (
              <div className="event-list">
                {Object.entries(overview.eventBreakdown).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name}><span>{name}</span><strong>{count}</strong></div>
                ))}
              </div>
            ) : null}
            {error ? <p className="form-message is-error">{error}</p> : null}
          </div>
          <footer className="admin-footer">
            <button type="button" onClick={() => void loadOverview(token)}>{isZh ? "刷新" : "Refresh"}</button>
            <button type="button" onClick={logout}>{isZh ? "退出登录" : "Sign out"}</button>
          </footer>
        </>
      )}
    </section>
  );
}

export default function Prototype() {
  const initialRequest = useRef(initialReadingRequest()).current;
  const [language, setLanguage] = useState<Language>(initialRequest.language);
  const [recommendationDate] = useState(localDateKey);
  const [chapterId, setChapterId] = useState(() => initialRequest.chapterId ?? dailyChapterId(recommendationDate));
  const [chapterEntrySource, setChapterEntrySource] = useState<ChapterEntrySource>(initialRequest.chapterId ? "link" : "daily");
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [insightOpen, setInsightOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareChapterId, setShareChapterId] = useState(chapterId);
  const [shareInitialKind, setShareInitialKind] = useState<ShareCardKind>("verse");
  const [shareSelectedText, setShareSelectedText] = useState("");
  const [selectionPrompt, setSelectionPrompt] = useState<ReadingSelectionPrompt | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<DrawerView>("home");
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [isReadingScrolled, setIsReadingScrolled] = useState(false);
  const [visibleChapterCount, setVisibleChapterCount] = useState(1);
  const [isOpeningNextChapter, setIsOpeningNextChapter] = useState(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [readingSize, setReadingSize] = useState<ReadingSize>(loadReadingSize);
  const [profile, setProfile] = useState<LifeProfile>(loadProfile);
  const [profileDraft, setProfileDraft] = useState<LifeProfile>(loadProfile);
  const [chart, setChart] = useState<ChartSnapshot | null>(loadChart);
  const [profileState, setProfileState] = useState<SaveState>("idle");
  const [profileError, setProfileError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackState, setFeedbackState] = useState<SaveState>("idle");
  const [feedbackError, setFeedbackError] = useState("");
  const [responseText, setResponseText] = useState("");
  const [videoChannelOpen, setVideoChannelOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(isAdminLocation);
  const clientId = useRef(stableId(CLIENT_ID_KEY));
  const sessionId = useRef(window.crypto.randomUUID());
  const appOpenTracked = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const chapterOpeningRef = useRef(false);
  const chapterOpeningTimerRef = useRef<number | null>(null);
  const initialSectionHandledRef = useRef(false);
  const orderedChapters = useMemo(() => reorderFrom(chapterId), [chapterId]);
  const isZh = language === "zh";
  const activeChapter = chapters.find((chapter) => chapter.id === chapterId) ?? chapters[0];
  const activeCopy = activeChapter[language];
  const shareChapter = chapters.find((chapter) => chapter.id === shareChapterId) ?? activeChapter;
  const shareCopy = shareChapter[language];
  const profileReady = Boolean(chart?.chartHash);
  const normalizedDirectoryQuery = directoryQuery.trim().toLocaleLowerCase().replace(/\s+/g, "");
  const directoryChapters = useMemo(
    () => normalizedDirectoryQuery
      ? chapters.filter((chapter) => chapterSearchText(chapter).includes(normalizedDirectoryQuery))
      : chapters,
    [normalizedDirectoryQuery],
  );

  const trackEvent = (eventName: string, metadata: Record<string, string | number> = {}, eventChapter = chapterId) => {
    void apiRequest<{ saved: boolean }>("/v1/events", {
      method: "POST",
      body: JSON.stringify({
        clientId: clientId.current,
        sessionId: sessionId.current,
        eventName,
        chapterId: eventChapter,
        locale: language,
        metadata,
      }),
    }).catch(() => undefined);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#10191b" : "#f7f1e6");
    void syncNativeTheme(theme);
  }, [theme]);

  useEffect(() => {
    void initializeNativeShell(theme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.readingSize = readingSize;
    window.localStorage.setItem(READING_SIZE_STORAGE_KEY, readingSize);
  }, [readingSize]);

  useEffect(() => {
    if (appOpenTracked.current) return;
    appOpenTracked.current = true;
    trackEvent("app_open", { source: runtimeSurface() });
  }, []);

  useEffect(() => {
    const scroll = document.querySelector<HTMLElement>("[data-testid='mobile-scroll']");
    if (!scroll) return;

    const updateReadingState = () => {
      setIsReadingScrolled(scroll.scrollTop > 44);
      setSelectionPrompt(null);
    };
    updateReadingState();
    scroll.addEventListener("scroll", updateReadingState, { passive: true });
    return () => scroll.removeEventListener("scroll", updateReadingState);
  }, []);

  useEffect(() => {
    const updateSelection = () => {
      window.requestAnimationFrame(() => setSelectionPrompt(currentReadingSelection()));
    };
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, []);

  useEffect(() => {
    if (initialSectionHandledRef.current || !initialRequest.section) return;
    initialSectionHandledRef.current = true;
    const timer = window.setTimeout(() => {
      const chapter = document.querySelector<HTMLElement>(`.chapter[data-chapter-id="${chapterId}"]`);
      const target = chapter?.querySelector<HTMLElement>(`[data-share-section="${initialRequest.section}"]`)
        ?? (initialRequest.section === "manual"
          ? chapter?.querySelector<HTMLElement>('[data-share-section="inspiration"]')
          : null);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [chapterId, initialRequest.section]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-testid='mobile-scroll']");
    const trigger = loadMoreRef.current;
    if (!root || !trigger || visibleChapterCount >= orderedChapters.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || chapterOpeningRef.current) return;
      chapterOpeningRef.current = true;
      setIsOpeningNextChapter(true);
      nativeImpact("light");
      const openingDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 720;
      chapterOpeningTimerRef.current = window.setTimeout(() => {
        setVisibleChapterCount((current) => Math.min(current + 1, orderedChapters.length));
        chapterOpeningRef.current = false;
        setIsOpeningNextChapter(false);
        chapterOpeningTimerRef.current = null;
      }, openingDelay);
    }, { root, threshold: 1 });

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [orderedChapters, visibleChapterCount]);

  useEffect(() => () => {
    if (chapterOpeningTimerRef.current !== null) window.clearTimeout(chapterOpeningTimerRef.current);
  }, []);

  const resetChapterOpening = () => {
    if (chapterOpeningTimerRef.current !== null) window.clearTimeout(chapterOpeningTimerRef.current);
    chapterOpeningTimerRef.current = null;
    chapterOpeningRef.current = false;
    setIsOpeningNextChapter(false);
  };

  const selectChapter = (id: number) => {
    resetChapterOpening();
    nativeImpact("light");
    setChapterId(id);
    setChapterEntrySource("directory");
    setVisibleChapterCount(1);
    setDirectoryOpen(false);
    setDirectoryQuery("");
    trackEvent("chapter_view", { source: "directory" }, id);
    scrollReadingToTop();
  };

  const meetAChapter = () => {
    resetChapterOpening();
    nativeImpact("medium");
    const candidates = chapters.filter((chapter) => chapter.id !== chapterId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setChapterId(next.id);
    setChapterEntrySource("chance");
    setVisibleChapterCount(1);
    trackEvent("chance_chapter", { target: String(next.id) }, next.id);
    scrollReadingToTop();
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion) return;
    if (!profileReady || !chart) {
      setProfileDraft(profile);
      setDrawerView("profile");
      setDrawerOpen(true);
      setProfileError(isZh
        ? "请先完成出生信息并生成人生说明书，三慢问道才能结合你的真实结果回应。"
        : "Complete your birth details and life manual before asking for a personalized response.");
      trackEvent("profile_open", { source: "composer" });
      return;
    }
    const answer = questionResponse(nextQuestion, activeCopy, chart, language);
    setSubmittedQuestion(nextQuestion);
    setResponseText(answer);
    setInsightOpen(true);
    setQuestion("");
    trackEvent("question_submit", { questionLength: nextQuestion.length });
    void apiRequest<{ saved: boolean }>("/v1/conversations", {
      method: "POST",
      body: JSON.stringify({
        clientId: clientId.current,
        sessionId: sessionId.current,
        chapterId,
        locale: language,
        question: nextQuestion,
        answer,
        chartHash: chart.chartHash,
      }),
    }).catch(() => undefined);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const profileInput = {
      name: profileDraft.name.trim(),
      birthDate: profileDraft.birthDate,
      birthTime: profileDraft.birthTime,
      birthPlace: profileDraft.birthPlace.trim(),
    };
    setProfileState("saving");
    setProfileError("");
    try {
      const timezone = await resolveBirthplaceTimezone(profileInput.birthPlace);
      const nextProfile: LifeProfile = { ...profileInput, timezone };
      const nextChart = await apiRequest<ChartSnapshot>("/v1/charts", {
        method: "POST",
        body: JSON.stringify({
          birthDate: nextProfile.birthDate,
          birthTime: nextProfile.birthTime,
          timezone: nextProfile.timezone,
          locationLabel: nextProfile.birthPlace,
        }),
      });
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      setChart(nextChart);
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      window.localStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(nextChart));
      setProfileState("saved");
      trackEvent("profile_saved", { source: "drawer" });
      trackEvent("chart_calculated", { value: nextChart.core.type });

      // The engine result is the user-facing outcome. Product-data persistence
      // runs in the background so a slow analytics backend cannot trap the form
      // in its calculating state after the chart is already available.
      void apiRequest<{ saved: boolean }>("/v1/profiles", {
        method: "POST",
        body: JSON.stringify({
          clientId: clientId.current,
          name: nextProfile.name,
          birthDate: nextProfile.birthDate,
          birthTime: nextProfile.birthTime,
          birthPlace: nextProfile.birthPlace,
          timezone: nextProfile.timezone,
          chartHash: nextChart.chartHash,
          chartCore: nextChart.core,
          chartStructure: nextChart.structure,
          consentAt: new Date().toISOString(),
        }),
      }).catch(() => undefined);
    } catch (nextError) {
      setProfileState("error");
      const message = nextError instanceof Error ? nextError.message : "";
      setProfileError(message === "BIRTHPLACE_NOT_FOUND" || nextError instanceof DOMException
        ? (isZh
          ? "暂时无法识别这个出生地点，请填写更完整的“城市 + 国家或地区”后重试。"
          : "We couldn't identify this birthplace. Add the city and country or region, then try again.")
        : message === "REQUEST_TIMEOUT"
          ? (isZh
            ? "计算服务响应超时，请检查网络后重新生成。"
            : "The calculation service took too long to respond. Check your connection and try again.")
          : (message || (isZh ? "计算失败，请稍后再试。" : "Calculation failed. Please try again.")));
    }
  };

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackState("saving");
    setFeedbackError("");
    try {
      await apiRequest<{ saved: boolean }>("/v1/feedback", {
        method: "POST",
        body: JSON.stringify({
          clientId: clientId.current,
          message: feedback.trim(),
          contact: feedbackContact.trim(),
          locale: language,
          chapterId,
          pagePath: window.location.pathname,
          appVersion: APP_VERSION,
        }),
      });
      setFeedback("");
      setFeedbackContact("");
      setFeedbackState("saved");
      trackEvent("feedback_submit", { source: "drawer" });
    } catch (nextError) {
      setFeedbackState("error");
      setFeedbackError(nextError instanceof Error ? nextError.message : "提交失败，请稍后再试。");
    }
  };

  const openDrawer = () => {
    setProfileDraft(profile);
    setDrawerView("home");
    setDrawerOpen(true);
  };

  const changeLanguage = (nextLanguage: Language) => {
    resetChapterOpening();
    setLanguage(nextLanguage);
    setVisibleChapterCount(1);
    scrollReadingToTop("auto");
    if (nextLanguage !== language) trackEvent("language_change", { value: nextLanguage });
  };

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    trackEvent("theme_change", { value: nextTheme });
  };

  const openShare = (kind: ShareCardKind, targetChapterId: number, selectedText = "") => {
    setShareChapterId(targetChapterId);
    setShareInitialKind(kind);
    setShareSelectedText(selectedText);
    setSelectionPrompt(null);
    setShareOpen(true);
    window.getSelection()?.removeAllRanges();
  };

  const captureReadingSelection = () => {
    window.requestAnimationFrame(() => setSelectionPrompt(currentReadingSelection()));
  };

  return (
    <>
      <header
        className={`reading-header reading-header-fixed ${isReadingScrolled ? "is-scrolled" : ""}`}
        aria-label={isZh ? "阅读工具" : "Reading tools"}
        lang={isZh ? "zh-CN" : "en"}
      >
        <button className="wordmark" type="button" onClick={() => scrollReadingToTop()}>
          {isZh ? "三慢问道" : "Wendao"}
        </button>
        <span className="header-rule" aria-hidden="true" />
        <button
          className="header-action directory-action"
          type="button"
          onClick={() => {
            setDirectoryOpen(true);
            trackEvent("directory_open", { source: "header" });
          }}
        >
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
            onClick={() => changeLanguage("zh")}
          >
            中
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            className={!isZh ? "is-active" : undefined}
            aria-pressed={!isZh}
            onClick={() => changeLanguage("en")}
          >
            EN
          </button>
        </div>
        <button
          className="header-menu-button"
          type="button"
          aria-label={isZh ? "打开更多功能" : "Open more"}
          onClick={openDrawer}
        >
          <HamburgerMenuIcon />
        </button>
      </header>

      <div className="app-screen" data-testid="mobile-scroll">
        <main
          className="reading-shell"
          data-testid="reading-screen"
          data-reading-top
          lang={isZh ? "zh-CN" : "en"}
          onPointerUp={captureReadingSelection}
          onKeyUp={captureReadingSelection}
        >
          <p className="philosophy-line">
            {isZh ? "真实自己，流动人生" : "True to yourself. Flow with life."}
          </p>

          {orderedChapters.slice(0, visibleChapterCount).map((chapter, chapterIndex) => {
            const copy = chapter[language];
            const verse = isZh ? chapter.zh.reconstructedVerse : chapter.en.verse;
            const pinyin = isZh ? chapter.zh.pinyin : undefined;
            return (
              <article
                className={`chapter ${chapterIndex === 0 ? "chapter-current" : "chapter-continuation"}`}
                key={chapter.id}
                data-chapter-id={chapter.id}
                aria-labelledby={`chapter-${chapter.id}-${language}`}
              >
                {chapterIndex > 0 ? (
                  <div className="next-chapter-divider" aria-label={isZh ? "下一章" : "Next chapter"}>
                    <span className="divider-dot" />
                    <span className="divider-line" />
                    <small>{isZh ? "下一章已展开" : "Next chapter opened"}</small>
                  </div>
                ) : null}

                <div className="chapter-content">
                  <section className="section-layout original-section" data-share-section="verse">
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
                        <p
                          className={`chapter-eyebrow ${chapterIndex === 0 && chapterEntrySource === "daily" ? "is-daily" : ""}`}
                          data-testid={chapterIndex === 0 && chapterEntrySource === "daily" ? "daily-recommendation" : undefined}
                          data-recommendation-date={chapterIndex === 0 && chapterEntrySource === "daily" ? recommendationDate : undefined}
                        >
                          {chapterIndex === 0 && chapterEntrySource === "daily" ? (
                            <>
                              <strong>{isZh ? "今日偶遇" : "Today’s encounter"}</strong>
                              <span className="daily-recommendation-separator" aria-hidden="true">｜</span>
                              <strong>{copy.eyebrow}</strong>
                            </>
                          ) : copy.eyebrow}
                        </p>
                        <span className="chapter-meta-tools">
                          <span className="chapter-completeness">
                            {isZh ? `全文 · ${verse.length}句` : `Full text · ${verse.length} lines`}
                          </span>
                          <button
                            type="button"
                            className="chapter-share-quick"
                            aria-label={isZh ? "分享本章推荐" : "Share a recommended passage"}
                            onClick={() => openShare("verse", chapter.id)}
                          >
                            <Share1Icon />
                            <span>{isZh ? "分享" : "Share"}</span>
                          </button>
                        </span>
                      </div>
                      <h1 id={`chapter-${chapter.id}-${language}`}>{copy.title}</h1>
                      <div className="reading-layer-heading">
                        <strong>{isZh ? "第二层｜校读正文" : "Layer 2 · Base reading"}</strong>
                        <small>{isZh ? "〔〕内为校补字" : "Supplied graphs appear in 〔〕"}</small>
                      </div>
                      <div className="verse" onCopy={copyVerseWithoutPinyin}>
                        {verse.map((line, lineIndex) => (
                          <p
                            className={isZh ? "verse-line verse-line-ruby" : "verse-line"}
                            key={`${chapter.id}-${lineIndex}`}
                            aria-label={line}
                            data-copy-text={line}
                          >
                            {isZh && pinyin
                              ? renderPinyinLine(line, pinyin[lineIndex])
                              : line}
                          </p>
                        ))}
                      </div>
                      <div className="transcription-layer">
                        <strong>{isZh ? "第一层｜帛书乙本转写" : "Layer 1 · Silk B transcription"}</strong>
                        <p lang="zh-Hant">{chapter.sources.silkBTranscription}</p>
                        <small>{isZh ? chapter.sources.reconstructionNotes : `Editorial record: ${chapter.sources.reconstructionNotes}`}</small>
                      </div>
                      <p className="variant-note">{copy.variant}</p>
                      <button type="button" className="section-share-action" onClick={() => openShare("verse", chapter.id)}>
                        <Share1Icon />
                        <span>{isZh ? "分享此刻" : "Share this moment"}</span>
                      </button>
                    </div>
                  </section>

                  <section className="section-layout explanation-section" aria-label={isZh ? "解释" : "Meaning"} data-share-section="meaning">
                    <aside className="section-marker" aria-hidden="true">
                      <span className="rail-label">
                        <span>02</span>
                        <small>{isZh ? "解释" : "MEANING"}</small>
                      </span>
                      <span className="rail-line rail-fill" />
                    </aside>
                    <div className="section-copy">
                      <div className="interpretation-layer-heading">
                        {isZh ? "第三层｜现代解读" : "Layer 3 · Modern interpretation"}
                      </div>
                      {isZh ? (
                        <div className="explanation-item line-by-line-reading">
                          <h2>{chapter.zh.explanation[0].title}</h2>
                          <p className="line-reading-intro">{chapter.zh.explanation[0].body}</p>
                          <ol>
                            {chapter.zh.reconstructedVerse.map((line, lineIndex) => (
                              <li key={`${chapter.id}-translation-${lineIndex}`} data-line-index={lineIndex + 1}>
                                <div className="line-reading-source">
                                  <span>{String(lineIndex + 1).padStart(2, "0")}</span>
                                  <q>{line}</q>
                                </div>
                                <p>{chapter.zh.lineByLineTranslation[lineIndex]}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                      {copy.explanation.slice(isZh ? 1 : 0, 2).map((item) => (
                        <div className="explanation-item" key={item.title}>
                          <h2>{item.title}</h2>
                          <p>{item.body}</p>
                        </div>
                      ))}
                      <button type="button" className="section-share-action" onClick={() => openShare("meaning", chapter.id)}>
                        <Share1Icon />
                        <span>{isZh ? "分享此刻" : "Share this moment"}</span>
                      </button>
                    </div>
                  </section>

                  <section className="section-layout related-section" aria-label={isZh ? "与你有关" : "For you"} data-share-section="inspiration">
                    <aside className="section-marker" aria-hidden="true">
                      <span className="rail-label">
                        <span>03</span>
                        <small>{isZh ? "与你有关" : "FOR YOU"}</small>
                      </span>
                      <span className="rail-line rail-fill" />
                    </aside>
                    <div className="section-copy">
                      {copy.related
                        .filter((item) => profileReady || !isLifeManualItem(item))
                        .map((item) => (
                        <div className="related-item" data-share-section={isLifeManualItem(item) ? "manual" : undefined} key={item.title}>
                          <h2>{item.title}</h2>
                          <p>{isLifeManualItem(item) && chart ? personalizedAdvice(chapter.id, copy, chart, language) : item.body}</p>
                        </div>
                        ))}
                      <div className="practice-card">
                        <span className="practice-kicker">{isZh ? "今日一练" : "A practice for today"}</span>
                        <p>{copy.action}</p>
                      </div>
                      <button type="button" className="section-share-action" onClick={() => openShare("inspiration", chapter.id)}>
                        <Share1Icon />
                        <span>{isZh ? "分享此刻" : "Share this moment"}</span>
                      </button>
                    </div>
                  </section>
                </div>
              </article>
            );
          })}

          {visibleChapterCount < orderedChapters.length ? (
            <>
              <div className="chapter-load-trigger" role="status">
                <small>{isZh ? "本章已读完" : "End of this chapter"}</small>
                <strong>
                  {isOpeningNextChapter
                    ? (isZh ? "下一章正在展开" : "The next chapter is opening")
                    : (isZh ? "继续向下，开启下一章" : "Continue down to open the next chapter")}
                </strong>
                <span>{isZh ? "下一章" : "Next"} · {orderedChapters[visibleChapterCount][language].title}</span>
                <span className={`chapter-ritual-mark ${isOpeningNextChapter ? "is-opening" : ""}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="chapter-load-sentinel" ref={loadMoreRef} aria-hidden="true" />
            </>
          ) : null}

          <footer className="reading-footer">
            <span>{isZh ? "认识 · 接纳 · 成为 · 活出" : "Know · Accept · Become · Live"}</span>
            <small>{isZh ? "帛书乙本底本校读 · 多版本互校" : "Silk B Base Reading · Versions compared"}</small>
          </footer>
        </main>
      </div>

      {selectionPrompt && !directoryOpen && !insightOpen && !drawerOpen && !shareOpen ? (
        <button
          type="button"
          className="selection-share-button"
          style={{ left: selectionPrompt.x, top: selectionPrompt.y }}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => openShare(selectionPrompt.kind, selectionPrompt.chapterId, selectionPrompt.text)}
        >
          <Share1Icon />
          {isZh ? "分享所选" : "Share selection"}
        </button>
      ) : null}

      {!directoryOpen && !insightOpen && !drawerOpen && !shareOpen ? (
        <form
          className={`ai-composer ${isReadingScrolled ? "is-reading" : ""}`}
          onSubmit={submitQuestion}
        >
          <span className="composer-spark" aria-hidden="true">✦</span>
          <div className="composer-field">
            <small className="composer-expectation" id="composer-expectation">
              {isZh ? "AI 个性化回应 · 即将接入" : "AI personalization · coming soon"}
            </small>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onFocus={() => trackEvent("composer_focus", { source: "reading" })}
              placeholder={isZh ? "问问这一章与你的关系…" : "Ask how this chapter relates to you…"}
              aria-label={isZh ? "向三慢问道提问" : "Ask Wendao"}
              aria-describedby="composer-expectation"
            />
          </div>
          <button type="submit" aria-label={isZh ? "发送" : "Send"}>
            <ArrowRightIcon />
          </button>
        </form>
      ) : null}

      <WebSheet
        open={directoryOpen}
        onOpenChange={setDirectoryOpen}
        title={isZh ? "目录" : "Contents"}
        description={isZh ? "帛书次序为主，括号内为今本章次" : "Silk-text order first; received chapter in parentheses"}
      >
        <div className="directory-search" role="search" aria-label={isZh ? "搜索章节" : "Search chapters"}>
          <div className="directory-search-field">
            <MagnifyingGlassIcon aria-hidden="true" />
            <input
              type="search"
              value={directoryQuery}
              onChange={(event) => setDirectoryQuery(event.target.value)}
              placeholder={isZh ? "搜索章次、标题、原文与解读" : "Search number, title, text, or meaning"}
              aria-label={isZh ? "搜索章节" : "Search chapters"}
            />
            {directoryQuery ? (
              <button
                type="button"
                onClick={() => setDirectoryQuery("")}
                aria-label={isZh ? "清除搜索" : "Clear search"}
              >
                ×
              </button>
            ) : null}
          </div>
          <small>
            {normalizedDirectoryQuery
              ? (isZh ? `找到 ${directoryChapters.length} 章` : `${directoryChapters.length} chapters found`)
              : (isZh ? "可搜索乙本转写、校读正文、传世参照与现代解读" : "Includes Silk B, base readings, received references, and interpretation")}
          </small>
        </div>
        <div className="directory-list">
          {directoryChapters.map((chapter) => {
            const copy = chapter[language];
            return (
              <button
                type="button"
                className={chapter.id === chapterId ? "directory-item is-current" : "directory-item"}
                key={chapter.id}
                data-chapter-id={chapter.id}
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
          {directoryChapters.length === 0 ? (
            <p className="directory-empty">
              {isZh ? "没有找到相关章节，换一个词试试。" : "No chapter found. Try another term."}
            </p>
          ) : null}
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
            {responseText}
          </p>
          <div className="ai-guidance">
            <span>{isZh ? "此刻可以问自己" : "Ask yourself now"}</span>
            <strong>
              {isZh
                ? "这个决定在压力过去以后，是否仍然让我感到真实、清楚、可以承担？"
                : "After the pressure passes, does this decision still feel true, clear, and mine to carry?"}
            </strong>
          </div>
          <p>
            {isZh
              ? "如果你愿意，先写下两个选项各自让身体产生的感觉。我们可以从更松、更真实的那个反应继续。"
              : "If you like, write down how each option feels in your body. We can continue with the response that feels more spacious and true."}
          </p>
          <aside className="ai-preview-note">
            <strong>{isZh ? "AI 个性化回应即将接入" : "AI personalization is coming"}</strong>
            <p>
              {isZh
                ? "当前为体验版回应。接入大模型后，将综合本章、你的提问与已验证的人类图信息，给出更贴近你当下处境的建议；它仍是自我观察的参考，不替你做决定。"
                : "This is a preview response. Once the AI model is connected, it will combine this chapter, your question, and your verified Human Design information for advice closer to your present situation—still as a lens for reflection, never a verdict."}
            </p>
          </aside>
          <div className="source-disclosure">
            <span>{isZh ? "回应依据" : "Response basis"}</span>
            <p>
              {chart
                ? `${isZh ? "本章原典 · 你的提问" : "This chapter · Your question"} · ${hdLabel(chart.core.type, language)} · ${chart.core.profile} · ${hdLabel(chart.core.authority, language)}`
                : (isZh ? "本章原典 · 你的提问" : "This chapter · Your question")}
            </p>
          </div>
        </div>
      </WebSheet>

      <WebSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={isZh ? "分享这一章" : "Share this chapter"}
        description={isZh ? "分享你选中的文字，或这一层的推荐片段" : "Share your selection or a recommended passage from this layer"}
        variant="share"
      >
        <ShareCardPanel
          chapter={shareChapter}
          language={language}
          manualText={chart ? personalizedAdvice(shareChapter.id, shareCopy, chart, language) : undefined}
          profileReady={profileReady}
          initialKind={shareInitialKind}
          selectedText={shareSelectedText || undefined}
        />
      </WebSheet>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
        view={drawerView}
        onViewChange={setDrawerView}
        theme={theme}
        onThemeChange={changeTheme}
        readingSize={readingSize}
        onReadingSizeChange={(size) => {
          resetChapterOpening();
          setReadingSize(size);
          setVisibleChapterCount(1);
          scrollReadingToTop("auto");
          trackEvent("reading_size_change", { value: size });
        }}
        profile={profile}
        profileDraft={profileDraft}
        onProfileDraftChange={setProfileDraft}
        onProfileSave={saveProfile}
        profileState={profileState}
        profileError={profileError}
        chart={chart}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        feedbackContact={feedbackContact}
        onFeedbackContactChange={setFeedbackContact}
        feedbackState={feedbackState}
        feedbackError={feedbackError}
        onFeedbackSubmit={submitFeedback}
        onContactClick={(target) => trackEvent("contact_click", { target })}
        onWorkClick={(target) => trackEvent("related_product_click", { target })}
        onVideoChannelOpen={() => {
          setVideoChannelOpen(true);
          trackEvent("contact_click", { target: "视频号" });
        }}
      />
      <VideoChannelModal open={videoChannelOpen} onClose={() => setVideoChannelOpen(false)} language={language} />
      <AdminConsole
        open={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          const nextPath = /\/admin\/?$/.test(window.location.pathname)
            ? publicPath()
            : window.location.pathname;
          window.history.replaceState(null, "", `${nextPath}${window.location.search}`);
        }}
        language={language}
      />
    </>
  );
}
