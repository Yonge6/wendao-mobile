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

test("native conversation delivers text before completion and forwards cancellation to WebKit", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const abort = new AbortController();
  const encoder = new TextEncoder();
  let stream;
  let requestSignal;
  let received;
  let finished = false;
  const firstText = new Promise((resolve) => { received = resolve; });
  try {
    globalThis.fetch = async () => { throw new Error("Buffered native HTTP must not handle SSE"); };
    globalThis.window = { CapacitorWebFetch: async (_url, init) => {
      requestSignal = init.signal;
      return new Response(new ReadableStream({ start(controller) {
        stream = controller;
        init.signal.addEventListener("abort", () => controller.error(init.signal.reason));
      } }));
    } };
    const result = streamCompanionAnswer({ apiUrl: "https://test.invalid", accessToken: "test", requestId: "native", chapterId: 31, locale: "zh", question: "祝福", signal: abort.signal, handlers: { delta: ({ text }) => received(text) } }).finally(() => { finished = true; });
    // Attach rejection before abort so the test never creates an unhandled promise.
    const settled = result.then(() => null, (error) => error);
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(stream, "SSE must use the original WebKit fetch, not the buffering bridge");
    stream.enqueue(encoder.encode('event: delta\ndata: {"text":"老师，节日快乐。"}\n\n'));
    assert.equal(await firstText, "老师，节日快乐。");
    assert.equal(finished, false);
    abort.abort();
    assert.equal(requestSignal.aborted, true);
    assert.equal((await settled).name, "AbortError");
  } finally { globalThis.fetch = originalFetch; globalThis.window = originalWindow; }
});

const requestInput = { apiUrl: "https://test.invalid", accessToken: "test", requestId: "older-webkit", chapterId: 31, locale: "zh", question: "继续", handlers: {} };

test("older WebKit completes SSE without newer static AbortSignal APIs and removes its listener", async (context) => {
  context.mock.method(AbortSignal, "any", () => { throw new Error("Not available in older WebKit"); });
  context.mock.method(AbortSignal, "timeout", () => { throw new Error("Not available in older WebKit"); });
  context.mock.method(globalThis, "fetch", async () => new Response('event: delta\ndata: {"text":"完成"}\n\nevent: done\ndata: {}\n\n'));
  const parent = new AbortController();
  const remove = context.mock.method(parent.signal, "removeEventListener");
  const seen = [];
  await streamCompanionAnswer({ ...requestInput, signal: parent.signal, handlers: { delta: ({ text }) => seen.push(text) } });
  assert.deepEqual(seen, ["完成"]);
  assert.equal(remove.mock.calls.filter(({ arguments: args }) => args[0] === "abort").length, 1);
});

test("cancellation settles stalled response headers even when a transport ignores abort", async (context) => {
  let requestSignal;
  context.mock.method(globalThis, "fetch", (_url, init) => {
    requestSignal = init.signal;
    return new Promise(() => {});
  });
  const parent = new AbortController();
  const result = streamCompanionAnswer({ ...requestInput, signal: parent.signal });
  const reason = new DOMException("Reader closed", "AbortError");
  const rejected = assert.rejects(result, (error) => error === reason);
  parent.abort(reason);
  await rejected;
  assert.equal(requestSignal.aborted, true);
});

test("the 75-second deadline ends stalled headers and rejects a late response body", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let resolveFetch;
  let requestSignal;
  let cancelled = 0;
  context.mock.method(globalThis, "fetch", (_url, init) => {
    requestSignal = init.signal;
    return new Promise((resolve) => { resolveFetch = resolve; });
  });
  const result = streamCompanionAnswer(requestInput);
  const rejected = assert.rejects(result, (error) => error.name === "TimeoutError" && /timed out/.test(error.message));
  context.mock.timers.tick(75_000);
  await rejected;
  assert.equal(requestSignal.aborted, true);
  resolveFetch(new Response(new ReadableStream({ cancel() { cancelled += 1; } })));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cancelled, 1);
});

test("a deadline covers a stalled SSE body, cancels its reader and prevents later output", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const encoder = new TextEncoder();
  let cancelReason;
  context.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(encoder.encode('event: delta\ndata: {"text":"已经收到的部分"}\n\n')); },
    cancel(reason) { cancelReason = reason; },
  })));
  const seen = [];
  const result = streamCompanionAnswer({ ...requestInput, handlers: { delta: ({ text }) => seen.push(text) } });
  const rejected = assert.rejects(result, (error) => error.name === "TimeoutError");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen, ["已经收到的部分"]);
  context.mock.timers.tick(75_000);
  await rejected;
  assert.equal(cancelReason.name, "TimeoutError");
  assert.deepEqual(seen, ["已经收到的部分"]);
});
