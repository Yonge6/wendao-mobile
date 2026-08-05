import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Chapter } from "../src/data/chapters";

const chapters = JSON.parse(readFileSync(new URL("../src/data/chapters.json", import.meta.url), "utf8")) as Chapter[];
const chapter8 = chapters.find((chapter) => chapter.id === 8)!;
const chapter64 = chapters.find((chapter) => chapter.id === 64)!;

const chartSnapshot = {
  schemaVersion: "1.0",
  engineVersion: "1.0.0",
  verificationStatus: "engine_verified",
  chartHash: `sha256:${"a".repeat(64)}`,
  generatedAt: "2026-07-31T00:00:00.000Z",
  input: {
    birthDate: "1990-01-01",
    birthTime: "12:00",
    timezone: "Asia/Shanghai",
    locationLabel: "武汉市",
  },
  core: {
    type: "Generator",
    strategy: "To Respond",
    authority: "Sacral",
    profile: "5/1",
    definition: "Single Definition",
    incarnationCross: "Right Angle Cross of Service",
  },
  activations: {},
  structure: {
    definedCenters: [],
    channels: [],
    variables: {},
  },
  meta: {},
};

test("shows the calculated life manual even when background profile persistence fails", async ({ page }) => {
  await page.route("https://pluto-human-design-api.vercel.app/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/v1/charts") {
      await route.fulfill({ json: { data: chartSnapshot, error: null } });
      return;
    }
    if (path === "/v1/profiles") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({ json: { data: { saved: true }, error: null } });
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "三慢问道" })).toBeVisible();
  await page.getByRole("button", { name: "打开更多功能" }).click();
  await page.getByRole("button", { name: "录入出生信息" }).click();

  await page.getByLabel("姓名或称呼").fill("测试读者");
  await page.getByLabel("出生日期").fill("1990-01-01");
  await page.getByLabel("出生时间").fill("12:00");
  await page.getByLabel("出生地点").fill("武汉市");
  await page.getByRole("button", { name: "生成我的人生说明书" }).click();

  await expect(page.getByText("计算结果", { exact: true })).toHaveCount(0);
  await expect(page.getByText("不出图，只呈现与你有关的信息", { exact: true })).toHaveCount(0);
  await expect(page.getByText("生产者", { exact: true })).toBeVisible();
  await expect(page.getByText("荐骨权威", { exact: true })).toBeVisible();
  await expect(page.getByText("正在识别并计算…", { exact: true })).toHaveCount(0);
});

test("refreshes progressive reading after language and text-size changes", async ({ page }) => {
  await page.route("https://pluto-human-design-api.vercel.app/**", async (route) => {
    await route.fulfill({ json: { data: { saved: true }, error: null } });
  });
  await page.goto("/");

  const reading = page.getByTestId("mobile-scroll");
  await expect(page.getByText("本章已读完", { exact: true })).toHaveCount(1);
  await reading.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.getByText("下一章正在展开", { exact: true })).toBeVisible();
  await expect(page.locator("article.chapter")).toHaveCount(2);
  await expect(page.getByText("下一章已展开", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect.poll(async () => reading.evaluate((element) => element.scrollTop)).toBeLessThan(4);

  await page.locator("button.header-menu-button").click();
  await page.getByRole("button", { name: "L", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect.poll(async () => reading.evaluate((element) => element.scrollTop)).toBeLessThan(4);
});

test("starts at the former default size and offers two larger reading steps", async ({ page }) => {
  await page.goto("/");
  const verse = page.locator(".chapter-current .verse-line").first();
  await expect(verse).toHaveCSS("font-size", "24px");

  await page.getByRole("button", { name: "打开更多功能" }).click();
  await expect(page.getByRole("button", { name: "小", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("夜读模式", { exact: true })).toHaveCSS("font-size", "15px");
  await expect(page.getByText("调低光线，让眼睛和心一起慢下来", { exact: true })).toHaveCSS("font-size", "11px");

  const sizeControl = page.getByRole("group", { name: "选择阅读字号" });
  await sizeControl.getByRole("button", { name: "中", exact: true }).click();
  await expect(verse).toHaveCSS("font-size", "28px");
  await sizeControl.getByRole("button", { name: "大", exact: true }).click();
  await expect(verse).toHaveCSS("font-size", "32px");

  await page.getByRole("button", { name: "关闭菜单", exact: true }).last().click();
  await page.setViewportSize({ width: 320, height: 900 });
  const overflow = await page.evaluate(() => {
    const reading = document.querySelector<HTMLElement>("[data-testid='mobile-scroll']")!;
    const bounds = reading.getBoundingClientRect();
    const contentOverflow = Array.from(reading.querySelectorAll<HTMLElement>("*"))
      .reduce((largest, element) => {
        const rect = element.getBoundingClientRect();
        return Math.max(largest, rect.right - bounds.right, bounds.left - rect.left);
      }, 0);
    return {
      document: document.documentElement.scrollWidth - window.innerWidth,
      visibleContent: Math.ceil(contentOverflow),
    };
  });
  expect(overflow.document).toBeLessThanOrEqual(0);
  expect(overflow.visibleContent).toBeLessThanOrEqual(0);
  await expect(page.locator(".verse-line-ruby > .verse-punctuation")).toHaveCount(0);
});

test("opens the complete original-text poster and shares an exact chapter link", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload: ShareData) => {
        window.sessionStorage.setItem("wendao-test-share", JSON.stringify(payload));
      },
    });
  });
  await page.goto("/?chapter=8&lang=zh");
  await page.locator(".chapter-current .chapter-share-quick").click();
  await expect(page.getByRole("heading", { name: "分享这一章" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "说明书" })).toBeDisabled();
  await expect(page.getByText(/iPhone|1080 × 2340|分享你选中的文字|图片放一个阅读瞬间/)).toHaveCount(0);

  const preview = page.locator(".share-card-preview img");
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1080);
  const naturalSize = await preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]);
  expect(naturalSize[0]).toBe(1080);
  expect(naturalSize[1]).toBeGreaterThanOrEqual(2160);
  const originalLabel = await page.locator(".share-card-preview").getAttribute("aria-label");
  expect(originalLabel).toContain(chapter8.zh.reconstructedVerse.at(-1));
  expect(originalLabel).toContain(chapter8.zh.pinyin.at(-1)?.join(" "));
  expect(originalLabel).toContain(chapter8.zh.lineByLineTranslation.at(-1));

  const shareLink = page.getByRole("button", { name: "分享链接" });
  const exactUrl = await shareLink.getAttribute("data-share-link");
  expect(exactUrl).toMatch(/^https:\/\/wendao\.wonderelian\.com\/\?chapter=\d+&section=verse&lang=zh$/);
  await shareLink.click();
  await expect(page.getByText("已打开系统分享", { exact: true })).toBeVisible();
  const payload = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem("wendao-test-share") || "{}"));
  expect(payload.url).toBe(exactUrl);
  expect(payload.title).toMatch(/^三慢问道 · 第\d+章$/);
});

test("switches all four complete posters and keeps life-manual details anonymous", async ({ page }) => {
  await page.addInitScript((storedChart) => {
    window.localStorage.setItem("wendao-chart-snapshot", JSON.stringify(storedChart));
    window.localStorage.setItem("wendao-life-profile", JSON.stringify({
      name: "不应出现在分享卡上的姓名",
      birthDate: "1990-01-01",
      birthTime: "12:00",
      birthPlace: "武汉市",
      timezone: "Asia/Shanghai",
    }));
  }, chartSnapshot);
  await page.goto("/?chapter=8&lang=zh");
  await page.locator(".chapter-current .chapter-share-quick").click();

  for (const [tab, section] of [["原文", "verse"], ["解读", "meaning"], ["启发", "inspiration"], ["说明书", "manual"]] as const) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.locator(".share-card-preview img")).toBeVisible();
    await expect(page.getByRole("button", { name: "分享链接" })).toHaveAttribute("data-share-link", new RegExp(`chapter=8&section=${section}&lang=zh`));
    if (section === "inspiration") {
      const inspirationLabel = await page.locator(".share-card-preview").getAttribute("aria-label");
      expect(inspirationLabel).toContain(chapter8.zh.related.find((item) => item.title === "对我们的启发")!.body);
      expect(inspirationLabel).toContain(chapter8.zh.reconstructedVerse.at(-1));
      expect(inspirationLabel).toContain(chapter8.zh.pinyin.at(-1)?.join(" "));
    }
  }

  const manualCardLabel = await page.locator(".share-card-preview").getAttribute("aria-label");
  expect(manualCardLabel).toContain("生产者");
  expect(manualCardLabel).toContain("对我们的启发");
  expect(manualCardLabel).toContain(chapter8.zh.related.find((item) => item.title === "对我们的启发")!.body);
  expect(manualCardLabel).not.toContain("不应出现在分享卡上的姓名");
  expect(manualCardLabel).not.toContain("1990-01-01");
  expect(manualCardLabel).not.toContain("武汉市");
});

test("keeps text selection for copying without creating a share-selection mode", async ({ page }) => {
  await page.goto("/?chapter=8&lang=zh");
  const inspiration = page.locator('.chapter-current .related-item').filter({ hasText: "对我们的启发" }).locator("p");
  await inspiration.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });

  await expect(page.getByRole("button", { name: "分享所选" })).toHaveCount(0);
});

test("offers a full-poster share action at the end of every reading layer", async ({ page }) => {
  await page.goto("/?chapter=8&lang=zh");
  const chapter = page.locator('.chapter-current[data-chapter-id="8"]');
  await expect(chapter.locator(".section-share-action")).toHaveCount(3);
  await chapter.locator(".explanation-section .section-share-action").click();
  await expect(page.getByRole("tab", { name: "解读" })).toHaveAttribute("aria-selected", "true");
  const meaningLabel = await page.locator(".share-card-preview").getAttribute("aria-label");
  expect(meaningLabel).toContain(chapter8.zh.lineByLineTranslation.at(-1));
  expect(meaningLabel).toContain(chapter8.zh.explanation[1].body);
  expect(meaningLabel).toContain(chapter8.zh.reconstructedVerse.at(-1));
});

test("grows a long chapter poster instead of shrinking or cropping its full text", async ({ page }) => {
  await page.goto("/?chapter=64&lang=zh");
  await page.locator(".chapter-current .chapter-share-quick").click();
  await page.getByRole("tab", { name: "解读" }).click();
  const preview = page.locator(".share-card-preview img");
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalHeight)).toBeGreaterThan(2340);
  expect(await preview.evaluate((image: HTMLImageElement) => image.naturalHeight)).toBeLessThan(4500);
  const label = await page.locator(".share-card-preview").getAttribute("aria-label");
  expect(label).toContain(chapter64.zh.lineByLineTranslation.at(-1));
  expect(label).toContain(chapter64.zh.reconstructedVerse.at(-1));
});

test("opens shared chapter links in the requested language and section", async ({ page }) => {
  await page.goto("/?chapter=8&section=inspiration&lang=en");
  await expect(page.locator('.chapter-current[data-chapter-id="8"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Chinese", exact: true })).toBeVisible();
  await expect(page.getByTestId("daily-recommendation")).toHaveCount(0);
  await expect(page.locator('.chapter-current [data-share-section="inspiration"]')).toBeVisible();
});

test("drawer presents three bilingual related works with safe external links", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开更多功能" }).click();
  await expect(page.getByRole("button", { name: "分享问道" })).toHaveCount(0);
  await expect(page.locator(".drawer-footer")).toHaveCount(0);
  const works = page.getByRole("region", { name: "沿途所作" });
  await expect(works).toBeVisible();
  const links = works.getByRole("link");
  await expect(links).toHaveCount(3);
  const xiaziLink = works.getByRole("link", { name: /虾子曰/ });
  await expect(xiaziLink).toHaveAttribute("href", "https://xiazishuo.com/");
  await expect(xiaziLink).toContainText("昨日世界");
  await expect(xiaziLink).not.toContainText("每日昨日世界");
  await expect(works.getByRole("link", { name: /人类图/ })).toHaveAttribute("href", "https://human-design.wonderelian.com/");
  await expect(works.getByRole("link", { name: /艺术风格图鉴/ })).toHaveAttribute("href", "https://style-atlas.wonderelian.com/");
  for (let index = 0; index < 3; index += 1) {
    await expect(links.nth(index)).toHaveAttribute("target", "_blank");
    await expect(links.nth(index)).toHaveAttribute("rel", "noreferrer");
  }

  await page.getByRole("button", { name: "关闭菜单", exact: true }).last().click();
  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await page.getByRole("button", { name: "Open more", exact: true }).click();
  await expect(page.getByRole("region", { name: "Works along the way" })).toContainText("Yesterday’s World");
  await expect(page.getByRole("region", { name: "Works along the way" })).toContainText("A manual for your life");
  await expect(page.getByRole("region", { name: "Works along the way" })).toContainText("Learn to see a style");
});

test("opens a pressure-free bilingual support modal from the bottom of the drawer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开更多功能" }).click();
  const supportSection = page.getByRole("region", { name: "随喜相助" });
  await expect(supportSection).toBeVisible();
  await expect(supportSection).toContainText("有余则助，无余亦安");
  await supportSection.getByRole("button", { name: /随喜相助/ }).click();

  const supportDialog = page.getByRole("dialog", { name: "随喜相助" });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog).toContainText("阅读、停留与分享，本身已经是同行");
  const paymentCode = supportDialog.getByRole("img", { name: "微信支付收款码" });
  await expect(paymentCode).toHaveAttribute("src", "/assets/wendao/support-wechat-qr.png");
  await expect(paymentCode).not.toHaveAttribute("draggable", "true");
  await expect(paymentCode).not.toHaveAttribute("data-native-drag", "true");
  await expect(supportDialog.getByText("长按二维码，识别并支付", { exact: true })).toBeVisible();
  const rawImageLink = supportDialog.getByRole("link", { name: "单独打开二维码", exact: true });
  await expect(rawImageLink).toHaveAttribute("href", "/assets/wendao/support-wechat-qr.png");
  await expect(rawImageLink).toHaveAttribute("target", "_blank");
  await expect(supportDialog.getByRole("link", { name: "查看完整收款海报", exact: true })).toHaveAttribute("href", "/assets/wendao/support-wechat.jpg");
  const supportClose = supportDialog.locator(".support-modal-close");
  await expect(supportClose).toHaveCount(1);
  const closeTop = await supportClose.evaluate((element) => element.getBoundingClientRect().top);
  await supportDialog.locator("figure").evaluate((element) => { element.scrollTop = element.scrollHeight; });
  const scrolledCloseTop = await supportClose.evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(scrolledCloseTop - closeTop)).toBeLessThanOrEqual(1);
  await supportClose.click();
  await expect(supportDialog).toHaveCount(0);

  await page.getByRole("button", { name: "关闭菜单", exact: true }).last().click();
  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await page.getByRole("button", { name: "Open more", exact: true }).click();
  await expect(page.getByRole("region", { name: "Support the journey" })).toContainText("Give freely, or simply read in peace");
});

for (const width of [320, 390, 720]) {
  test(`${width}px support modal keeps the payment code clear and inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "打开更多功能" }).click();
    await page.getByRole("region", { name: "随喜相助" }).getByRole("button", { name: /随喜相助/ }).click();

    const supportDialog = page.getByRole("dialog", { name: "随喜相助" });
    const paymentCode = supportDialog.getByRole("img", { name: "微信支付收款码" });
    await expect(paymentCode).toBeVisible();
    await expect.poll(() => paymentCode.evaluate((image: HTMLImageElement) => ({
      complete: image.complete,
      width: image.naturalWidth,
      height: image.naturalHeight,
    }))).toEqual({ complete: true, width: 440, height: 440 });

    const layout = await page.evaluate(() => {
      const figure = document.querySelector<HTMLElement>(".support-modal figure")!;
      const bounds = figure.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        leftOverflow: Math.min(0, bounds.left),
        rightOverflow: Math.max(0, bounds.right - window.innerWidth),
        topOverflow: Math.min(0, bounds.top),
        bottomOverflow: Math.max(0, bounds.bottom - window.innerHeight),
      };
    });
    expect(layout.documentOverflow).toBeLessThanOrEqual(0);
    expect(layout.leftOverflow).toBe(0);
    expect(layout.rightOverflow).toBe(0);
    expect(layout.topOverflow).toBe(0);
    expect(layout.bottomOverflow).toBe(0);
  });
}

test("keeps the external payment entry out of the native iOS surface", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, {
      CapacitorCustomPlatform: { name: "ios" },
      Capacitor: {
        Plugins: {},
        PluginHeaders: [{
          name: "StatusBar",
          methods: [
            { name: "setStyle", rtype: "promise" },
            { name: "setOverlaysWebView", rtype: "promise" },
          ],
        }],
        nativePromise: () => Promise.resolve(),
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "打开更多功能" }).click();
  await expect(page.getByRole("region", { name: "随喜相助" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "随喜相助" })).toHaveCount(0);
});

test("About separates the textual lineage from claims of direct descent", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开更多功能" }).click();
  await page.getByRole("button", { name: "关于三慢问道" }).click();
  await expect(page.getByRole("link", { name: /^微博/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Facebook/ })).toHaveCount(0);
  const lineage = page.getByRole("region", { name: "道德经文本谱系" });
  await expect(lineage).toBeVisible();
  await expect(lineage.locator("li")).toHaveCount(5);
  await expect(lineage.getByText("王弼本", { exact: true })).toBeVisible();
  await expect(lineage.getByText(/不代表各版本之间存在单一直系抄传关系/)).toBeVisible();
  await page.getByRole("button", { name: "关闭菜单", exact: true }).last().click();
  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await page.getByRole("button", { name: "Open more", exact: true }).click();
  await page.getByRole("button", { name: "About Wendao" }).click();
  await expect(page.getByRole("link", { name: /^Weibo/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Facebook/ })).toHaveCount(0);
  const englishLineage = page.getByRole("region", { name: "Textual lineage of the Daodejing" });
  await expect(englishLineage.getByText("Wang Bi edition", { exact: true })).toBeVisible();
  await expect(englishLineage.getByText(/not a single direct line of transmission/)).toBeVisible();
});

test("covers all 81 chapters through contents, chance, and progressive reading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article.chapter")).toHaveCount(1);
  const firstDailyChapter = Number(await page.locator("article.chapter").getAttribute("data-chapter-id"));
  expect(firstDailyChapter).toBeGreaterThanOrEqual(1);
  expect(firstDailyChapter).toBeLessThanOrEqual(81);
  const dailyRecommendation = page.getByTestId("daily-recommendation");
  await expect(dailyRecommendation).toContainText(/^今日偶遇｜帛书乙本底本校读 · 对应今本第.+章$/);
  await page.reload();
  await expect(page.locator("article.chapter")).toHaveAttribute("data-chapter-id", String(firstDailyChapter));

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(dailyRecommendation).toContainText(new RegExp(`^Today’s encounter｜Silk B Base Reading · Received Chapter ${firstDailyChapter}$`));
  await page.getByRole("button", { name: "Switch to Chinese", exact: true }).click();

  await page.getByRole("button", { name: "目录", exact: true }).click();
  const directoryItems = page.locator(".directory-item");
  await expect(directoryItems).toHaveCount(81);
  const ids = await directoryItems.evaluateAll((items) => items.map((item) => Number(item.getAttribute("data-chapter-id"))).sort((a, b) => a - b));
  expect(ids).toEqual(Array.from({ length: 81 }, (_, index) => index + 1));

  await page.locator('.directory-item[data-chapter-id="80"]').click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect(page.locator("article.chapter")).toHaveAttribute("data-chapter-id", "80");
  await expect(dailyRecommendation).toHaveCount(0);

  await page.getByRole("button", { name: "偶遇一章", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect(page.locator('article.chapter[data-chapter-id="80"]')).toHaveCount(0);
  await expect(dailyRecommendation).toHaveCount(0);

  const reading = page.getByTestId("mobile-scroll");
  await reading.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator("article.chapter")).toHaveCount(2);
});

test("renders the three textual layers and copies reconstructed text without Pinyin", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "目录", exact: true }).click();
  await page.locator('.directory-item[data-chapter-id="1"]').click();

  const chapter = page.locator('.chapter-current[data-chapter-id="1"]');
  await expect(chapter.getByText("01 乙本转写", { exact: true })).toHaveCount(0);
  await expect(chapter.getByText("02 校读正文", { exact: true })).toHaveCount(0);
  await expect(chapter.getByText("03 现代解读", { exact: true })).toHaveCount(0);
  await expect(chapter.getByText("第一层｜帛书乙本转写", { exact: true })).toBeVisible();
  await expect(chapter.getByText("第二层｜校读正文", { exact: true })).toBeVisible();
  await expect(chapter.getByText("第三层｜现代解读", { exact: true })).toBeVisible();

  const suppliedTokens = chapter.locator(".verse-token.is-supplied");
  await expect(suppliedTokens.first().locator("rt")).not.toHaveText("");
  await expect(chapter.locator(".verse-supply-bracket")).toHaveCount(8);

  const line = chapter.locator(".verse-line").first();
  const expected = await line.getAttribute("data-copy-text");
  await line.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test("renders a source-aligned modern Chinese translation for every line", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "目录", exact: true }).click();
  await page.locator('.directory-item[data-chapter-id="8"]').click();
  const chapter = page.locator('.chapter-current[data-chapter-id="8"]');
  await expect(chapter.getByText("直译｜逐句读懂这一章", { exact: true })).toBeVisible();
  await expect(chapter.locator(".line-by-line-reading li")).toHaveCount(9);
  await expect(chapter.getByText("最高的善像水。", { exact: true })).toBeVisible();
  await expect(chapter.getByText("正因为不争，所以没有过失和怨尤。", { exact: true })).toBeVisible();
  await expect(chapter.getByRole("heading", { name: "校读｜原字、缺损与参照分层", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(chapter.getByRole("heading", { name: "Collation · Keep witness, supply, and comparison separate", exact: true })).toHaveCount(0);
  await expect(chapter.getByRole("heading", { name: "Thought · Return force to the larger pattern", exact: true })).toBeVisible();
});

test("representative supplied chapters expose accessible reading text, copy cleanly, and do not overflow", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const width of [320, 390, 720]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const id of [1, 16, 38, 41, 67, 81]) {
      await page.getByRole("button", { name: "目录", exact: true }).click();
      await page.locator(`.directory-item[data-chapter-id="${id}"]`).click();
      const chapter = page.locator(`.chapter-current[data-chapter-id="${id}"]`);
      await expect(chapter.getByRole("heading", { name: "对我们的启发", exact: true })).toBeVisible();
      const lineLabels = await chapter.locator(".verse-line").evaluateAll((lines) => lines.map((line) => line.getAttribute("aria-label")));
      expect(lineLabels.every((line) => line && !/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(line))).toBe(true);
      const overflow = await page.getByTestId("mobile-scroll").evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(overflow, `Chapter ${id} at ${width}px horizontal overflow`).toBeLessThanOrEqual(0);
      if (id !== 81) await expect(chapter.locator(".verse-supply-bracket").first()).toBeVisible();
      if (id === 16) {
        const firstLine = chapter.locator(".verse-line").first();
        await expect(firstLine).toHaveAttribute("aria-label", "至虚极也，守静督也。");
        expect(await firstLine.locator("rt").allTextContents()).toEqual(["zhì", "xū", "jí", "yě", "shǒu", "jìng", "dū", "yě"]);
      }

      const copyLine = id === 81
        ? chapter.locator(".verse-line").first()
        : chapter.locator('.verse-line[data-copy-text*="〔"]').first();
      const expectedCopy = await copyLine.getAttribute("data-copy-text");
      await copyLine.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
      await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCopy);
    }
  }
});

test("shared inspiration is bilingual and remains visible without a life-manual profile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "目录", exact: true }).click();
  await page.locator('.directory-item[data-chapter-id="8"]').click();
  const chapter = page.locator('.chapter-current[data-chapter-id="8"]');
  await expect(chapter.getByRole("heading", { name: "对我们的启发", exact: true })).toBeVisible();
  await expect(chapter.getByText(/向下不等于失败/)).toBeVisible();
  await expect(chapter.getByRole("heading", { name: "你的人生说明书", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(chapter.getByRole("heading", { name: "What this teaches us", exact: true })).toBeVisible();
  await expect(chapter.getByText(/going low is not failure/)).toBeVisible();
  await expect(chapter.getByRole("heading", { name: "Your life manual", exact: true })).toHaveCount(0);
});

test("keeps verified chapter life-manual guidance personal and separate from today's practice", async ({ page }) => {
  await page.addInitScript((storedChart) => {
    window.localStorage.setItem("wendao-chart-snapshot", JSON.stringify(storedChart));
  }, chartSnapshot);
  await page.goto("/?chapter=21&lang=zh");

  const chapter = page.locator('.chapter-current[data-chapter-id="21"]');
  const manual = chapter.locator('[data-share-section="manual"]');
  const practice = chapter.locator(".practice-card");
  await expect(manual).toContainText("生产者、5/1人生角色");
  await expect(manual).toContainText("方向比一时的技巧更重要");
  await expect(manual).toContainText("等待回应");
  await expect(manual).toContainText("荐骨权威");
  await expect(manual).toContainText("身体是否有持续的“愿意”");
  await expect(manual).not.toContainText("三次慢呼吸");
  await expect(manual).not.toContainText("写下一个");
  await expect(practice).toContainText("三次慢呼吸");

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(manual).toContainText("Generator with a 5/1 profile");
  await expect(manual).toContainText("Direction matters more than a momentary technique");
  await expect(manual).toContainText("Wait to respond");
  await expect(manual).toContainText("Sacral authority");
  await expect(manual).not.toContainText("three slow breaths");
  await expect(practice).toContainText("three slow breaths");
});

test("sets an honest expectation for future AI personalization", async ({ page }) => {
  await page.addInitScript((storedChart) => {
    window.localStorage.setItem("wendao-chart-snapshot", JSON.stringify(storedChart));
  }, chartSnapshot);
  await page.route("https://pluto-human-design-api.vercel.app/**", async (route) => {
    await route.fulfill({ json: { data: { saved: true }, error: null } });
  });
  await page.goto("/");

  const question = page.getByLabel("向三慢问道提问");
  await expect(page.getByText("AI 个性化回应 · 即将接入", { exact: true })).toBeVisible();
  await expect(question).toHaveAttribute("aria-describedby", "composer-expectation");

  await page.getByRole("button", { name: "切换到英文", exact: true }).click();
  await expect(page.getByText("AI personalization · coming soon", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Switch to Chinese", exact: true }).click();

  await question.fill("我现在应该继续还是停下来？");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText("AI 个性化回应即将接入", { exact: true })).toBeVisible();
  await expect(page.getByText(/当前为体验版回应。接入大模型后/)).toBeVisible();
});

test("searches all textual layers from the directory", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "目录", exact: true }).click();
  const search = page.getByRole("search", { name: "搜索章节" });
  const input = search.getByRole("searchbox", { name: "搜索章节" });

  await input.fill("上善如水");
  await expect(page.locator(".directory-item")).toHaveCount(1);
  await expect(page.locator('.directory-item[data-chapter-id="8"]')).toBeVisible();

  await input.fill("非常道");
  await expect(page.locator('.directory-item[data-chapter-id="1"]')).toBeVisible();
  await expect(search.getByText(/找到 \d+ 章/)).toBeVisible();

  await input.fill("绝不会存在的搜索词");
  await expect(page.getByText("没有找到相关章节，换一个词试试。", { exact: true })).toBeVisible();
});

test("uses compact header icons and keeps one-result search above a reduced viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const languageToggle = page.getByRole("button", { name: "切换到英文", exact: true });
  const searchButton = page.getByRole("button", { name: "搜索章节", exact: true });
  await expect(languageToggle.locator("svg")).toHaveCount(1);
  await expect(searchButton.locator("svg")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveCount(0);

  await searchButton.click();
  const input = page.getByRole("searchbox", { name: "搜索章节" });
  await expect(input).toBeFocused();
  const sheet = page.locator(".web-sheet.is-directory-sheet");
  const initialHeight = await sheet.evaluate((element) => element.getBoundingClientRect().height);

  await input.fill("上善如水");
  await expect(page.locator(".directory-item")).toHaveCount(1);
  await expect(page.locator('.directory-item[data-chapter-id="8"]')).toBeVisible();
  const filteredHeight = await sheet.evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(filteredHeight - initialHeight)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 520 });
  await expect.poll(() => sheet.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.max(0, bounds.bottom - window.innerHeight);
  })).toBe(0);
  const reducedLayout = await page.evaluate(() => {
    const searchField = document.querySelector<HTMLElement>(".directory-search-field")!;
    const result = document.querySelector<HTMLElement>(".directory-item")!;
    return {
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      searchBottom: searchField.getBoundingClientRect().bottom,
      resultBottom: result.getBoundingClientRect().bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(reducedLayout.documentOverflow).toBeLessThanOrEqual(0);
  expect(reducedLayout.searchBottom).toBeLessThan(reducedLayout.viewportHeight);
  expect(reducedLayout.resultBottom).toBeLessThan(reducedLayout.viewportHeight);
});

test("keeps the Chinese wordmark on one line at iPhone X width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const wordmark = page.getByRole("button", { name: "三慢问道", exact: true });
  await expect(wordmark).toHaveCSS("white-space", "nowrap");
  const textLineCount = await wordmark.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  });
  expect(textLineCount).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

for (const width of [320, 390, 720]) {
  test(`${width}px reading has no horizontal overflow or detached punctuation`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("article.chapter")).toHaveCount(1);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - window.innerWidth,
      reading: document.querySelector<HTMLElement>("[data-testid='mobile-scroll']")!.scrollWidth
        - document.querySelector<HTMLElement>("[data-testid='mobile-scroll']")!.clientWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(0);
    expect(overflow.reading).toBeLessThanOrEqual(0);
    await expect(page.locator(".verse-line-ruby > .verse-punctuation")).toHaveCount(0);
  });

  test(`${width}px share sheet fixes tabs and actions while only the full poster scrolls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?chapter=64&lang=zh");
    await page.locator(".chapter-current .chapter-share-quick").click();
    const previewImage = page.locator(".share-card-preview img");
    await expect(previewImage).toBeVisible();
    const originalImageSource = await previewImage.getAttribute("src");
    await page.getByRole("tab", { name: "解读" }).click();
    await expect(page.getByRole("button", { name: "分享链接" })).toHaveAttribute("data-share-link", /section=meaning/);
    await expect.poll(() => previewImage.getAttribute("src")).not.toBe(originalImageSource);
    await expect.poll(() => previewImage.evaluate((image: HTMLImageElement) => image.naturalHeight)).toBeGreaterThan(2340);
    const overflow = await page.evaluate(() => {
      const sheet = document.querySelector<HTMLElement>(".web-sheet.is-share-sheet")!;
      const bounds = sheet.getBoundingClientRect();
      return {
        document: document.documentElement.scrollWidth - window.innerWidth,
        left: Math.min(0, bounds.left),
        right: Math.max(0, bounds.right - window.innerWidth),
      };
    });
    expect(overflow.document).toBeLessThanOrEqual(0);
    expect(overflow.left).toBe(0);
    expect(overflow.right).toBe(0);
    const sheetContent = page.locator(".web-sheet.is-share-sheet .web-sheet-content");
    const scrollSurface = page.getByTestId("share-card-preview-scroll");
    const preview = page.locator(".share-card-preview");
    await expect(sheetContent).toHaveCSS("overflow-y", "hidden");
    await expect(scrollSurface).toHaveCSS("overflow-y", "auto");
    expect(await preview.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    await expect.poll(() => scrollSurface.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
    if (width <= 560) {
      expect((await preview.boundingBox())!.width).toBeGreaterThanOrEqual(width * 0.7);
    }
    await expect(page.locator(".share-action-feedback")).toHaveCount(0);
    const fixedBefore = await page.evaluate(() => {
      const tabs = document.querySelector<HTMLElement>(".share-kind-tabs")!.getBoundingClientRect();
      const controls = document.querySelector<HTMLElement>(".share-card-controls")!.getBoundingClientRect();
      const sheet = document.querySelector<HTMLElement>(".web-sheet.is-share-sheet")!.getBoundingClientRect();
      return {
        tabsTop: tabs.top,
        controlsTop: controls.top,
        controlsBottom: controls.bottom,
        sheetTop: sheet.top,
        sheetBottom: sheet.bottom,
      };
    });
    await scrollSurface.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const fixedAfter = await page.evaluate(() => {
      const tabs = document.querySelector<HTMLElement>(".share-kind-tabs")!.getBoundingClientRect();
      const controls = document.querySelector<HTMLElement>(".share-card-controls")!.getBoundingClientRect();
      return { tabsTop: tabs.top, controlsTop: controls.top, controlsBottom: controls.bottom };
    });
    expect(Math.abs(fixedAfter.tabsTop - fixedBefore.tabsTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(fixedAfter.controlsTop - fixedBefore.controlsTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(fixedAfter.controlsBottom - fixedBefore.controlsBottom)).toBeLessThanOrEqual(1);
    expect(fixedBefore.tabsTop).toBeGreaterThanOrEqual(fixedBefore.sheetTop);
    expect(fixedBefore.controlsBottom).toBeLessThanOrEqual(fixedBefore.sheetBottom + 1);
    expect(await scrollSurface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.getByRole("tab", { name: "启发" }).click();
    await expect(page.locator(".share-card-preview img")).toBeVisible();
    await expect.poll(() => scrollSurface.evaluate((element) => element.scrollTop)).toBeLessThanOrEqual(1);
    for (const button of await page.locator(".share-action-grid button").all()) {
      await expect(button).toHaveCSS("flex-direction", "row");
      expect((await button.boundingBox())!.height).toBeLessThanOrEqual(40);
    }
  });
}
