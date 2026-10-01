import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1280]) {
  test(`H5 app banner is readable, dismissible and persistent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?chapter=32&lang=zh&acceptance=1');
    const banner=page.getByRole('complementary', {name:'下载三慢问道 App'});
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', {name:'下载 App'})).toHaveAttribute('href', /apps.apple.com/);
    expect(await page.locator('meta[name="apple-itunes-app"]').count()).toBe(0);
    const box=await banner.boundingBox();
    const header=await page.locator('.reading-header-fixed').boundingBox();
    expect(header!.y).toBeGreaterThanOrEqual(box!.y+box!.height-1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('button', {name:'关闭下载横幅'}).click();
    await expect(banner).toHaveCount(0);
    expect((await page.locator('.reading-header-fixed').boundingBox())!.y).toBe(0);
    await page.reload();
    await expect(banner).toHaveCount(0);
    await page.goto('/situations/a-label-is-not-a-whole-person/');
    await expect(page.locator('.app-download-banner')).toHaveCount(0);
  });
}

test('iPhone WeChat banner opens the existing same-tab download guide', async ({ browser }) => {
  const context=await browser.newContext({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.65'});
  const page=await context.newPage();
  await page.goto('/?chapter=32&lang=zh&acceptance=1');
  await page.locator('.app-download-banner-action').click();
  await expect(page).toHaveURL(/\/download.html\?lang=zh&chapter=32/);
  await expect(page.locator('#wechat-guide')).toBeVisible();
  await context.close();
});

test('public editorial pages have the same banner and session dismissal', async ({ page }) => {
  await page.goto('/situations/a-label-is-not-a-whole-person/');
  await expect(page.locator('.app-download-banner')).toBeVisible();
  await page.getByRole('button',{name:'关闭下载横幅'}).click();
  await page.goto('/?chapter=32&lang=en&acceptance=1');
  await expect(page.locator('.app-download-banner')).toHaveCount(0);
});

test('English and dark mode retain readable App download entry', async ({ page }) => {
  await page.addInitScript(()=>localStorage.setItem('wendao-theme','dark'));
  await page.goto('/?chapter=32&lang=en&acceptance=1');
  await expect(page.getByRole('link',{name:'Get App',exact:true})).toBeVisible();
  await expect(page.locator('.app-download-banner')).toContainText('iPhone / iPad');
});
