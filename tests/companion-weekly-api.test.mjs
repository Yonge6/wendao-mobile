import assert from "node:assert/strict";
import test from "node:test";

import { handleWeeklyReflectionRequest } from "../api/companion/weekly-reflection.mjs";

const environment = { publicOrigins: ["https://wendao.wonderelian.com"] };
const authenticate = async () => ({ id: "11111111-1111-4111-8111-111111111111" });
const week = () => ({ start: "2026-08-17", end: "2026-08-24", since: "2026-08-10T00:00:00.000Z" });

function request(method, body) {
  return new Request("https://api.example/api/companion/weekly-reflection", {
    method,
    headers: {
      authorization: "Bearer session",
      origin: "https://wendao.wonderelian.com",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function providerStream(text) {
  return new Response(`data: ${JSON.stringify({ model: "deepseek-v4-pro", choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`);
}

test("reads an existing current-week reflection without generation", async () => {
  const response = await handleWeeklyReflectionRequest(request("GET"), {
    environment,
    authenticate,
    calendarWeek: week,
    store: { getWeeklyReflection: async () => ({ id: "weekly-1", content: "A quiet week" }) },
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /A quiet week/);
});

test("generates and stores a weekly reflection without question quota", async () => {
  const actions = [];
  const store = {
    getWeeklyReflection: async () => null,
    getEntitlement: async () => ({ status: "active", expires_at: "2026-09-01T00:00:00Z" }),
    getWeeklySource: async () => ({
      messages: [{ role: "user", content: "I rush endings", chapter_id: 64 }],
      memories: [{ kind: "recurring_theme", summary: "Rushing endings" }],
    }),
    saveWeeklyReflection: async (...args) => { actions.push(args); return "weekly-1"; },
  };
  const response = await handleWeeklyReflectionRequest(request("POST", { locale: "en" }), {
    environment,
    authenticate,
    calendarWeek: week,
    store,
    loadChapter: async () => ({ id: 64, text: ["Attend to the end as to the beginning."] }),
    provider: { visible: async () => providerStream("Notice the urge to rush. Pause before one handoff.") },
  });
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /"charged":false/);
  assert.match(stream, /Notice the urge to rush/);
  assert.equal(actions[0][1], "2026-08-17");
  assert.equal(actions[0][3], "Notice the urge to rush. Pause before one handoff.");
});

test("falls back when the weekly visible stream ends before any answer", async () => {
  const actions = [];
  const store = {
    getWeeklyReflection: async () => null,
    getEntitlement: async () => ({ status: "active", expires_at: "2026-09-01T00:00:00Z" }),
    getWeeklySource: async () => ({
      messages: [{ role: "user", content: "I keep postponing the last handoff", chapter_id: 64 }],
      memories: [],
    }),
    saveWeeklyReflection: async (...args) => { actions.push(args); return "weekly-fallback"; },
  };
  const response = await handleWeeklyReflectionRequest(request("POST", { locale: "en" }), {
    environment,
    authenticate,
    calendarWeek: week,
    store,
    loadChapter: async () => ({ id: 64, text: ["Attend to the end as to the beginning."] }),
    provider: {
      visible: async () => new Response("data: [DONE]\n\n"),
      visibleFallback: async () => providerStream("Name the final handoff and make its owner explicit."),
    },
  });
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /\"phase\":\"fallback\"/);
  assert.match(stream, /Name the final handoff/);
  assert.equal(actions[0][2], "en");
});

test("returns a specific code when both weekly model paths fail", async () => {
  const store = {
    getWeeklyReflection: async () => null,
    getEntitlement: async () => ({ status: "active", expires_at: "2026-09-01T00:00:00Z" }),
    getWeeklySource: async () => ({
      messages: [{ role: "user", content: "A real weekly question", chapter_id: 64 }],
      memories: [],
    }),
  };
  const response = await handleWeeklyReflectionRequest(request("POST", { locale: "zh" }), {
    environment,
    authenticate,
    calendarWeek: week,
    store,
    loadChapter: async () => ({ id: 64, text: ["慎终如始。"] }),
    provider: {
      visible: async () => new Response("data: [DONE]\n\n"),
      visibleFallback: async () => new Response("data: [DONE]\n\n"),
    },
  });
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /\"code\":\"weekly_ai_unavailable\"/);
  assert.match(stream, /对话、记忆和会员状态都没有丢失/);
});

test("weekly generation requires membership but never reserves question quota", async () => {
  let reserved = false;
  const response = await handleWeeklyReflectionRequest(request("POST", { locale: "zh" }), {
    environment,
    authenticate,
    calendarWeek: week,
    store: {
      getWeeklyReflection: async () => null,
      getEntitlement: async () => ({ status: "expired", expires_at: "2026-08-01T00:00:00Z" }),
      reserveQuestion: async () => { reserved = true; },
    },
  });
  assert.equal(response.status, 402);
  assert.equal(reserved, false);
});
