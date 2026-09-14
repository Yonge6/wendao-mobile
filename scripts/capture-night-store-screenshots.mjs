import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
// Actual shared UI in native navigation mode; no replacement text or interface.
const base = process.argv[2] || 'http://127.0.0.1:4197/';
const browser = await chromium.launch();
try {
  for (const device of ['iphone', 'ipad']) for (const lang of ['zh', 'en']) {
    const folder = path.resolve('docs/app-store/screenshots/night-1.9.1', device, lang === 'zh' ? 'zh-Hans' : 'en-US');
    await mkdir(folder, { recursive: true });
    const context = await browser.newContext({ viewport: device === 'iphone' ? { width: 440, height: 956 } : { width: 1032, height: 1376 }, deviceScaleFactor: device === 'iphone' ? 3 : 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.assign(window, { CapacitorCustomPlatform: { name: 'ios' }, Capacitor: { Plugins: {}, PluginHeaders: [], nativePromise: () => Promise.resolve() } });
      localStorage.setItem('wendao-free-chapters-v1', '[8]');
      localStorage.setItem('wendao-theme', 'dark');
    });
    await page.goto(`${base}?chapter=8&lang=${lang}&acceptance=1`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('.chapter-current .related-section');
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const target = document.querySelector('.chapter-current .related-section .practice-card');
      const scroller = document.querySelector('[data-testid="mobile-scroll"]');
      scroller.scrollTop += target.getBoundingClientRect().top - 240;
    });
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(folder, '11-night-practice.jpg'), type: 'jpeg', quality: 95, animations: 'disabled' });
    console.log(device, lang, 'night screenshot captured');
    await context.close();
  }
} finally { await browser.close(); }
