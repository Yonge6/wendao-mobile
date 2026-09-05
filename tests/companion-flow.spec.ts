import { expect, test } from "@playwright/test";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const threadA = "33333333-3333-4333-8333-333333333333";
const threadB = "44444444-4444-4444-8444-444444444444";

test.beforeEach(async ({ page }) => {
  await page.route("https://history-fixture.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const isB = url.searchParams.get("user_id") === `eq.${userB}`;
    let data: unknown = [];
    if (url.pathname.endsWith("wendao_entitlements")) data = { status: "active", source: "apple", expires_at: null };
    if (url.pathname.endsWith("wendao_threads")) data = [{ id: isB ? threadB : threadA, title: isB ? "B 的专属对话" : "A 的项目交接", chapter_id: 64, locale: "zh", last_message_at: "2026-09-05T01:00:00Z" }];
    if (url.pathname.endsWith("wendao_messages")) {
      expect(url.searchParams.get("thread_id")).toBe(`eq.${isB ? threadB : threadA}`);
      data = [
        { id: "answer", role: "assistant", content: isB ? "B 的专属回应" : "A 的历史回应。".repeat(80), chapter_id: 64, created_at: "2026-09-05T01:00:00Z" },
        { id: "question", role: "user", content: isB ? "B 的问题" : "A 的项目怎么收尾？", chapter_id: 64, created_at: "2026-09-05T01:00:00Z" },
      ];
    }
    await route.fulfill({ json: data });
  });
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    const scope = window as typeof window & { streamController?: ReadableStreamDefaultController<Uint8Array>; askRequests: unknown[]; emitAnswer?: (event: string, data: unknown) => void };
    scope.askRequests = [];
    window.fetch = async (input, init) => {
      if (String(input).startsWith("https://api.wendao.test/api/companion/respond")) {
        scope.askRequests.push(JSON.parse(String(init?.body)));
        return new Response(new ReadableStream({ start(controller) {
          scope.streamController = controller;
          init?.signal?.addEventListener("abort", () => { try { controller.error(new DOMException("Aborted", "AbortError")); } catch {} }, { once: true });
        } }), { headers: { "content-type": "text/event-stream" } });
      }
      return originalFetch(input, init);
    };
    scope.emitAnswer = (event, data) => {
      scope.streamController!.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      if (event === "done" || event === "error") scope.streamController!.close();
    };
  });
});

test("restores cloud history after reload and never shows the previous account's messages", async ({ page }) => {
  await page.goto("/tests/companion-fixture.html");
  await expect(page.locator(".companion-conversation")).toContainText("A 的历史回应");
  await expect(page.locator(".companion-conversation article").first()).toContainText("A 的项目怎么收尾");
  await page.reload();
  await expect(page.locator(".companion-conversation")).toContainText("A 的历史回应");
  await page.getByRole("button", { name: "分享图片", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("fixture-shared-answer")!).chapterId)).toBe(64);
  await page.getByRole("button", { name: "Switch fixture account" }).click();
  await expect(page.locator(".companion-conversation")).not.toContainText("A 的历史回应");
  await expect(page.locator(".companion-conversation")).toContainText("B 的专属回应");
  await expect(page.locator(".companion-conversation article")).toHaveCount(2);
});

test("new conversation preserves saved history and history selection resumes its thread", async ({ page }) => {
  await page.goto("/tests/companion-fixture.html");
  await expect(page.locator(".companion-conversation")).toBeVisible();
  await page.getByRole("button", { name: "新对话", exact: true }).click();
  await expect(page.locator(".companion-conversation")).toHaveCount(0);
  await page.getByRole("button", { name: "最近对话", exact: true }).click();
  await page.getByRole("button", { name: /A 的项目交接/ }).click();
  await expect(page.locator(".companion-conversation")).toContainText("A 的历史回应");
  await page.getByLabel("此刻，你真正想问什么？").fill("接着聊");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).askRequests[0]?.threadId)).toBe(threadA);
});

test("streaming respects reading position and retries the same exchange without duplicate bubbles", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/companion-fixture.html");
  await expect(page.locator(".companion-conversation")).toBeVisible();
  await page.getByLabel("此刻，你真正想问什么？").fill("接着聊项目");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).askRequests.length)).toBe(1);
  await page.evaluate(() => (window as any).emitAnswer("delta", { text: "新的回应。".repeat(100) }));
  const scroll = page.locator(".companion-thread");
  await scroll.evaluate((element) => { element.scrollTop = 100; element.dispatchEvent(new Event("scroll")); });
  await expect(page.getByRole("button", { name: "↓ 回到最新回应" })).toBeVisible();
  const top = await scroll.evaluate((element) => element.scrollTop);
  const composerTop = (await page.locator(".companion-compose-zone").boundingBox())!.y;
  await page.evaluate(() => (window as any).emitAnswer("delta", { text: "后续流式文字。".repeat(30) }));
  await expect(page.locator(".companion-conversation")).toContainText("后续流式文字");
  expect(await scroll.evaluate((element) => element.scrollTop)).toBe(top);
  await page.getByRole("button", { name: "↓ 回到最新回应" }).click();
  expect((await page.locator(".companion-compose-zone").boundingBox())!.y).toBe(composerTop);
  await page.evaluate(() => (window as any).emitAnswer("error", { message: "network interrupted" }));
  await page.getByRole("button", { name: "重新回答", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).askRequests.length)).toBe(2);
  expect(await page.evaluate(() => (window as any).askRequests[1])).toEqual(await page.evaluate(() => (window as any).askRequests[0]));
  await expect(page.locator(".companion-conversation article")).toHaveCount(4);
  await page.evaluate(() => { (window as any).emitAnswer("delta", { text: "恢复后的完整回应" }); (window as any).emitAnswer("done", { threadId: "33333333-3333-4333-8333-333333333333" }); });
  await expect(page.locator(".companion-conversation article").last()).toContainText("恢复后的完整回应");
  await expect(page.locator(".companion-conversation article").last()).not.toContainText("后续流式文字");
  await page.screenshot({ path: testInfo.outputPath("companion-restored-stream.png") });
});

test("history failures are visible and cannot silently send into a new thread", async ({ page }) => {
  await page.route("**/rest/v1/wendao_threads?**", (route) => route.fulfill({ status: 503, json: { message: "offline" } }));
  await page.goto("/tests/companion-fixture.html");
  await expect(page.getByText(/暂时没能读取对话/)).toBeVisible({ timeout: 12_000 });
  await expect(page.getByRole("button", { name: "发送问题" })).toBeDisabled();
  await page.getByRole("button", { name: "新对话", exact: true }).click();
  await expect(page.getByLabel("此刻，你真正想问什么？")).toBeEnabled();
});

test("late history cannot overwrite a new conversation or a switched account", async ({ page }) => {
  let release: (() => Promise<void>) | undefined;
  await page.route("**/rest/v1/wendao_messages?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("user_id") !== `eq.${userA}`) return route.fallback();
    await new Promise<void>((resolve) => {
      release = async () => { await route.fulfill({ json: [{ id: "old", role: "assistant", content: "旧账号迟到的数据" }] }).catch(() => {}); resolve(); };
    });
  });
  await page.goto("/tests/companion-fixture.html");
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByRole("button", { name: "新对话", exact: true }).click();
  await release!();
  await expect(page.locator(".companion-empty")).toBeVisible();
  await expect(page.locator(".companion-home")).not.toContainText("旧账号迟到的数据");
  await page.getByRole("button", { name: "Switch fixture account" }).click();
  await expect(page.locator(".companion-conversation")).toContainText("B 的专属回应");
  await expect(page.locator(".companion-home")).not.toContainText("旧账号迟到的数据");
});

test("stopping an answer preserves partial text and allows retry in place", async ({ page }) => {
  await page.goto("/tests/companion-fixture.html");
  await expect(page.locator(".companion-conversation")).toBeVisible();
  await page.getByLabel("此刻，你真正想问什么？").fill("继续看看项目");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).askRequests.length)).toBe(1);
  await page.evaluate(() => (window as any).emitAnswer("delta", { text: "已经收到的部分" }));
  await page.getByRole("button", { name: "停止回答", exact: true }).click();
  await expect(page.locator(".companion-conversation article").last()).toContainText("已经收到的部分");
  await expect(page.locator(".companion-conversation article").last()).toContainText("回答已停止");
  await expect(page.getByRole("button", { name: "新对话", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "重新回答", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).askRequests.length)).toBe(2);
  await expect(page.locator(".companion-conversation article")).toHaveCount(4);
});

for (const viewport of [
  { width: 320, height: 640, lang: "zh" },
  { width: 768, height: 1024, lang: "en" },
  { width: 1024, height: 768, lang: "zh" },
  { width: 375, height: 700, lang: "en" },
]) {
  test(`authenticated companion fits ${viewport.width}x${viewport.height} ${viewport.lang}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(`/tests/companion-fixture.html?lang=${viewport.lang}`);
    await expect(page.locator(".companion-conversation")).toBeVisible();
    for (const selector of [".companion-history-toolbar", ".companion-thread", ".companion-question-control"]) {
      const bounds = (await page.locator(selector).boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.getByRole("button", { name: viewport.lang === "zh" ? "最近对话" : "Recent chats", exact: true }).click();
    await expect(page.locator(".companion-history-list")).toContainText("A 的项目交接");
    await page.screenshot({ path: testInfo.outputPath("companion-history-layout.png") });
  });
}
