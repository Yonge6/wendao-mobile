import assert from "node:assert/strict";
import test from "node:test";

import { readCompanionEvents } from "../src/companion/api.ts";

test("browser stream parser handles event boundaries split across chunks", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: meta\ndata: {"remainingQuestions":59}\n'));
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
    ["meta", { remainingQuestions: 59 }],
    ["delta", { text: "慢" }],
    ["delta", { text: "下来" }],
    ["done", { threadId: "thread-1" }],
  ]);
});
