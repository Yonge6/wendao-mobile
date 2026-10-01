import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const slug = 'a-label-is-not-a-whole-person';
const source = readFileSync(new URL('../public/assets/wendao/comics/chapter-32-art-nouveau-qr.png', import.meta.url));
for (const theme of ['light', 'dark']) {
  test(`comic reading, enlargement and exact PNG sharing on mobile: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(mode => {
      localStorage.setItem('wendao-free-chapters-v1', '[32]');
      localStorage.setItem('wendao-theme', mode);
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    }, theme);
    await page.goto('/?chapter=32&lang=zh&acceptance=1');
    const story = page.locator(`.chapter-current [data-story-slug="${slug}"]`);
    const comic = story.locator('.life-story-comic img');
    await comic.scrollIntoViewIfNeeded();
    await expect.poll(() => comic.evaluate((img: HTMLImageElement) => img.naturalHeight)).toBe(3336);
    await expect(story.locator('details')).not.toHaveAttribute('open', '');
    await story.getByText('查看漫画解读', { exact: true }).click();
    await expect(story.locator('.chapter-life-story-body')).toBeVisible();
    await story.getByText('查看漫画解读', { exact: true }).click();
    await story.getByRole('button', { name: /放大阅读漫画/ }).click();
    const sheet = page.getByRole('dialog', { name: '分享这篇文章' });
    const image = sheet.locator('.share-card-preview img');
    await expect(image).toBeVisible({ timeout: 20000 });
    expect(await image.evaluate((e: HTMLImageElement) => [e.naturalWidth, e.naturalHeight])).toEqual([1024, 3336]);
    await sheet.getByRole('button', { name: /放大阅读/ }).click();
    const preview = sheet.getByTestId('share-card-preview-scroll');
    expect(await preview.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
    await preview.evaluate(e => { e.scrollLeft = 200; e.scrollTop = e.scrollHeight; });
    expect(await preview.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
    await sheet.getByRole('button', { name: /适合屏幕/ }).click();
    const download = page.waitForEvent('download');
    await sheet.getByRole('button', { name: '分享图片', exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe(`wendao-story-${slug}.png`);
    expect(createHash('sha256').update(readFileSync((await file.path())!)).digest('hex')).toBe(createHash('sha256').update(source).digest('hex'));
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(comic).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('comic is also available in the drawer and its canonical public article', async ({ page }) => {
  await page.goto('/?lang=zh&acceptance=1');
  await page.getByRole('button', { name: '打开更多功能' }).click();
  await page.getByRole('button', { name: /生活里的道/ }).click();
  await page.getByRole('button', { name: /测出一个类型，不必把自己装进去/ }).click();
  const comic = page.locator('.drawer-story-detail .life-story-comic img');
  await comic.scrollIntoViewIfNeeded();
  await expect(comic).toBeVisible();
  await expect(page.locator('.drawer-story-detail')).toContainText('图片风格：新艺术风格 Art Nouveau');
  await page.goto(`/situations/${slug}/index.html`);
  await expect(page.locator('#reading-body img')).toBeVisible();
  await expect(page.locator('#reading-body details')).not.toHaveAttribute('open', '');
  await page.getByText('查看漫画解读', { exact: true }).click();
  await expect(page.locator('#reading-body details')).toContainText('允许后来的生活继续补充答案');
});
