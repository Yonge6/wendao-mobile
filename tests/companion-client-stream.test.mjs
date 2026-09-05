import assert from "node:assert/strict";
import test from "node:test";

import { readCompanionEvents, streamCompanionAnswer } from "../src/companion/api.ts";

test("only a confirmed released request may rotate its id, once, without losing context", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let replacementId;
  try {
    globalThis.fetch = async (_url, init) => {
      calls.push(JSON.parse(init.body));
      if (calls.length === 1) return Response.json({ error: { code: "request_released" } }, { status: 409 });
      return new Response('event: delta\ndata: {"text":"restored"}\n\nevent: done\ndata: {}\n\n');
    };
    await streamCompanionAnswer({ apiUrl: "https://test.invalid", accessToken: "test", requestId: "original", threadId: "owned", chapterId: 64, locale: "zh", question: "继续", handlers: {}, onRequestIdChanged: (id) => { replacementId = id; } });
    assert.equal(calls.length, 2);
    assert.notEqual(replacementId, "original");
    assert.deepEqual(calls[1], { ...calls[0], requestId: replacementId });
    calls.length = 0;
    globalThis.fetch = async () => { calls.push("pending"); return Response.json({ error: { code: "request_in_progress" } }, { status: 409 }); };
    await assert.rejects(streamCompanionAnswer({ apiUrl: "https://test.invalid", accessToken: "test", requestId: "original", chapterId: 64, locale: "zh", question: "继续", handlers: {} }), (error) => error.code === "request_in_progress");
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test("browser stream parser handles event boundaries split across chunks", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: meta\ndata: {"unlimited":true,"questionsThisMonth":61}\n'));
      controller.enqueue(encoder.encode('\nevent: delta\ndata: {"text":"慢"}\n\n'));
      controller.enqueue(encoder.encode('event: delta\ndata: {"text":"下来"}\n\nevent: done\ndata: {"threadId":"thread-1"}\n\n'));
      controller.close();
    },
  });
  const seen = [];
  await readCompanionEvents(body, {
    meta: (data) => seen.push(["meta", data]),
    delta: (data) => seen.push(["delta", data]),
    done: (data) => seen.push(["done", data]),
  });
  assert.deepEqual(seen, [
    ["meta", { unlimited: true, questionsThisMonth: 61 }],
    ["delta", { text: "慢" }],
    ["delta", { text: "下来" }],
    ["done", { threadId: "thread-1" }],
  ]);
});
