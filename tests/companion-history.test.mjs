import assert from "node:assert/strict";
import test from "node:test";
import { loadRecentThreads, loadThreadMessages } from "../src/companion/history.ts";

function fakeClient(data, error = null) {
  const calls = [];
  const query = {};
  for (const method of ["from", "select", "eq", "order", "limit", "abortSignal"]) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  query.then = (resolve) => resolve({ data, error });
  return { client: query, calls };
}

test("history always scopes bounded queries to the current account and supports cancellation", async () => {
  const { client, calls } = fakeClient([]);
  const signal = new AbortController().signal;
  await loadRecentThreads(client, "account-a", signal);
  assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === "account-a"));
  assert.ok(calls.some((call) => call[0] === "limit" && call[1] === 20));
  assert.ok(calls.some((call) => call[0] === "abortSignal" && call[1] === signal));
  await assert.rejects(loadRecentThreads(client, "", signal));
});
test("message history is scoped to both owner and thread and ordered oldest first", async () => {
  const { client, calls } = fakeClient([{ role: "assistant", content: "answer" }, { role: "user", content: "question" }]);
  const result = await loadThreadMessages(client, "account-b", "thread-b", new AbortController().signal);
  assert.deepEqual(result.map((row) => row.role), ["user", "assistant"]);
  assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === "account-b"));
  assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "thread_id" && call[2] === "thread-b"));
  assert.ok(calls.some((call) => call[0] === "limit" && call[1] === 40));
  assert.ok(calls.some((call) => call[0] === "order" && call[1] === "role" && call[2].ascending));
});
test("failed history loading is not silently treated as an empty conversation", async () => {
  const { client } = fakeClient(null, new Error("offline"));
  await assert.rejects(loadRecentThreads(client, "a", new AbortController().signal), /offline/);
  await assert.rejects(loadThreadMessages(client, "a", "b", new AbortController().signal), /offline/);
});
