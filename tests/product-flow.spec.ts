import { expect, test } from "@playwright/test";

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

  await expect(page.getByText("计算结果", { exact: true })).toBeVisible();
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
  await expect(page.locator("article.chapter")).toHaveCount(2);

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect.poll(async () => reading.evaluate((element) => element.scrollTop)).toBeLessThan(4);

  await page.locator("button.header-menu-button").click();
  await page.getByRole("button", { name: "L", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect.poll(async () => reading.evaluate((element) => element.scrollTop)).toBeLessThan(4);
});

test("covers all 81 chapters through contents, chance, and progressive reading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect(page.locator("article.chapter")).toHaveAttribute("data-chapter-id", "8");

  await page.getByRole("button", { name: "目录", exact: true }).click();
  const directoryItems = page.locator(".directory-item");
  await expect(directoryItems).toHaveCount(81);
  const ids = await directoryItems.evaluateAll((items) => items.map((item) => Number(item.getAttribute("data-chapter-id"))).sort((a, b) => a - b));
  expect(ids).toEqual(Array.from({ length: 81 }, (_, index) => index + 1));

  await page.locator('.directory-item[data-chapter-id="80"]').click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect(page.locator("article.chapter")).toHaveAttribute("data-chapter-id", "80");

  await page.getByRole("button", { name: "偶遇一章", exact: true }).click();
  await expect(page.locator("article.chapter")).toHaveCount(1);
  await expect(page.locator('article.chapter[data-chapter-id="80"]')).toHaveCount(0);

  const reading = page.getByTestId("mobile-scroll");
  await reading.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator("article.chapter")).toHaveCount(2);
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
}
