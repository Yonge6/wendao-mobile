import { expect, test } from '@playwright/test';

const agents = {
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.65',
  Android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.65',
};
for (const [platform, userAgent] of Object.entries(agents)) {
  test.describe(platform, () => {
    test.use({ userAgent, viewport: { width: 390, height: 844 } });
    for (const comic of [true, false]) {
      test(`${comic ? 'comic' : 'chapter card'} uses long-press PNG for save and send`, async ({ page }) => {
        await page.addInitScript(() => {
          localStorage.setItem('wendao-free-chapters-v1', '[32]');
          (window as any).__shareCalls = 0;
          (window as any).__downloadClicks = 0;
          Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { (window as any).__shareCalls++; } });
          Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
          document.addEventListener('click', e => { if ((e.target as Element).closest?.('a[download]')) (window as any).__downloadClicks++; }, true);
        });
        await page.goto('/?chapter=32&lang=zh&acceptance=1');
        if (comic) await page.getByRole('button', { name: /放大阅读漫画/ }).click();
        else await page.locator('.chapter-current .section-share-action').first().click();
        const panel = page.locator('.share-card-panel');
        await expect(panel.locator('.share-card-preview img')).toBeVisible({ timeout: 20000 });
        for (const action of ['保存图片', '分享图片']) {
          await panel.getByRole('button', { name: action, exact: true }).click();
          await expect(panel.locator('.wechat-image-instructions')).toContainText(action === '保存图片' ? '选择保存到相册' : '选择分享或发送');
          const img = panel.locator('.wechat-image-scroll img');
          await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(comic ? 1024 : 1080);
          const src = await img.getAttribute('src');
          if (comic) expect(src).toBe('/assets/wendao/comics/chapter-32-art-nouveau-qr.png');
          else expect(src).toMatch(/^data:image\/png;base64,/);
          expect(await img.evaluate(e => e.closest('a,button') === null)).toBe(true);
          expect(await img.evaluate(e => getComputedStyle(e).userSelect)).toBe('auto');
          const eventAllowed = await img.evaluate(e => e.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
          expect(eventAllowed).toBe(true);
          await expect(panel).not.toContainText('已保存到相册');
          await expect(panel).not.toContainText('已发起图片下载');
          await panel.getByRole('button', { name: '返回操作' }).click();
          await expect(panel.locator('.share-card-preview img')).toBeVisible();
        }
        expect(await page.evaluate(() => [(window as any).__shareCalls, (window as any).__downloadClicks])).toEqual([0, 0]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  });
}
