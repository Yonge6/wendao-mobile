import assert from "node:assert/strict";
import test from "node:test";

import {
  handleCompanionRequest,
  readDeepSeekText,
} from "../api/companion/respond.mjs";

const environment = {
  publicOrigins: ["https://wendao.wonderelian.com"],
};
const userId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

test("distinguishes a released reservation from an in-progress request before any model call", async () => {
  for (const [state, code] of [["released", "request_released"], ["pending", "request_in_progress"]]) {
    const response = await handleCompanionRequest(request("项目怎么收尾？"), {
      environment,
      authenticate: async () => ({ id: userId }),
      store: { reserveQuestion: async () => ({ state, questionsThisMonth: 0 }) },
    });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error.code, code);
  }
});

function request(question, overrides = {}) {
  return new Request("https://api.example/companion/respond", {
    method: "POST",
    headers: {
      authorization: "Bearer session",
      "content-type": "application/json",
      origin: "https://wendao.wonderelian.com",
    },
    body: JSON.stringify({
      requestId,
      chapterId: 64,
      locale: "zh",
      question,
      ...overrides,
    }),
  });
}

function providerStream(parts) {
  const body = parts
    .map((content) => `data: ${JSON.stringify({ model: "deepseek-v4-pro", choices: [{ delta: { content } }] })}\n\n`)
    .join("") + "data: [DONE]\n\n";
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}

test("extracts only visible content from DeepSeek SSE", async () => {
  const response = new Response(
    `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: "hidden" } }] })}\n\n`
      + `data: ${JSON.stringify({ model: "deepseek-v4-pro", choices: [{ delta: { content: "Visible" } }] })}\n\n`
      + "data: [DONE]\n\n",
  );
  const deltas = [];
  const result = await readDeepSeekText(response.body, (text) => deltas.push(text));
  assert.deepEqual(result, { answer: "Visible", model: "deepseek-v4-pro" });
  assert.deepEqual(deltas, ["Visible"]);
});

test("streams a grounded answer and saves it after reserving usage", async () => {
  const actions = [];
  const store = {
    reserveQuestion: async () => ({ state: "reserved", questionsThisMonth: 61 }),
    getContext: async () => ({ memoryEnabled: true, memories: [], lifeManual: null }),
    getRecentMessages: async () => [],
    finishExchange: async (exchange) => {
      actions.push(exchange);
      return { threadId: "33333333-3333-4333-8333-333333333333", answerMessageId: "44444444-4444-4444-8444-444444444444" };
    },
    applyMemoryCandidates: async (_userId, _threadId, memories) => actions.push({ memories }),
    releaseQuestion: async () => actions.push("released"),
  };
  let modelMessages;
  const response = await handleCompanionRequest(request("这个项目怎样收尾？"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store,
    loadChapter: async () => ({ id: 64, text: ["慎终如始"], theme: "慎终如始" }),
    provider: {
      visible: async (messages) => {
        modelMessages = messages;
        return providerStream(["先检查交接，", "再完成退出。"]);
      },
      background: async () => ({
        data: { memories: [{ kind: "current_situation", summary: "正在收尾一个项目", confidence: 0.8 }] },
      }),
    },
  });
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /event: delta/);
  assert.match(stream, /先检查交接/);
  assert.match(stream, /event: done/);
  assert.match(stream, /"unlimited":true/);
  assert.match(stream, /"questionsThisMonth":61/);
  assert.match(modelMessages[0].content, /慎终如始/);
  assert.equal(actions[0].answer, "先检查交接，再完成退出。");
  assert.equal(actions[1].memories[0].summary, "正在收尾一个项目");
  assert.notEqual(actions.at(-1), "released");
});

test("opens the response stream before the visible model finishes connecting", async () => {
  let resolveProvider;
  const pendingProvider = new Promise((resolve) => { resolveProvider = resolve; });
  const response = await Promise.race([
    handleCompanionRequest(request("先做哪一步？"), {
      environment,
      authenticate: async () => ({ id: userId }),
      store: {
        reserveQuestion: async () => ({ state: "reserved", questionsThisMonth: 1 }),
        getContext: async () => ({ memoryEnabled: false, memories: [], lifeManual: null }),
        getRecentMessages: async () => [],
        finishExchange: async () => ({ threadId: "33333333-3333-4333-8333-333333333333", answerMessageId: "44444444-4444-4444-8444-444444444444" }),
        releaseQuestion: async () => undefined,
      },
      loadChapter: async () => ({ id: 64, text: ["慎终如始"], theme: "慎终如始" }),
      provider: {
        visible: async () => pendingProvider,
        background: async () => ({ data: { memories: [] } }),
      },
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("stream did not open")), 80)),
  ]);

  const reader = response.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /"phase":"preparing"/);
  resolveProvider(providerStream(["先完成最小的交接检查。"]));
  while (!(await reader.read()).done) {
    // Drain the response so the async save path completes.
  }
});

test("falls back when the visible model stream stalls before sending answer text", async () => {
  let fallbackCalled = false;
  const response = await handleCompanionRequest(request("收尾时先做什么？"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      reserveQuestion: async () => ({ state: "reserved", questionsThisMonth: 2 }),
      getContext: async () => ({ memoryEnabled: false, memories: [], lifeManual: null }),
      getRecentMessages: async () => [],
      finishExchange: async () => ({
        threadId: "33333333-3333-4333-8333-333333333333",
        answerMessageId: "44444444-4444-4444-8444-444444444444",
      }),
      releaseQuestion: async () => undefined,
    },
    loadChapter: async () => ({ id: 64, text: ["慎终如始"], theme: "慎终如始" }),
    provider: {
      visible: async () => new Response(new ReadableStream({
        start(controller) {
          controller.error(new Error("stream stalled"));
        },
      })),
      visibleFallback: async () => {
        fallbackCalled = true;
        return providerStream(["先用接收者视角，", "完整走一遍交接。"]);
      },
      background: async () => ({ data: { memories: [] } }),
    },
  });

  const stream = await response.text();
  assert.equal(fallbackCalled, true);
  assert.match(stream, /"phase":"fallback"/);
  assert.match(stream, /先用接收者视角/);
  assert.match(stream, /event: done/);
});

test("immediate safety help requires sign-in but does not record question use", async () => {
  let reserved = false;
  const response = await handleCompanionRequest(request("我现在想自杀，已经准备好了"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: { reserveQuestion: async () => { reserved = true; } },
  });
  assert.equal(response.status, 200);
  assert.equal(reserved, false);
  assert.match(await response.text(), /"charged":false/);
});

test("replays a saved answer without calling the model", async () => {
  let calledModel = false;
  const response = await handleCompanionRequest(request("这个项目怎样收尾？"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      reserveQuestion: async () => ({ state: "succeeded", questionsThisMonth: 61 }),
      getCompletedExchange: async () => ({
        answer: "已保存的回答",
        threadId: "33333333-3333-4333-8333-333333333333",
        answerMessageId: "44444444-4444-4444-8444-444444444444",
      }),
    },
    provider: { visible: async () => { calledModel = true; } },
  });
  assert.equal(calledModel, false);
  const stream = await response.text();
  assert.match(stream, /已保存的回答/);
  assert.match(stream, /replayed/);
});
