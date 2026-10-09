import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const sourceRoot = path.join(root, "docs/app-store/creative-1.9.6/source");
const outputRoot = path.join(root, "docs/app-store/creative-1.9.6/final");
const iconPath = path.join(root, "docs/app-store/assets/app-icon-master.png");

const variants = {
  header: {
    size: { width: 3840, height: 1646 },
    background: "wendao-header-background.png",
    zh: {
      brand: "三慢问道 · AI 道德经",
      headline: "慢下来，问一问自己。",
      support: "81 章双语图文 · 与 AI 对话",
    },
    en: {
      brand: "WENDAO AI · DAODEJING",
      headline: "Read slowly. Ask what matters.",
      support: "81 bilingual chapters · Thoughtful AI dialogue",
    },
  },
  search: {
    size: { width: 3840, height: 2560 },
    background: "wendao-search-background.png",
    zh: {
      brand: "三慢问道 · AI 道德经",
      headline: "把《道德经》，带回今天。",
      support: "图文故事 · 生活启发 · AI 问道",
    },
    en: {
      brand: "WENDAO AI · DAODEJING",
      headline: "Bring the Daodejing into today.",
      support: "Illustrated stories · Daily reflection · Wendao AI",
    },
  },
};

function dataUrl(bytes, mime = "image/png") {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const iconUrl = dataUrl(await readFile(iconPath));
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

try {
  for (const [kind, variant] of Object.entries(variants)) {
    const backgroundUrl = dataUrl(await readFile(path.join(sourceRoot, variant.background)));
    for (const locale of ["zh", "en"]) {
      const copy = variant[locale];
      const outputDirectory = path.join(outputRoot, locale === "zh" ? "zh-Hans" : "en-US");
      await mkdir(outputDirectory, { recursive: true });
      const page = await browser.newPage({ viewport: variant.size, deviceScaleFactor: 1 });
      await page.setContent(`<!doctype html>
        <html lang="${locale === "zh" ? "zh-CN" : "en"}">
          <head><meta charset="utf-8"><style>
            * { box-sizing: border-box; }
            html, body { width: ${variant.size.width}px; height: ${variant.size.height}px; margin: 0; overflow: hidden; }
            body { background: #efe7d7; }
            main { position: relative; width: 100%; height: 100%; overflow: hidden; background: url('${backgroundUrl}') center / cover no-repeat; }
            main::before { position: absolute; inset: 0; content: ""; background: linear-gradient(90deg, rgba(247,241,229,.96) 0%, rgba(247,241,229,.88) 31%, rgba(247,241,229,.34) 58%, rgba(2,45,50,.08) 100%); }
            main.search::before { background: linear-gradient(90deg, rgba(250,245,235,.98) 0%, rgba(250,245,235,.94) 34%, rgba(250,245,235,.54) 55%, rgba(250,245,235,.05) 100%); }
            .copy { position: absolute; z-index: 2; left: ${kind === "header" ? 300 : 330}px; top: 50%; width: ${kind === "header" ? 1960 : 2050}px; transform: translateY(-50%); color: #093f46; }
            .brand { display: flex; align-items: center; gap: 34px; color: #a9782d; font: 600 ${kind === "header" ? 54 : 62}px/1.2 -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif; letter-spacing: .14em; }
            .brand img { width: ${kind === "header" ? 132 : 156}px; height: ${kind === "header" ? 132 : 156}px; border-radius: 30%; box-shadow: 0 16px 42px rgba(2,45,50,.16); }
            h1 { max-width: 2100px; margin: ${kind === "header" ? 64 : 92}px 0 0; font: 600 ${kind === "header" ? 168 : 190}px/1.1 "Songti SC", "STSong", Georgia, serif; letter-spacing: ${locale === "zh" ? ".015em" : "-.028em"}; text-wrap: balance; }
            html[lang="en"] h1 { font-family: Georgia, "Times New Roman", serif; font-size: ${kind === "header" ? 162 : 184}px; }
            .support { margin: ${kind === "header" ? 50 : 64}px 0 0; color: #315f62; font: 500 ${kind === "header" ? 62 : 70}px/1.35 -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif; letter-spacing: ${locale === "zh" ? ".08em" : ".015em"}; }
            .seal { position: absolute; z-index: 2; left: ${kind === "header" ? 309 : 339}px; bottom: ${kind === "header" ? 96 : 146}px; width: ${kind === "header" ? 78 : 92}px; height: ${kind === "header" ? 78 : 92}px; display: grid; place-items: center; border: 3px solid rgba(169,120,45,.72); border-radius: 50%; color: #a9782d; background: rgba(247,241,229,.62); font: 600 ${kind === "header" ? 28 : 32}px/1 Georgia, serif; }
          </style></head>
          <body><main class="${kind}">
            <section class="copy">
              <div class="brand"><img src="${iconUrl}" alt=""><span>${copy.brand}</span></div>
              <h1>${copy.headline}</h1>
              <p class="support">${copy.support}</p>
            </section>
            <div class="seal">道</div>
          </main></body>
        </html>`);
      await page.screenshot({
        path: path.join(outputDirectory, `wendao-${kind}-${locale}.png`),
        fullPage: false,
        animations: "disabled",
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("Composed 4 localized App Store creatives at Apple title/search dimensions.");
