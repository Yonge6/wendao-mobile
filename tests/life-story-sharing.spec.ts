import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { LifeStory } from "../src/lifeStoryShare";
const stories = JSON.parse(readFileSync(new URL("../growth/copy.json", import.meta.url), "utf8")) as LifeStory[];

for (const language of ["zh", "en"] as const) {
  test(`article shares its own link and complete poster, retaining reading position: ${language}`, async ({ page, context }) => {
    await page.setViewportSize({ width: language === "zh" ? 390 : 1100, height: 844 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
    await page.goto(`/?lang=${language}&acceptance=1`);
    await page.getByRole("button", { name: language === "zh" ? "打开更多功能" : "Open more" }).click();
    await page.getByRole("button", { name: /生活里的道|Tao in everyday life/ }).click();
    for (const story of stories) {
      await page.getByRole("button", { name: new RegExp(story.title) }).click();
      await page.getByRole("button", { name: language === "zh" ? "分享链接" : "Share link", exact: true }).click();
      const url = `https://wendao.wonderelian.com/situations/${story.slug}/`;
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(url);
      await expect(page.locator(".drawer-story-feedback")).toContainText(language === "zh" ? "文章链接已复制" : "Article link copied");
      await page.getByRole("button", { name: language === "zh" ? "分享图片" : "Share image", exact: true }).click();
      const sheet = page.getByRole("dialog", { name: language === "zh" ? "分享这篇文章" : "Share this essay" });
      const image = sheet.locator(".share-card-preview img");
      await expect(image).toBeVisible({ timeout: 15000 });
      await expect(sheet.getByRole("tablist")).toHaveCount(0);
      const text = await sheet.locator("figure").getAttribute("aria-label");
      for (const paragraph of [...story.paragraphs, story.quote, story.practice]) expect(text).toContain(paragraph);
      expect(await image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(1080);
      expect(await image.evaluate((e: HTMLImageElement) => e.naturalHeight)).toBeGreaterThan(2160);
      await sheet.getByRole("button", { name: language === "zh" ? "分享链接" : "Share link", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(url);
      const download = page.waitForEvent("download");
      await sheet.getByRole("button", { name: language === "zh" ? "保存图片" : "Save image", exact: true }).click();
      expect((await download).suggestedFilename()).toBe(`wendao-story-${story.slug}.png`);
      await sheet.getByRole("button", { name: "关闭", exact: true }).click();
      await expect(page.getByRole("heading", { name: story.title })).toBeVisible();
      await page.locator(".drawer-scroll").evaluate(e => { e.scrollTop = 320; });
      const scroll = await page.locator(".drawer-scroll").evaluate(e => e.scrollTop);
      // Open using keyboard after focusing without scrolling the underlying reader.
      await page.locator(".drawer-story-share-actions button").last().evaluate((e: HTMLButtonElement) => e.focus({ preventScroll: true }));
      await page.keyboard.press("Enter");
      await expect(sheet).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      expect(await page.locator(".drawer-scroll").evaluate(e => e.scrollTop)).toBe(scroll);
      await page.getByRole("button", { name: language === "zh" ? "返回" : "Back", exact: true }).click();
    }
  });
}
