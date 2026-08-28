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
    if (sessionStorage.getItem("wendao-app-store-capture-ready")) return;
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("wendao-app-store-capture-ready", "true");
  });
  const screenshotUrl = new URL(baseUrl);
  screenshotUrl.searchParams.set("chapter", "8");
  screenshotUrl.searchParams.set("lang", locale);
  await page.goto(screenshotUrl.toString(), { waitUntil: "networkidle" });
  await page.locator("[data-chapter-id='8']").first().waitFor();

  if (locale === "en") await page.getByText("Chapter 8", { exact: false }).first().waitFor();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][0]);

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
  const decisionHeading = page.getByRole("heading", { name: locale === "zh" ? "做决定时，怎样才算对自己诚实" : "How your best decisions feel" });
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
  await captureLocale(browser, "zh");
  await captureLocale(browser, "en");
} finally {
  await browser.close();
}

console.log("Captured 10 localized reading screenshots at 1290 × 2796; AI source screenshots are captured from an authenticated real conversation.");
