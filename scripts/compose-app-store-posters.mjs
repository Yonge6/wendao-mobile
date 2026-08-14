import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const sourceRoot = path.join(root, "docs/app-store/screenshots/source");
const finalRoot = path.join(root, "docs/app-store/screenshots/final");
const image2Background = path.join(finalRoot, "image2-master-background.png");

const copy = {
  "zh-Hans": [
    ["慢下来，读一章", "《道德经》"],
    ["帛书乙本", "底本校读"],
    ["逐字拼音", "逐句今译"],
    ["每章三条启发", "落到当下生活"],
    ["完整 81 章", "离线也能读"],
    ["人生说明书", "因你的结构而不同"],
  ],
  "en-US": [
    ["Slow down", "with one chapter"],
    ["A Silk B", "based reading"],
    ["Pinyin and", "line-by-line meaning"],
    ["Three insights", "for daily life"],
    ["All 81 chapters", "available offline"],
    ["A Life Manual", "shaped by your design"],
  ],
};

const sourceNames = [
  "01-reading.png",
  "02-text-layers.png",
  "03-line-by-line.png",
  "04-for-you.png",
  "05-search.png",
  "06-life-manual.png",
];

function dataUrl(bytes) {
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const backgroundUrl = dataUrl(await readFile(image2Background));
const browser = await chromium.launch();

try {
  for (const locale of Object.keys(copy)) {
    const outputDirectory = path.join(finalRoot, locale);
    await mkdir(outputDirectory, { recursive: true });

    for (let index = 0; index < sourceNames.length; index += 1) {
      const sourceName = sourceNames[index];
      const screenshotUrl = dataUrl(await readFile(path.join(sourceRoot, locale, sourceName)));
      const [lineOne, lineTwo] = copy[locale][index];
      const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
      await page.setContent(`<!doctype html>
        <html lang="${locale === "zh-Hans" ? "zh-CN" : "en"}">
          <head><meta charset="utf-8"><style>
            * { box-sizing: border-box; }
            html, body { width: 430px; height: 932px; margin: 0; overflow: hidden; }
            body { background: #f5efe3; }
            .poster {
              position: relative; width: 430px; height: 932px; overflow: hidden;
              background: url('${backgroundUrl}') center / cover no-repeat;
              color: #0c4b55;
            }
            .poster::before {
              position: absolute; inset: 0; content: "";
              background: linear-gradient(180deg, rgba(249,244,234,.22), rgba(249,244,234,.04) 42%, rgba(247,240,227,.18));
            }
            .top { position: relative; z-index: 2; height: 178px; padding: 35px 36px 20px; }
            .brand { display: flex; align-items: center; gap: 10px; color: #9f7428; font: 600 10px/1.2 -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: .18em; text-transform: uppercase; }
            .brand::before { width: 22px; height: 1px; background: #b58b3d; content: ""; }
            h1 { margin: 18px 0 0; max-width: 350px; color: #0a4650; font: 600 30px/1.14 "Songti SC", "STSong", Georgia, serif; letter-spacing: .02em; }
            html[lang="en"] h1 { font-family: Georgia, "Times New Roman", serif; font-size: 29px; line-height: 1.05; letter-spacing: -.015em; }
            h1 span { display: block; }
            .count { position: absolute; top: 38px; right: 35px; color: rgba(159,116,40,.78); font: 500 10px/1 -apple-system, sans-serif; letter-spacing: .12em; }
            .device {
              position: absolute; z-index: 2; top: 177px; left: 43px; width: 344px; height: 746px;
              overflow: hidden; border: 1px solid rgba(177,132,50,.34); border-radius: 24px 24px 0 0;
              background: #f8f2e7; box-shadow: 0 22px 55px rgba(26,52,50,.18), 0 2px 8px rgba(177,132,50,.12);
            }
            .device img { display: block; width: 100%; height: auto; }
            .seal { position: absolute; z-index: 3; right: 26px; bottom: 24px; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(181,139,61,.7); border-radius: 50%; background: rgba(247,240,227,.84); color: #a5782b; font: 600 9px/1 Georgia, serif; letter-spacing: .04em; }
          </style></head>
          <body><main class="poster">
            <header class="top">
              <div class="brand">${locale === "zh-Hans" ? "三慢问道 · WENDAO" : "WENDAO · DAODEJING"}</div>
              <span class="count">${String(index + 1).padStart(2, "0")} / 06</span>
              <h1><span>${lineOne}</span><span>${lineTwo}</span></h1>
            </header>
            <div class="device"><img src="${screenshotUrl}" alt=""></div>
            <div class="seal">道</div>
          </main></body>
        </html>`);
      await page.screenshot({
        path: path.join(outputDirectory, sourceName),
        fullPage: false,
        animations: "disabled",
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("Composed 12 Image2-backed App Store posters at 1290 × 2796.");
