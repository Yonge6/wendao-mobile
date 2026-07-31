import {
  FormEvent,
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
  ChatBubbleIcon,
  CheckIcon,
  ChevronRightIcon,
  HamburgerMenuIcon,
  InfoCircledIcon,
  LockClosedIcon,
  MoonIcon,
  PersonIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/600.css";

type Language = "zh" | "en";
type Theme = "light" | "dark";
type DrawerView = "home" | "profile" | "about" | "feedback";

type LifeProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: string;
};

type ChartSnapshot = {
  schemaVersion: string;
  chartHash: string;
  verificationStatus: string;
  core: {
    type: string;
    strategy: string;
    authority: string;
    profile: string;
    definition: string;
    incarnationCross: string;
  };
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

const API_BASE = "https://pluto-human-design-api.vercel.app";
const PROFILE_STORAGE_KEY = "wendao-life-profile";
const CHART_STORAGE_KEY = "wendao-chart-snapshot";
const THEME_STORAGE_KEY = "wendao-theme";
const CLIENT_ID_KEY = "wendao-client-id";
const ADMIN_TOKEN_KEY = "wendao-admin-token";
const APP_VERSION = "2026.07.31";
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

function stableId(storageKey: string) {
  if (typeof window === "undefined") return "00000000-0000-4000-8000-000000000000";
  const stored = window.localStorage.getItem(storageKey);
  if (stored) return stored;
  const id = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, id);
  return id;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
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

function personalizedAdvice(chapterId: number, chart: ChartSnapshot, language: Language) {
  const type = hdLabel(chart.core.type, language);
  const strategy = hdLabel(chart.core.strategy, language);
  const authority = hdLabel(chart.core.authority, language);
  if (language === "en") {
    const chapterThought = chapterId === 8
      ? "Water suggests that flexibility can be strength: let the situation reach you before deciding how to move."
      : chapterId === 9
        ? "Knowing when enough is enough protects your energy from being spent only to prove yourself."
        : "Before naming the situation too quickly, notice what your own response is already showing you.";
    return `Your chart describes you as a ${type}, with ${strategy} as your strategy and ${authority} as your decision-making authority. ${chapterThought} This is a lens for reflection, not a verdict: use it to notice your timing, then make the choice that remains true after the immediate pressure passes.`;
  }
  const chapterThought = chapterId === 8
    ? "水提醒你：柔软不是退让，而是先让局面来到你这里，再辨认自己真正愿意流向哪里。"
    : chapterId === 9
      ? "“持而盈之”提醒你留意那个已经足够的时刻，不必为了证明自己继续消耗。"
      : "在急着命名局面之前，先听见身体已经给出的回应，让真实经验走在标签前面。";
  return `你的人类图类型是${type}，策略是“${strategy}”，做重要决定时可参考${authority}。${chapterThought}这不是对你的判定，而是一面观察自己的镜子：先辨认节奏与感受，再由你决定怎样行动。`;
}

function questionResponse(question: string, chapter: ChapterCopy, chart: ChartSnapshot, language: Language) {
  const type = hdLabel(chart.core.type, language);
  const strategy = hdLabel(chart.core.strategy, language);
  const authority = hdLabel(chart.core.authority, language);
  if (language === "en") {
    return `In “${chapter.title}”, the useful move is not to force an immediate answer to “${question}”. As a ${type}, your experiment is ${strategy}; with ${authority}, give the decision enough space to become clear. Notice which option lets the situation move without asking you to abandon yourself.`;
  }
  return `面对“${question}”，《${chapter.title}》给你的不是一个替你决定的答案。作为${type}，你可以先实践“${strategy}”；结合${authority}，给重要决定留出澄清的空间。观察哪一个选择既让事情重新流动，也不要求你背离真实的自己。`;
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const chapters: Chapter[] = [
  {
    id: 8,
    silkOrder: "44",
    zh: {
      eyebrow: "帛书乙本 · 对应今本第八章",
      title: "上善如水",
      verse: [
        "上善如水。",
        "水善利万物而有争，",
        "居众人之所亚，",
        "故几于道矣。",
        "居善地，心善渊，",
        "予善天，言善信，",
        "正善治，事善能，",
        "动善时。",
        "夫唯不争，故无尤。",
      ],
      pinyin: [
        ["shàng", "shàn", "rú", "shuǐ"],
        ["shuǐ", "shàn", "lì", "wàn", "wù", "ér", "yǒu", "zhēng"],
        ["jū", "zhòng", "rén", "zhī", "suǒ", "yà"],
        ["gù", "jī", "yú", "dào", "yǐ"],
        ["jū", "shàn", "dì", "xīn", "shàn", "yuān"],
        ["yǔ", "shàn", "tiān", "yán", "shàn", "xìn"],
        ["zhèng", "shàn", "zhì", "shì", "shàn", "néng"],
        ["dòng", "shàn", "shí"],
        ["fū", "wéi", "bù", "zhēng", "gù", "wú", "yóu"],
      ],
      variant: "乙本原文保留“有争 / 所亚 / 正善治” · 通行校读多作“不争 / 所恶 / 政善治” · 王弼本作“若水”",
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
          title: "你的人生说明书",
          body: "你习惯先回应世界，再照顾自己。把一小部分注意力留给内心真正的水位：此刻的顺应来自清醒，还是来自害怕失去？个性化结果会帮助你辨认两者，而不会替你做决定。",
        },
      ],
      action: "慢三次呼吸，再回应。把答案放慢一点，让真实的自己先出现。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text B · Received Chapter 8",
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
      variant: "Silk B preserves “there is contention / what people disdain” · Common collation reads “without contention” · Wang Bi begins “as water”",
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
          title: "Your life manual",
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
      eyebrow: "帛书乙本 · 对应今本第九章",
      title: "植而盈之",
      verse: [
        "植而盈之，不若其已；",
        "锻而允之，不可长葆也。",
        "金玉盈室，莫之能守也；",
        "贵富而骄，自遗咎也。",
        "功遂身退，天之道也。",
      ],
      pinyin: [
        ["zhí", "ér", "yíng", "zhī", "bù", "ruò", "qí", "yǐ"],
        ["duàn", "ér", "yǔn", "zhī", "bù", "kě", "cháng", "bǎo", "yě"],
        ["jīn", "yù", "yíng", "shì", "mò", "zhī", "néng", "shǒu", "yě"],
        ["guì", "fù", "ér", "jiāo", "zì", "yí", "jiù", "yě"],
        ["gōng", "suì", "shēn", "tuì", "tiān", "zhī", "dào", "yě"],
      ],
      variant: "本页直录乙本“植 / 锻而允 / 长葆 / 贵富” · 王弼本作“持 / 揣而锐 / 长保 / 富贵”",
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
          title: "你的人生说明书",
          body: "当你很容易把责任揽到自己身上，“功遂身退”是在练习信任：事情可以在没有你持续控制时继续运转。",
        },
      ],
      action: "今天为一件事设定“足够线”，到线就停，不再追加证明。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text B · Received Chapter 9",
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
          title: "Your life manual",
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
      eyebrow: "帛书乙本校补 · 对应今本第一章",
      title: "道可道也",
      verse: [
        "道可道也，非恒道也。",
        "名可名也，非恒名也。",
        "无名万物之始也；",
        "有名万物之母也。",
        "故恒无欲也，以观其妙；",
        "恒又欲也，以观其所噭。",
        "两者同出，异名同胃。",
        "玄之又玄，众眇之门。",
      ],
      pinyin: [
        ["dào", "kě", "dào", "yě", "fēi", "héng", "dào", "yě"],
        ["míng", "kě", "míng", "yě", "fēi", "héng", "míng", "yě"],
        ["wú", "míng", "wàn", "wù", "zhī", "shǐ", "yě"],
        ["yǒu", "míng", "wàn", "wù", "zhī", "mǔ", "yě"],
        ["gù", "héng", "wú", "yù", "yě", "yǐ", "guān", "qí", "miào"],
        ["héng", "yòu", "yù", "yě", "yǐ", "guān", "qí", "suǒ", "jiào"],
        ["liǎng", "zhě", "tóng", "chū", "yì", "míng", "tóng", "wèi"],
        ["xuán", "zhī", "yòu", "xuán", "zhòng", "miǎo", "zhī", "mén"],
      ],
      variant: "乙本有缺损，本页据甲本校补缺字；保留乙本“又 / 噭 / 胃 / 眇” · 王弼本作“有 / 徼 / 谓 / 妙”",
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
          title: "你的人生说明书",
          body: "人类图等工具可以成为观察你的镜子，却不应成为限制你的围墙。结果用来增加选择，不是替你做决定。",
        },
      ],
      action: "把一个“我就是……”改写成“我最近常常……”，给自己留出变化的余地。",
    },
    en: {
      eyebrow: "Mawangdui Silk Text B, lacunae supplied · Received Chapter 1",
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
          title: "Your life manual",
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
  children: ReactNode;
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

type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  language: Language;
  view: DrawerView;
  onViewChange: (view: DrawerView) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
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
  onVideoChannelOpen: () => void;
  onAdminOpen: () => void;
};

function SideDrawer({
  open,
  onClose,
  language,
  view,
  onViewChange,
  theme,
  onThemeChange,
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
  onVideoChannelOpen,
  onAdminOpen,
}: SideDrawerProps) {
  const isZh = language === "zh";
  const profileComplete = Boolean(chart?.chartHash);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const headerTitle = view === "home"
    ? (isZh ? "你的空间" : "Your space")
    : view === "profile"
      ? (isZh ? "人生说明书" : "Life manual")
      : view === "about"
        ? (isZh ? "关于问道" : "About Wendao")
        : (isZh ? "意见反馈" : "Feedback");

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
              onClick={() => onViewChange("home")}
            >
              <ArrowLeftIcon />
            </button>
          ) : <span className="drawer-orbit" aria-hidden="true" />}
          <div>
            <span className="drawer-brand">问道 · WENDAO</span>
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

        <div className="drawer-scroll">
          {view === "home" ? (
            <>
              <section className="life-manual-card">
                <span className="drawer-kicker">{isZh ? "你的人生说明书" : "Your life manual"}</span>
                <h3>
                  {profileComplete
                    ? (isZh ? `${profile.name || "你"}，说明书已生成` : `${profile.name || "Your"} manual is ready`)
                    : (isZh ? "从认识自己的起点开始" : "Begin with the facts of your birth")}
                </h3>
                <p>
                  {profileComplete
                    ? `${hdLabel(chart!.core.type, language)} · ${chart!.core.profile} · ${hdLabel(chart!.core.authority, language)}`
                    : (isZh
                      ? "出生日期、准确时间和地点，会成为个性化阅读的基础；问道不绘制人类图。"
                      : "Birth date, exact time, and place form the basis of your personal reading.")}
                </p>
                <button type="button" className="drawer-primary" onClick={() => onViewChange("profile")}>
                  <PersonIcon />
                  {profileComplete
                    ? (isZh ? "查看人生说明书" : "View life manual")
                    : (isZh ? "录入出生信息" : "Enter birth details")}
                </button>
              </section>

              <nav className="drawer-nav" aria-label={isZh ? "更多功能" : "More features"}>
                <button type="button" onClick={() => onViewChange("profile")}>
                  <span className="drawer-nav-icon"><PersonIcon /></span>
                  <span>
                    <strong>{isZh ? "人生说明书" : "Life manual"}</strong>
                    <small>{isZh ? "出生资料与个性化基础" : "Birth details and personalization"}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
                <div className="drawer-nav-row">
                  <span className="drawer-nav-icon">{theme === "dark" ? <MoonIcon /> : <SunIcon />}</span>
                  <span>
                    <strong>{isZh ? "夜间阅读" : "Night reading"}</strong>
                    <small>{isZh ? "降低亮度，保留纸墨层次" : "Lower luminance, keep the ink texture"}</small>
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
                <button type="button" onClick={() => onViewChange("about")}>
                  <span className="drawer-nav-icon"><InfoCircledIcon /></span>
                  <span>
                    <strong>{isZh ? "关于问道" : "About Wendao"}</strong>
                    <small>{isZh ? "我们如何理解原典与人生" : "How we approach text and life"}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
                <button type="button" onClick={() => onViewChange("feedback")}>
                  <span className="drawer-nav-icon"><ChatBubbleIcon /></span>
                  <span>
                    <strong>{isZh ? "意见反馈" : "Feedback"}</strong>
                    <small>{isZh ? "告诉我们哪里可以更好" : "Help us make the reading better"}</small>
                  </span>
                  <ChevronRightIcon />
                </button>
              </nav>
            </>
          ) : null}

          {view === "profile" ? (
            <form className="drawer-form" onSubmit={onProfileSave}>
              <p className="drawer-intro">
                {isZh
                  ? "问道会根据出生地点自动识别当地时区，并在产品内完成计算；只呈现类型、策略、权威等结果，不绘制人类图。出生时间越准确，解读越可靠。"
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
                  ? "隐私说明：出生地点会发送至地点查询服务以识别当地时区；出生资料将安全传送至问道，用于计算、保存你的人生说明书和改善产品，不会公开，也不会绘制人类图。"
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
                  <p>{personalizedAdvice(8, chart, language)}</p>
                  <small className="profile-cross">{isZh ? "轮回交叉" : "Incarnation cross"} · {chart.core.incarnationCross}</small>
                </section>
              ) : null}
            </form>
          ) : null}

          {view === "about" ? (
            <section className="drawer-prose">
              <span className="drawer-kicker">{isZh ? "真实自己，流动人生" : "True to yourself. Flow with life."}</span>
              <h3>{isZh ? "经典不是答案库，而是一面活的镜子。" : "A classic is not an answer bank. It is a living mirror."}</h3>
              <p>
                {isZh
                  ? "问道以马王堆帛书乙本为主要文本，王弼本及其他版本作为参照。我们会明确标出缺损、校补和异文，不把不同版本静默拼成一个“唯一原文”。"
                  : "Wendao uses Mawangdui Silk Text B as its primary witness, with Wang Bi and other editions for comparison. Lacunae, supplied text, and variants are identified rather than silently merged."}
              </p>
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
              <button type="button" className="admin-entry" onClick={onAdminOpen}>
                <LockClosedIcon />
                {isZh ? "数据后台" : "Admin"}
              </button>
            </section>
          ) : null}

          {view === "feedback" ? (
            <form className="drawer-feedback" onSubmit={onFeedbackSubmit}>
              <p className="drawer-intro">
                {isZh
                  ? "可以告诉我们原文、拼音、解释、设计或使用体验中任何不准确、不舒服的地方。"
                  : "Tell us what feels inaccurate or uncomfortable in the text, Pinyin, interpretation, design, or interaction."}
              </p>
              <label>
                <span>{isZh ? "你的反馈" : "Your feedback"}</span>
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
                    : (isZh ? "提交反馈" : "Submit feedback")}
              </button>
              <small className="feedback-note">
                {isZh ? "反馈会直接进入问道后台，不会跳转到其他网站。" : "Your feedback goes directly to Wendao. No external site opens."}
              </small>
              {feedbackError ? <p className="form-message is-error">{feedbackError}</p> : null}
            </form>
          ) : null}
        </div>

        <footer className="drawer-footer">
          {isZh ? "帛书乙本为主 · 王弼本及其他版本参照" : "Silk Text B first · Wang Bi and other editions compared"}
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
        <img src="/assets/wendao/video-channel.jpg" alt={language === "zh" ? "问道视频号二维码" : "Wendao WeChat Channels QR code"} />
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
          <span>问道 · WENDAO</span>
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
  const [language, setLanguage] = useState<Language>("zh");
  const [chapterId, setChapterId] = useState(8);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<DrawerView>("home");
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [isReadingScrolled, setIsReadingScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
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
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === "#data-admin");
  const clientId = useRef(stableId(CLIENT_ID_KEY));
  const sessionId = useRef(window.crypto.randomUUID());
  const appOpenTracked = useRef(false);
  const orderedChapters = useMemo(() => reorderFrom(chapterId), [chapterId]);
  const isZh = language === "zh";
  const activeCopy = chapters.find((chapter) => chapter.id === chapterId)?.[language] ?? chapters[0][language];
  const profileReady = Boolean(chart?.chartHash);

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
  }, [theme]);

  useEffect(() => {
    if (appOpenTracked.current) return;
    appOpenTracked.current = true;
    trackEvent("app_open", { source: "web" });
  }, []);

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
    trackEvent("chapter_view", { source: "directory" }, id);
    scrollReadingToTop();
  };

  const meetAChapter = () => {
    const candidates = chapters.filter((chapter) => chapter.id !== chapterId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setChapterId(next.id);
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
        ? "请先完成出生信息并生成人生说明书，问道才能结合你的真实结果回应。"
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
      await apiRequest<{ saved: boolean }>("/v1/profiles", {
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
      });
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      setChart(nextChart);
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      window.localStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(nextChart));
      setProfileState("saved");
      trackEvent("profile_saved", { source: "drawer" });
      trackEvent("chart_calculated", { value: nextChart.core.type });
    } catch (nextError) {
      setProfileState("error");
      const message = nextError instanceof Error ? nextError.message : "";
      setProfileError(message === "BIRTHPLACE_NOT_FOUND" || nextError instanceof DOMException
        ? (isZh
          ? "暂时无法识别这个出生地点，请填写更完整的“城市 + 国家或地区”后重试。"
          : "We couldn't identify this birthplace. Add the city and country or region, then try again.")
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
    setLanguage(nextLanguage);
    if (nextLanguage !== language) trackEvent("language_change", { value: nextLanguage });
  };

  const changeTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    trackEvent("theme_change", { value: nextTheme });
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
                      {copy.related
                        .filter((item) => profileReady || !isLifeManualItem(item))
                        .map((item) => (
                        <div className="related-item" key={item.title}>
                          <h2>{item.title}</h2>
                          <p>{isLifeManualItem(item) && chart ? personalizedAdvice(chapter.id, chart, language) : item.body}</p>
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
            <small>{isZh ? "帛书乙本为主 · 多版本互校" : "Silk Text B first · Versions compared"}</small>
          </footer>
        </main>
      </div>

      {!directoryOpen && !insightOpen && !drawerOpen ? (
        <form
          className={`ai-composer ${isReadingScrolled ? "is-reading" : ""}`}
          onSubmit={submitQuestion}
        >
          <span className="composer-spark" aria-hidden="true">✦</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onFocus={() => trackEvent("composer_focus", { source: "reading" })}
            placeholder={isZh ? "问问这一章与你的关系…" : "Ask how this chapter relates to you…"}
            aria-label={isZh ? "向问道提问" : "Ask Wendao"}
          />
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

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language={language}
        view={drawerView}
        onViewChange={setDrawerView}
        theme={theme}
        onThemeChange={changeTheme}
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
        onVideoChannelOpen={() => {
          setVideoChannelOpen(true);
          trackEvent("contact_click", { target: "视频号" });
        }}
        onAdminOpen={() => {
          setDrawerOpen(false);
          setAdminOpen(true);
          window.location.hash = "data-admin";
        }}
      />
      <VideoChannelModal open={videoChannelOpen} onClose={() => setVideoChannelOpen(false)} language={language} />
      <AdminConsole
        open={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          if (window.location.hash === "#data-admin") {
            window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          }
        }}
        language={language}
      />
    </>
  );
}
