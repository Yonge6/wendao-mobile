import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { LifeStory } from '../src/lifeStoryShare';
const stories: LifeStory[] = JSON.parse(readFileSync(new URL('../growth/copy.json', import.meta.url), 'utf8'));

for (let chapter = 1; chapter <= 81; chapter++) {
  test(`chapter ${chapter} includes its primary comic or matching essays after its inspiration`, async ({ page }) => {
    await page.addInitScript(cid => localStorage.setItem('wendao-free-chapters-v1', JSON.stringify([cid])), chapter);
    await page.goto(`/?chapter=${chapter}&lang=zh&acceptance=1`);
    const article = page.locator('.chapter-current');
    const section = article.locator('.related-section + .life-stories-section');
    await expect(section.locator('.rail-label > span')).toHaveText('04');
    const matching = stories.filter(s => s.chapter === chapter);
    const comics = matching.filter(s => s.comic);
    const expected = comics.length ? comics : matching;
    await expect(section.locator('.chapter-life-story')).toHaveCount(expected.length);
    for (const story of expected) {
      const essay = section.locator(`[data-story-slug="${story.slug}"]`);
      await expect(essay.getByRole('heading', { name: story.title })).toHaveCount(story.comic ? 0 : 1);
      if (story.comic) {
        const image = essay.locator('.life-story-comic img');
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => [node.naturalWidth, node.naturalHeight])).toEqual([story.comic.width, story.comic.height]);
        await expect(essay.locator('.life-story-comic-style a')).toHaveAttribute('href', story.comic.style.url);
      }
      for (const text of [...story.paragraphs, story.quote, story.practice]) await expect(essay).toContainText(text);
      await expect(essay.getByRole('button', { name: '分享链接', exact: true })).toHaveCount(0);
      await expect(essay.getByRole('button', { name: '分享这一层', exact: true })).toHaveCount(1);
    }
  });
}

for (const lang of ['zh', 'en']) {
  test(`reader shares the chapter story, restores scroll and resets chapter sharing: ${lang}`, async ({ page, context }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: lang === 'zh' ? 390 : 1100, height: 844 });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      localStorage.setItem('wendao-free-chapters-v1', '[8]');
      localStorage.setItem('wendao-theme', 'dark');
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.goto(`/?chapter=8&lang=${lang}&acceptance=1`);
    const section = page.locator('.chapter-current .life-stories-section');
    if (lang === 'en') await expect(section).toContainText('Essays in Chinese');
    const matching = stories.filter(s => s.chapter === 8);
    const story = matching.find(s => s.comic) ?? matching[0];
    const essay = section.locator(`[data-story-slug="${story.slug}"]`);
    await expect(essay.getByRole('button', { name: lang === 'zh' ? '分享这一层' : 'Share this layer', exact: true })).toHaveCount(1);
    await essay.getByRole('button', { name: lang === 'zh' ? '分享这一层' : 'Share this layer', exact: true }).click();
    const scroll = await page.getByTestId('mobile-scroll').evaluate(e => e.scrollTop);
    const sheet = page.getByRole('dialog', { name: lang === 'zh' ? '分享这篇文章' : 'Share this essay' });
    await expect(sheet.locator('.share-card-preview img')).toBeVisible({ timeout: 15000 });
    const label = await sheet.locator('figure').getAttribute('aria-label');
    for (const text of [...story.paragraphs, story.practice, story.quote]) expect(label).toContain(text);
    await expect(page.locator('.ai-composer')).toHaveCount(0);
    await sheet.getByRole('button', { name: lang === 'zh' ? '分享链接' : 'Share link', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`https://wendao.wonderelian.com/situations/${story.slug}/`);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    expect(await page.getByTestId('mobile-scroll').evaluate(e => e.scrollTop)).toBe(scroll);
    await expect(page.locator('.ai-composer')).toBeVisible();
    await page.locator('.chapter-current .chapter-share-quick').click();
    const chapterSheet = page.getByRole('dialog', { name: lang === 'zh' ? '分享这一章' : 'Share this chapter' });
    await expect(chapterSheet.getByRole('tablist')).toBeVisible();
    await expect(chapterSheet.locator('figure')).not.toHaveAttribute('aria-label', new RegExp(story.title));
    await page.keyboard.press('Escape');
    await section.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
