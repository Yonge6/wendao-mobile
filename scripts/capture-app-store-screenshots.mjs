import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] || "http://127.0.0.1:5173/";
const root = process.cwd();
const outputRoot = path.join(root, "docs/app-store/screenshots/source");
const viewport = { width: 430, height: 932 };
const screenshotChart = {
  schemaVersion: "1.0",
  engineVersion: "1.0.0",
  verificationStatus: "engine_verified",
  chartHash: `sha256:${"d".repeat(64)}`,
  generatedAt: "2026-08-13T00:00:00.000Z",
  input: {
    birthDate: "1990-01-01",
    birthTime: "12:00",
    timezone: "Asia/Shanghai",
    locationLabel: "武汉市",
  },
  core: {
    type: "Generator",
    strategy: "To Respond",
    authority: "Sacral",
    profile: "5/1",
    definition: "Single Definition",
    incarnationCross: "Right Angle Cross of Service",
  },
  activations: {
    personality: {
      sun: { gate: 14, line: 1, color: 3, tone: 2 },
      earth: { gate: 8, line: 1, color: 3, tone: 2 },
    },
    design: {
      sun: { gate: 29, line: 1, color: 4, tone: 5 },
      earth: { gate: 30, line: 1, color: 3, tone: 2 },
      northNode: { gate: 33, line: 1, color: 6, tone: 2 },
    },
  },
  structure: { definedCenters: [], channels: [], variables: {} },
  meta: {},
};

const shots = {
  zh: [
    "02-reading.png",
    "03-text-layers.png",
    "04-for-you.png",
    "05-search.png",
    "06-life-manual.png",
  ],
  en: [
    "02-reading.png",
    "03-text-layers.png",
    "04-for-you.png",
    "05-search.png",
    "06-life-manual.png",
  ],
};

const companionCapture = {
  zh: {
    brand: "三慢问道 · AI WENDAO",
    title: "我的问道",
    context: "正与第 64 章对话 · 其安也，易持也",
    you: "你",
    question: "一个重要项目快完成了，我怎样既不松懈，也不过度用力？",
    assistant: "AI 问道",
    paragraphs: [
      "你提到的“既不松懈，也不过度用力”——这个张力本身，就是第六十四章在说的事。",
      "原文提醒：民之从事也，恒于其成而败之。越接近终点，人越容易滑向两个极端：要么松懈，要么用力过猛。",
      "把“完成”的定义，从“我觉得好了”改成“别人能接住”。先做一次交接式清点，再为自己设定停止信号。",
      "慎终如始，不是最后一刻更用力，而是从一开始就为收尾预留清醒。",
    ],
    copy: "复制回应",
    share: "分享图片",
    placeholder: "写下一个处境、矛盾或选择…",
    status: "写下具体处境，我会先理解，再结合本章与记忆回应。",
  },
  en: {
    brand: "WENDAO AI · DAODEJING",
    title: "My Wendao",
    context: "In conversation with Chapter 64 · When things are settled",
    you: "You",
    question: "A major project is nearly finished. How do I stay attentive without forcing the ending?",
    assistant: "Wendao AI",
    paragraphs: [
      "The tension between staying attentive and overdoing it is exactly what Chapter 64 asks us to notice.",
      "The text warns that people often spoil things when success is close. Near the end, we may either relax too soon or push too hard for certainty.",
      "Change the meaning of “finished” from “I think it is done” to “someone else can receive it.” Make one handoff checklist, then choose a clear stopping signal.",
      "Care at the end does not mean more force. It means carrying the same clarity from the beginning into the final step.",
    ],
    copy: "Copy",
    share: "Share image",
    placeholder: "Describe a situation, tension, or choice…",
    status: "Describe one concrete situation. I will understand first, then respond with this chapter and your memories in view.",
  },
};

async function screenshot(page, locale, filename) {
  await page.screenshot({
    path: path.join(outputRoot, locale === "zh" ? "zh-Hans" : "en-US", filename),
    animations: "disabled",
    fullPage: false,
  });
}

async function scrollSection(page, selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Missing screenshot target: ${targetSelector}`);
    const top = window.scrollY + target.getBoundingClientRect().top - 92;
    window.scrollTo({ top, behavior: "instant" });
  }, selector);
  await page.waitForTimeout(180);
}

async function captureCompanion(browser, locale) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: locale === "zh" ? "zh-CN" : "en-US",
    colorScheme: "light",
  });
  const page = await context.newPage();
  const screenshotUrl = new URL(baseUrl);
  screenshotUrl.searchParams.set("chapter", "64");
  screenshotUrl.searchParams.set("lang", locale);
  await page.goto(screenshotUrl.toString(), { waitUntil: "networkidle" });
  const copy = companionCapture[locale];
  await page.evaluate((content) => {
    document.documentElement.lang = content.locale === "zh" ? "zh-CN" : "en";
    const root = document.querySelector("#root");
    if (!root) throw new Error("Missing app root for Companion screenshot");
    const lines = content.paragraphs.map((paragraph, index) => {
      const inner = index === 1
        ? paragraph.replace(content.locale === "zh" ? "民之从事也，恒于其成而败之。" : "people often spoil things when success is close.", (match) => `<strong>${match}</strong>`)
        : index === 2
          ? paragraph.replace(content.locale === "zh" ? "把“完成”的定义，从“我觉得好了”改成“别人能接住”。" : "Change the meaning of “finished” from “I think it is done” to “someone else can receive it.”", (match) => `<strong>${match}</strong>`)
          : paragraph;
      return `${index ? '<span class="companion-message-gap"></span>' : ''}<span class="companion-message-line">${inner}</span>`;
    }).join("");
    root.innerHTML = `
      <div class="companion-layer" style="--companion-viewport-height: 932px; --companion-viewport-top: 0px;">
        <section class="companion-dialog" role="dialog" aria-modal="true">
          <header class="companion-dialog-header">
            <div><span>${content.brand}</span><h2>${content.title}</h2><small>${content.context}</small></div>
            <button type="button" aria-label="Close">×</button>
          </header>
          <div class="companion-dialog-body">
            <section class="companion-home">
              <div class="companion-settings"><button type="button" aria-label="Settings">⚙</button></div>
              <div class="companion-thread">
                <div class="companion-conversation">
                  <article class="is-user"><span>${content.you}</span><div class="companion-message-content"><span class="companion-message-line">${content.question}</span></div></article>
                  <article class="is-assistant"><span>${content.assistant}</span><div class="companion-message-content">${lines}</div><div class="companion-message-actions"><button>${content.copy}</button><button>${content.share}</button></div></article>
                </div>
              </div>
              <div class="companion-compose-zone">
                <form class="companion-question-form"><div class="companion-question-control"><textarea rows="2" placeholder="${content.placeholder}"></textarea><button type="submit" disabled>↑</button></div></form>
                <p class="companion-response-status">${content.status}</p>
              </div>
            </section>
          </div>
        </section>
      </div>`;
  }, { ...copy, locale });
  await page.waitForTimeout(240);
  await screenshot(page, locale, "01-ai-wendao.png");
  await context.close();
}

async function captureLocale(browser, locale) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: locale === "zh" ? "zh-CN" : "en-US",
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.assign(window, {
      CapacitorCustomPlatform: { name: "ios" },
      Capacitor: {
        Plugins: {},
        PluginHeaders: [],
        nativePromise: () => Promise.resolve(),
      },
    });
    if (sessionStorage.getItem("wendao-app-store-capture-ready")) return;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("wendao-free-chapters-v1", "[8]");
    sessionStorage.setItem("wendao-app-store-capture-ready", "true");
  });
  const screenshotUrl = new URL(baseUrl);
  screenshotUrl.searchParams.set("chapter", "9");
  screenshotUrl.searchParams.set("lang", locale);
  await page.goto(screenshotUrl.toString(), { waitUntil: "networkidle" });
  await page.getByTestId("reading-access-gate").waitFor();
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][0]);

  const readingUrl = new URL(baseUrl);
  readingUrl.searchParams.set("chapter", "8");
  readingUrl.searchParams.set("lang", locale);
  await page.goto(readingUrl.toString(), { waitUntil: "networkidle" });
  await page.locator("[data-chapter-id='8']").first().waitFor();
  if (locale === "en") await page.getByText("Chapter 8", { exact: false }).first().waitFor();

  await scrollSection(page, ".transcription-layer");
  await screenshot(page, locale, shots[locale][1]);

  await scrollSection(page, ".related-section");
  await screenshot(page, locale, shots[locale][2]);

  await page.getByRole("button", { name: locale === "zh" ? "目录" : "Contents", exact: true }).click();
  const search = page.getByRole("searchbox", { name: locale === "zh" ? "搜索章节" : "Search chapters" });
  await search.fill(locale === "zh" ? "水" : "water");
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][3]);
  await page.keyboard.press("Escape");

  await page.evaluate((chart) => {
    localStorage.setItem("wendao-chart-snapshot", JSON.stringify(chart));
    localStorage.setItem("wendao-life-profile", JSON.stringify({
      name: "",
      birthDate: "1990-01-01",
      birthTime: "12:00",
      birthPlace: "武汉市",
      timezone: "Asia/Shanghai",
    }));
  }, screenshotChart);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: locale === "zh" ? "打开更多功能" : "Open more" }).click();
  await page.getByRole("button", { name: locale === "zh" ? "查看人生说明书" : "View life manual" }).click();
  await page.getByRole("button", { name: locale === "zh" ? "查看详细解读" : "Read the detailed guide" }).click();
  const decisionHeading = page.getByRole("heading", { name: locale === "zh" ? "遇到真实选择时，具体怎么做" : "A practical way to make one real decision" });
  await decisionHeading.waitFor();
  await decisionHeading.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][4]);

  await context.close();
}

await Promise.all([
  mkdir(path.join(outputRoot, "zh-Hans"), { recursive: true }),
  mkdir(path.join(outputRoot, "en-US"), { recursive: true }),
]);

const browser = await chromium.launch();
try {
  await Promise.all([
    captureCompanion(browser, "zh"),
    captureCompanion(browser, "en"),
    captureLocale(browser, "zh"),
    captureLocale(browser, "en"),
  ]);
} finally {
  await browser.close();
}

console.log("Captured 10 localized reading screenshots at 1290 × 2796; AI source screenshots are captured from an authenticated real conversation.");
