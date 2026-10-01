import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const stories = JSON.parse(readFileSync(new URL('../growth/copy.json', import.meta.url), 'utf8'));
const english = JSON.parse(readFileSync(new URL('../growth/copy-en.json', import.meta.url), 'utf8'));
const slug = 'a-label-is-not-a-whole-person';

test('language selects both the comic WebP and the share PNG without mutating the Chinese original', async ({ page }) => {
  await page.goto('/?chapter=32&lang=zh&acceptance=1');
  const result = await page.evaluate(async ({ source, translation }) => {
    // Fixture paths exercise selection only; they are not generated or published assets.
    const { localizeLifeStory } = await import('/src/lifeStoryLocale.ts');
    const { buildLifeStoryShareCardContent } = await import('/src/lifeStoryShare.ts');
    const dictionary = { [source.slug]: { ...translation, comic: {
      image: '/english-fixture.webp', original: '/english-fixture.png', width: 1024, height: 3336,
    } } };
    const before = JSON.stringify(source);
    const en = localizeLifeStory(source, 'en', dictionary);
    const zh = localizeLifeStory(source, 'zh', dictionary);
    const { comic: omitted, ...withoutImage } = translation;
    const missing = localizeLifeStory(source, 'en', { [source.slug]: withoutImage });
    return { en, zh, missing, enShare: buildLifeStoryShareCardContent(en), zhShare: buildLifeStoryShareCardContent(zh), unchanged: before === JSON.stringify(source) };
  }, { source: stories.find((s: { slug: string }) => s.slug === slug), translation: english[slug] });
  expect(result.en.comic.image).toBe('/english-fixture.webp');
  expect(result.enShare.imageSource).toBe('/english-fixture.png');
  expect(result.enShare.url).toBe(`https://wendao.wonderelian.com/situations/${slug}/en/`);
  expect(result.enShare.language).toBe('en');
  expect(result.enShare.filename).toBe(`wendao-story-${slug}-en.png`);
  expect(result.enShare.shareText).toContain(english[slug].practice);
  expect(new URL(result.en.comic.style.url).searchParams.get('lang')).toBe('en');
  expect(result.zh.comic.original).toBe(result.zhShare.imageSource);
  expect(result.zhShare.url).toBe(`https://wendao.wonderelian.com/situations/${slug}/`);
  expect(result.missing.comic).toBeUndefined();
  expect(result.missing.language).toBe('en');
  expect(result.unchanged).toBe(true);
});

test('English reflection, drawer, copy and public article stay in English; Chinese reading remains available', async ({ page, context }) => {
  test.setTimeout(45000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('wendao-free-chapters-v1', '[32]');
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await page.goto('/?chapter=32&section=stories&lang=en&acceptance=1');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const story = page.locator(`.chapter-current [data-story-slug="${slug}"]`);
  await expect(story).toHaveAttribute('lang', 'en');
  for (const paragraph of english[slug].paragraphs) await expect(story).toContainText(paragraph);
  await expect(story).toContainText('A little room for today');
  await expect(story).not.toContainText('Essays in Chinese');
  if (english[slug].comic) {
    const image = story.locator('.life-story-comic img');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('src', english[slug].comic.image);
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalHeight)).toBe(3336);
    await story.getByText('Read the comic reflection', { exact: true }).click();
    await expect(story.locator('.chapter-life-story-body')).toBeVisible();
  }
  await story.getByRole('button', { name: 'Share this layer' }).click();
  const sheet = page.getByRole('dialog', { name: 'Share this essay' });
  await expect(sheet.locator('.share-card-preview img')).toBeVisible({ timeout: 20000 });
  expect(await sheet.locator('figure').getAttribute('aria-label')).toContain(english[slug].paragraphs[0]);
  if (english[slug].comic) {
    const downloading = page.waitForEvent('download');
    await sheet.getByRole('button', { name: 'Save image', exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(`wendao-story-${slug}-en.png`);
    const actual = createHash('sha256').update(readFileSync((await download.path())!)).digest('hex');
    const expected = createHash('sha256').update(readFileSync(new URL(`../public${english[slug].comic.original}`, import.meta.url))).digest('hex');
    expect(actual).toBe(expected);
  }
  await sheet.getByRole('button', { name: 'Share link', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`https://wendao.wonderelian.com/situations/${slug}/en/`);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open more' }).click();
  await page.getByRole('button', { name: /Tao in everyday life/ }).click();
  await page.locator('.drawer-story-card').filter({ hasText: english[slug].title }).click();
  await expect(page.locator('.drawer-story-detail')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.drawer-story-detail')).toContainText(english[slug].paragraphs[0]);
  await page.goto(`/situations/${slug}/en/index.html`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#reading-body')).toContainText(english[slug].paragraphs[0]);
  await expect(page.locator('.app-download-banner')).toContainText('Get the app');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://wendao.wonderelian.com/situations/${slug}/en/`);
  await expect(page.getByRole('link', { name: '中文', exact: true })).toHaveAttribute('href', new RegExp(`/situations/${slug}/$`));
  await page.goto(`/situations/${slug}/index.html`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#reading-body img')).toHaveAttribute('src', /chapter-32-art-nouveau-qr.webp/);
});
