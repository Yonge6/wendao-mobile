import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const surface of ['web', 'ios']) {
  test(`${surface} shares the complete PNG as its only item`, async ({ page }) => {
    test.setTimeout(45000);
    await page.addInitScript((surface) => {
      localStorage.setItem('wendao-free-chapters-v1', '[8]');
      const record = (data: unknown) => sessionStorage.setItem('share-payload', JSON.stringify(data));
      if (surface === 'ios') {
        const headers = { Share: ['share'], Filesystem: ['writeFile', 'getUri', 'deleteFile'], StatusBar: ['setStyle', 'setOverlaysWebView'], SplashScreen: ['hide'] };
        Object.assign(window, {
          CapacitorCustomPlatform: { name: 'ios' },
          Capacitor: {
            Plugins: {},
            PluginHeaders: Object.entries(headers).map(([name, methods]) => ({ name, methods: methods.map(name => ({ name, rtype: 'promise' })) })),
            nativePromise: async (plugin: string, method: string, options: any) => {
              if (plugin === 'Filesystem' && method === 'writeFile') sessionStorage.setItem('image-bytes', options.data);
              if (plugin === 'Filesystem' && method === 'getUri') return { uri: `file:///cache/${options.path}` };
              if (plugin === 'Share' && method === 'share') record(options);
              if (plugin === 'Filesystem' && method === 'deleteFile') sessionStorage.setItem('cache-deleted', 'true');
              return {};
            },
          },
        });
      } else {
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: ({ files }: ShareData) => files?.length === 1 });
        Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload: ShareData) => {
          const file = payload.files![0];
          record({ ...payload, files: [{ name: file.name, type: file.type, size: file.size }], activation: navigator.userActivation.isActive });
          sessionStorage.setItem('image-bytes', btoa(String.fromCharCode(...new Uint8Array(await file.slice(0, 8).arrayBuffer()))));
        } });
      }
    }, surface);
    await page.goto('/?chapter=8&lang=zh&acceptance=1');
    for (const selector of ['.chapter-current .chapter-share-quick', '.chapter-current .chapter-life-story .section-share-action']) {
      await page.locator(selector).first().click();
      const image = page.locator('.share-card-preview img');
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(1080);
      await page.getByRole('button', { name: '分享图片', exact: true }).click();
      await expect(page.locator('.share-action-feedback')).toHaveText('已打开系统分享');
      const data = await page.evaluate(() => ({payload: JSON.parse(sessionStorage.getItem('share-payload')!), bytes: sessionStorage.getItem('image-bytes'), deleted:sessionStorage.getItem('cache-deleted')}));
      expect(data.payload).not.toHaveProperty('url');
      expect(data.payload).not.toHaveProperty('text');
      expect(data.payload.files).toHaveLength(1);
      expect(data.bytes).toMatch(/^iVBORw0KGgo/);
      if (surface === 'ios') {
        expect(data.payload.files[0]).toMatch(/^file:\/\/\/cache\/.+\.png$/);
        expect(data.deleted).toBe('true');
      } else {
        expect(data.payload.files[0].type).toBe('image/png');
        expect(data.payload.files[0].size).toBeGreaterThan(10000);
        expect(data.payload.activation).toBe(true);
      }
      await page.keyboard.press('Escape');
    }
  });
}

test('unsupported file sharing downloads the actual PNG and never sends a link', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('wendao-free-chapters-v1', '[8]');
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
    Object.defineProperty(navigator, 'share', { value: () => { throw new Error('Must not share a URL'); }, configurable: true });
  });
  await page.goto('/?chapter=8&lang=zh');
  await page.locator('.chapter-current .chapter-share-quick').click();
  await expect(page.locator('.share-card-preview img')).toBeVisible();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: '分享图片', exact: true }).click();
  const download = await waiting;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  await expect(page.locator('.share-action-feedback')).toHaveText('当前浏览器已保存图片');
});

for (const width of [390, 1100]) {
  test(`both night practice cards use readable theme colors at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height: 844});
    await page.addInitScript(() => {
      localStorage.setItem('wendao-theme', 'dark');
      localStorage.setItem('wendao-free-chapters-v1', '[8]');
    });
    await page.goto('/?chapter=8&lang=zh');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const cards = page.locator('.chapter-current .practice-card');
    await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(2);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('background-color', 'rgb(23, 35, 38)');
      await expect(card.locator('p')).toHaveCSS('color', 'rgb(219, 231, 227)');
      const ratios = await card.evaluate(e => {
        const luminance = (color: string) => {
          const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
          return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        };
        const background = luminance(getComputedStyle(e).backgroundColor);
        return ['p', '.practice-kicker'].map(selector => (luminance(getComputedStyle(e.querySelector(selector)!).color) + .05) / (background + .05));
      });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
      await expect(card.locator('.practice-kicker')).toHaveCSS('color', 'rgb(199, 168, 110)');
    }
    await cards.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `work/release-1.9-23/night-practice-${width}.png` });
    await cards.nth(1).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `work/release-1.9-23/night-essay-practice-${width}.png` });
  });
}
