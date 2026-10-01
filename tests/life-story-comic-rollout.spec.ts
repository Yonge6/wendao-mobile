import { expect, test } from '@playwright/test';
for (const width of [390, 1280]) {
  test(`chapter with secondary essays leads with the new comic at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('wendao-free-chapters-v1', '[8]');
      localStorage.setItem('wendao-theme', 'dark');
    });
    await page.goto('/?chapter=8&lang=zh&acceptance=1');
    const section = page.locator('.chapter-current .life-stories-section');
    await expect(section.locator('.chapter-life-story')).toHaveCount(1);
    const image = section.locator('.life-story-comic img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalHeight)).toBe(3336);
    await expect(section.locator('.life-story-comic-style a')).toHaveAttribute('href', /style=chinese-ink-painting/);
    await section.getByText('查看漫画解读', { exact: true }).click();
    await expect(section).toContainText('截图');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/situations/boundaries/index.html');
    await expect(page.locator('#reading-body')).toContainText('夫唯不争');
  });
}
