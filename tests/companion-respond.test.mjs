import assert from "node:assert/strict";
import test from "node:test";

import {
  handleCompanionRequest,
  readDeepSeekText,
} from "../api/companion/respond.mjs";

const environment = {
  publicOrigins: ["https://wendao.wonderelian.com"],
  monthlyQuestionAllowance: 60,
};
const userId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

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

test("streams a grounded answer and saves it after reserving quota", async () => {
  const actions = [];
  const store = {
    reserveQuestion: async () => ({ state: "reserved", remainingQuestions: 59 }),
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
  assert.match(modelMessages[0].content, /慎终如始/);
  assert.equal(actions[0].answer, "先检查交接，再完成退出。");
  assert.equal(actions[1].memories[0].summary, "正在收尾一个项目");
  assert.notEqual(actions.at(-1), "released");
});

test("immediate safety help requires sign-in but does not consume quota", async () => {
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
      reserveQuestion: async () => ({ state: "succeeded", remainingQuestions: 59 }),
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
