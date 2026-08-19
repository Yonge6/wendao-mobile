import assert from "node:assert/strict";
import test from "node:test";

import { readCompanionEnvironment } from "../api/_lib/env.mjs";
import { calendarMonthPeriod, createCompanionStore } from "../api/_lib/store.mjs";

const environment = {
  supabaseUrl: "https://project.supabase.co",
  supabaseServiceRoleKey: "server-only-service-key",
  monthlyQuestionAllowance: 60,
  requestTimeoutMs: 1000,
};

test("companion environment requires an explicit monthly allowance", () => {
  const base = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    DEEPSEEK_API_KEY: "deepseek",
    PUBLIC_ORIGINS: "https://wendao.wonderelian.com",
  };
  assert.throws(() => readCompanionEnvironment(base), /MONTHLY_QUESTION_ALLOWANCE/);
  assert.equal(
    readCompanionEnvironment({ ...base, MONTHLY_QUESTION_ALLOWANCE: "60" })
      .monthlyQuestionAllowance,
    60,
  );
});

test("calendar month allowance uses UTC boundaries", () => {
  assert.deepEqual(calendarMonthPeriod(new Date("2026-12-31T23:59:59Z")), {
    start: "2026-12-01",
    end: "2027-01-01",
  });
});

test("quota reservation uses a server-only RPC with exact period and allowance", async () => {
  const calls = [];
  const store = createCompanionStore(environment, {
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json([{ reservation_state: "reserved", remaining_questions: 59 }]);
    },
  });

  const result = await store.reserveQuestion(
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    new Date("2026-08-19T12:00:00Z"),
  );
  assert.deepEqual(result, { state: "reserved", remainingQuestions: 59 });
  assert.equal(calls[0].url, "https://project.supabase.co/rest/v1/rpc/reserve_wendao_question");
  assert.equal(calls[0].init.headers.apikey, "server-only-service-key");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    p_user_id: "11111111-1111-4111-8111-111111111111",
    p_request_id: "22222222-2222-4222-8222-222222222222",
    p_period_start: "2026-08-01",
    p_period_end: "2026-09-01",
    p_allowance: 60,
  });
});

test("context reads only memory summaries and chart core", async () => {
  const urls = [];
  const store = createCompanionStore(environment, {
    fetchImpl: async (url) => {
      urls.push(url);
      if (url.includes("wendao_accounts")) return Response.json([{ memory_enabled: true }]);
      if (url.includes("wendao_memories")) {
        return Response.json([{ kind: "recurring_theme", summary: "Rushing endings", status: "active", confidence: 0.9 }]);
      }
      if (url.includes("wendao_profiles")) {
        return Response.json([{ chart_core: { type: "Generator", authority: "Sacral" } }]);
      }
      return Response.json([]);
    },
  });

  const context = await store.getContext("11111111-1111-4111-8111-111111111111");
  assert.equal(context.memories[0].summary, "Rushing endings");
  assert.deepEqual(context.lifeManual, { type: "Generator", authority: "Sacral" });
  assert.ok(urls.every((url) => !url.includes("birth_date") && !url.includes("email")));
  assert.ok(urls.some((url) => url.includes("select=chart_core")));
});
