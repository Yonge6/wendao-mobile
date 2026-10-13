import { expect, test, type Page, type Route } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const qaDirectory = path.resolve("work/qa-20261013");
mkdirSync(qaDirectory, { recursive: true });
const storySlug = "a-label-is-not-a-whole-person";
const comicOriginal = "/assets/wendao/comics/chapter-32-art-nouveau-qr.png";
const originalHash = createHash("sha256").update(readFileSync(path.resolve(`public${comicOriginal}`))).digest("hex");

async function prepare(page: Page, language = "zh", theme = "light", chapter = 32) {
  await page.addInitScript(({ theme }) => {
    localStorage.setItem("wendao-theme", theme);
    localStorage.setItem("wendao-free-chapters-v1", "[32]");
    sessionStorage.setItem("wendao-app-banner-dismissed", "1");
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  }, { theme });
  await page.goto(`/?chapter=${chapter}&section=stories&lang=${language}&acceptance=1`);
  await expect(page.locator(".reading-header")).toBeVisible();
}
async function openStories(page: Page, language = "zh") {
  await page.getByRole("button", { name: language === "zh" ? "打开更多功能" : "Open more" }).click();
  await page.locator(".side-drawer").getByRole("button", { name: /生活里的道|Tao in everyday life/ }).click();
  await expect(page.locator(".drawer-stories")).toBeVisible();
}
async function openChapter32Story(page: Page, language = "zh") {
  await openStories(page, language);
  await page.getByRole("combobox", { name: language === "zh" ? "章次" : "Chapter", exact: true }).selectOption("32");
  await page.locator('.drawer-story-card[data-chapter-id="32"]').click();
  await expect(page.locator(".drawer-story-detail")).toBeVisible();
}
async function openInlineComic(page: Page) {
  await page.locator(`.chapter-current [data-story-slug="${storySlug}"] .comic-media`).scrollIntoViewIfNeeded();
  const comic = page.locator(`.chapter-current [data-story-slug="${storySlug}"] .comic-media-image`);
  await expect.poll(() => comic.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth)).toBe(1024);
  await page.locator(`.chapter-current [data-story-slug="${storySlug}"]`).getByRole("button", { name: /^放大阅读漫画/ }).click();
  const sheet = page.getByRole("dialog", { name: "分享这篇文章" });
  await expect(sheet).toBeVisible();
  return sheet;
}

for (const language of ["zh", "en"]) for (const theme of ["light", "dark"]) {
  test(`390px ${language} ${theme}: drawer reflection, quotation and practice retain readable contrast`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page, language, theme);
    await openChapter32Story(page, language);
    await page.locator(".drawer-story-detail details summary").click();
    const details = page.locator(".drawer-story-detail details");
    await expect(details).toHaveAttribute("open", "");
    const ratios = await details.evaluate(element => {
      const rgba = (color: string) => color.match(/[\d.]+/g)!.map(Number);
      const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      const paper = document.createElement("span");
      paper.style.color = "var(--paper)";
      element.append(paper);
      const base = rgba(getComputedStyle(paper).color);
      paper.remove();
      const background = luminance(base);
      return [...element.querySelectorAll("div > p, blockquote p, cite, .drawer-story-practice > p, .drawer-story-practice > span")].map(node => {
        const foreground = luminance(rgba(getComputedStyle(node).color));
        return { ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05), label: node.matches(".drawer-story-practice > span") };
      });
    });
    expect(ratios.length).toBeGreaterThan(4);
    for (const { ratio, label } of ratios) expect(ratio).toBeGreaterThanOrEqual(label && theme === "light" ? 3 : 4.5);
    await page.locator(".drawer-story-practice").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(qaDirectory, `drawer-practice-${language}-${theme}-390.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("81-comic collection filters by chapter/theme/search, returns to the same list and preserves legacy essays", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await openStories(page);
  await expect(page.locator(".drawer-story-card")).toHaveCount(81);
  await expect(page.locator(".story-results")).toHaveText("找到 81 篇");
  await page.getByRole("combobox", { name: "章次", exact: true }).selectOption("32");
  await expect(page.locator(".drawer-story-card")).toHaveCount(1);
  await page.getByLabel("搜索漫画和随笔").fill("类型");
  await expect(page.locator(".drawer-story-card")).toHaveCount(1);
  await page.getByRole("combobox", { name: "主题", exact: true }).selectOption({ label: "学习与自知" });
  await page.locator(".drawer-story-card").click();
  await page.locator(".side-drawer").getByRole("button", { name: "返回", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "章次", exact: true })).toHaveValue("32");
  await expect(page.getByLabel("搜索漫画和随笔")).toHaveValue("类型");
  await expect(page.locator(".drawer-story-card")).toHaveCount(1);
  await page.screenshot({ path: path.join(qaDirectory, "comic-filter-32-390.png") });
  await page.getByRole("combobox", { name: "章次", exact: true }).selectOption("");
  await page.getByRole("combobox", { name: "主题", exact: true }).selectOption("");
  await page.getByLabel("搜索漫画和随笔").fill("");
  await page.getByRole("button", { name: "随笔", exact: true }).click();
  expect(await page.locator(".drawer-story-card").count()).toBeGreaterThan(0);
  await expect(page.locator(".drawer-story-thumbnail")).toHaveCount(0);
  await expect(page.locator(".drawer-story-card").first()).toContainText("随笔");
});

test("inline and enlarged previews request WebP only; saving downloads the exact complete PNG", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on("request", request => { if (/\/comics\/.+\.(png|webp)$/.test(new URL(request.url()).pathname)) requests.push(request.url()); });
  await prepare(page);
  const sheet = await openInlineComic(page);
  await expect(sheet.locator(".comic-media-image")).toBeVisible();
  await expect.poll(() => sheet.locator(".comic-media-image").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1024);
  await sheet.getByRole("button", { name: /放大阅读/ }).click();
  expect(await sheet.getByTestId("share-card-preview-scroll").evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(requests.some(url => url.endsWith(".webp"))).toBe(true);
  expect(requests.filter(url => url.endsWith(".png"))).toHaveLength(0);
  await page.screenshot({ path: path.join(qaDirectory, "enlarged-webp-preview-390.png") });
  const pending = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "保存图片", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(`wendao-story-${storySlug}.png`);
  expect(createHash("sha256").update(readFileSync((await download.path())!)).digest("hex")).toBe(originalHash);
  expect(requests.filter(url => url.endsWith(".png"))).toHaveLength(1);
});

test("stalled original can be cancelled and retried without blocking reader controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const stalled: Route[] = [];
  let first = true;
  await page.route(`**${comicOriginal}`, route => {
    if (first) { first = false; stalled.push(route); return; }
    return route.continue();
  });
  await prepare(page);
  const sheet = await openInlineComic(page);
  await sheet.getByRole("button", { name: "分享图片", exact: true }).click();
  await expect(sheet.locator(".share-download-state")).toContainText("正在准备完整原图");
  await expect(sheet.getByRole("button", { name: "复制文字", exact: true })).toBeEnabled();
  await page.screenshot({ path: path.join(qaDirectory, "original-download-cancel-390.png") });
  await sheet.getByRole("button", { name: "取消下载", exact: true }).click();
  await expect(sheet.locator(".share-download-state")).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "分享图片", exact: true })).toBeEnabled();
  for (const route of stalled) await route.abort().catch(() => undefined);
  const pending = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "分享图片", exact: true }).click();
  expect((await pending).suggestedFilename()).toBe(`wendao-story-${storySlug}.png`);
});

test("recent WebP opens offline; clearing it exposes offline guidance and image retry recovers", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  let sheet = await openInlineComic(page);
  await expect.poll(() => sheet.locator(".comic-media-image").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1024);
  await page.keyboard.press("Escape");
  await context.setOffline(true);
  sheet = await openInlineComic(page);
  await expect.poll(() => sheet.locator(".comic-media-image").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1024);
  await page.screenshot({ path: path.join(qaDirectory, "offline-cached-comic-390.png") });
  await sheet.getByRole("button", { name: "保存图片", exact: true }).click();
  await expect(sheet.locator(".share-download-state.is-error")).toContainText("当前离线");
  await page.keyboard.press("Escape");
  await context.setOffline(false);
  await page.getByRole("button", { name: "打开更多功能" }).click();
  await expect(page.locator(".drawer-cache-controls small")).toContainText("1 张");
  await page.getByRole("button", { name: "清除漫画缓存", exact: true }).click();
  await expect(page.locator(".drawer-cache-controls")).toContainText("漫画缓存已清除");
  await expect(page.locator(".drawer-cache-controls small")).toContainText("0 张");
  await page.locator(".side-drawer").getByRole("button", { name: "关闭菜单", exact: true }).click();
  await context.setOffline(true);
  sheet = await openInlineComic(page);
  await expect(sheet.locator(".comic-media.is-offline")).toContainText("这幅漫画尚未缓存");
  await page.screenshot({ path: path.join(qaDirectory, "offline-uncached-retry-390.png") });
  await context.setOffline(false);
  await sheet.getByRole("button", { name: "重新载入", exact: true }).click();
  await expect.poll(() => sheet.locator(".comic-media-image").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1024);
});

test("desktop story detail uses a 720px drawer while the surrounding reader remains within its viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await prepare(page, "en");
  await openChapter32Story(page, "en");
  await expect(page.locator(".side-drawer")).toHaveCSS("width", "720px");
  await expect(page.locator(".drawer-story-detail .comic-media-image")).toBeVisible();
  await page.screenshot({ path: path.join(qaDirectory, "desktop-comic-drawer-1280.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("directory supports both orders without consuming a free chapter and collation is an explicit disclosure", async ({ page }) => {
  await prepare(page);
  const freeBefore = await page.evaluate(() => localStorage.getItem("wendao-free-chapters-v1"));
  const collation = page.locator(".chapter-current .collation-details");
  await expect(collation).not.toHaveAttribute("open", "");
  await collation.locator("summary").click();
  await expect(collation).toHaveAttribute("open", "");
  await expect(collation.locator(".transcription-layer")).toBeVisible();
  await collation.locator("summary").click();
  await page.getByRole("button", { name: "目录", exact: true }).click();
  const directory = page.getByRole("dialog", { name: "目录", exact: true });
  await expect(directory.locator(".directory-item")).toHaveCount(81);
  await expect(directory.locator(".directory-item").first()).toHaveAttribute("data-chapter-id", "38");
  await directory.getByRole("button", { name: "今本章次", exact: true }).click();
  await expect(directory.locator(".directory-item").first()).toHaveAttribute("data-chapter-id", "1");
  await directory.getByRole("button", { name: "帛书次序", exact: true }).click();
  await expect(directory.locator(".directory-item").first()).toHaveAttribute("data-chapter-id", "38");
  await directory.getByRole("searchbox", { name: "搜索章节", exact: true }).fill("第32章");
  await expect(directory.locator('.directory-item[data-chapter-id="32"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wendao-free-chapters-v1"))).toBe(freeBefore);
  await page.screenshot({ path: path.join(qaDirectory, "directory-orders-search.png") });
});

test("anonymous lifetime intent opens benefits and selected plan before sign-in, without entering a conversation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, "en", "light", 1);
  await page.getByRole("button", { name: "Unlock every chapter forever", exact: false }).click();
  const purchase = page.getByRole("dialog", { name: "Reading and membership", exact: true });
  await expect(purchase).toBeVisible();
  await expect(purchase.locator(".companion-plans .is-lifetime")).toHaveAttribute("aria-pressed", "true");
  await expect(purchase.locator(".companion-plans .is-lifetime strong")).toHaveText("Unlock all 81 forever");
  await expect(purchase.locator(".companion-plans .is-featured strong")).toHaveText("Annual");
  await expect(purchase.locator(".companion-subscription")).toContainText("3 free questions each day");
  await expect(purchase.locator(".companion-subscription")).toContainText("AI, memory, and weekly reflection are not included");
  await expect(purchase.locator(".companion-composer")).toHaveCount(0);
  await page.screenshot({ path: path.join(qaDirectory, "anonymous-lifetime-intent-en-390.png") });
});
