import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] || "http://127.0.0.1:5173/";
const root = process.cwd();
const outputRoot = path.join(root, "docs/app-store/screenshots/source");
const viewport = { width: 430, height: 932 };

const shots = {
  zh: [
    "01-reading.png",
    "02-text-layers.png",
    "03-line-by-line.png",
    "04-for-you.png",
    "05-search.png",
    "06-life-manual.png",
  ],
  en: [
    "01-reading.png",
    "02-text-layers.png",
    "03-line-by-line.png",
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
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-chapter-id='8']").first().waitFor();

  if (locale === "en") {
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByText("Chapter 8", { exact: false }).first().waitFor();
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][0]);

  await scrollSection(page, ".transcription-layer");
  await screenshot(page, locale, shots[locale][1]);

  await scrollSection(page, locale === "zh" ? ".line-by-line-reading" : ".explanation-section");
  await screenshot(page, locale, shots[locale][2]);

  await scrollSection(page, ".related-section");
  await screenshot(page, locale, shots[locale][3]);

  await page.getByRole("button", { name: locale === "zh" ? "目录" : "Contents", exact: true }).click();
  const search = page.getByRole("searchbox", { name: locale === "zh" ? "搜索章节" : "Search chapters" });
  await search.fill(locale === "zh" ? "水" : "water");
  await page.waitForTimeout(180);
  await screenshot(page, locale, shots[locale][4]);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: locale === "zh" ? "打开更多功能" : "Open more" }).click();
  await page.locator(".side-drawer").waitFor();
  await screenshot(page, locale, shots[locale][5]);

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

console.log("Captured 12 localized source screenshots at 1290 × 2796.");
