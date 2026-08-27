import assert from "node:assert/strict";
import test from "node:test";

import { authenticateRequest, parseBearerToken } from "../api/_lib/auth.mjs";
import { readCoreEnvironment } from "../api/_lib/env.mjs";
import {
  HttpError,
  corsHeaders,
  errorResponse,
} from "../api/_lib/http.mjs";
import {
  buildDeepSeekRequest,
  createDeepSeekProvider,
} from "../api/_lib/providers/deepseek.mjs";

test("CORS reflects only an exact allowlisted origin", () => {
  assert.equal(
    corsHeaders("https://wendao.wonderelian.com", [
      "https://wendao.wonderelian.com",
    ])["Access-Control-Allow-Origin"],
    "https://wendao.wonderelian.com",
  );
  assert.equal(
    corsHeaders("https://wendao.wonderelian.com.evil.test", [
      "https://wendao.wonderelian.com",
    ])["Access-Control-Allow-Origin"],
    undefined,
  );
});

test("bearer parsing accepts one token and rejects missing or ambiguous credentials", () => {
  assert.equal(
    parseBearerToken(new Request("https://api.test", {
      headers: { authorization: "Bearer user-jwt" },
    })),
    "user-jwt",
  );
  assert.throws(() => parseBearerToken(new Request("https://api.test")), /sign in/i);
  assert.throws(
    () => parseBearerToken(new Request("https://api.test", {
      headers: { authorization: "Bearer first second" },
    })),
    /invalid authorization/i,
  );
});

test("auth verifies the token with Supabase and returns only a pseudonymous id", async () => {
  const fetchCalls = [];
  const user = await authenticateRequest(
    new Request("https://api.test", {
      headers: { authorization: "Bearer user-jwt" },
    }),
    {
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "public-anon-key",
      requestTimeoutMs: 1000,
    },
    async (url, init) => {
      fetchCalls.push({ url, init });
      return Response.json({
        id: "11111111-1111-4111-8111-111111111111",
        email: "must-not-leave-auth@example.com",
      });
    },
  );

  assert.deepEqual(user, { id: "11111111-1111-4111-8111-111111111111" });
  assert.equal(fetchCalls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(fetchCalls[0].init.headers.apikey, "public-anon-key");
});

test("server environment rejects wildcards, insecure origins, and missing secrets", () => {
  assert.throws(() => readCoreEnvironment({}), /SUPABASE_URL/);
  assert.throws(
    () => readCoreEnvironment({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      DEEPSEEK_API_KEY: "deepseek",
      PUBLIC_ORIGINS: "*",
    }),
    /wildcard/i,
  );
  assert.throws(
    () => readCoreEnvironment({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      DEEPSEEK_API_KEY: "deepseek",
      PUBLIC_ORIGINS: "http://wendao.wonderelian.com",
    }),
    /https/i,
  );
});

test("DeepSeek routes visible and background work to separate models", () => {
  const visible = buildDeepSeekRequest("visible", [
    { role: "user", content: "How should I approach this choice?" },
  ]);
  const background = buildDeepSeekRequest("background", [
    { role: "user", content: "Return one JSON object." },
  ]);
  const fallback = buildDeepSeekRequest("visible_fallback", [
    { role: "user", content: "Give a concise answer." },
  ]);

  assert.equal(visible.model, "deepseek-v4-pro");
  assert.equal(visible.stream, true);
  assert.deepEqual(visible.thinking, { type: "enabled" });
  assert.equal(visible.max_tokens, 1800);
  assert.equal(background.model, "deepseek-v4-flash");
  assert.equal(background.stream, false);
  assert.deepEqual(background.response_format, { type: "json_object" });
  assert.equal(background.max_tokens, 700);
  assert.equal(fallback.model, "deepseek-v4-flash");
  assert.equal(fallback.stream, true);
  assert.deepEqual(fallback.thinking, { type: "disabled" });
});

test("DeepSeek visible responses fall back to Flash when Pro is unavailable", async () => {
  const models = [];
  const provider = createDeepSeekProvider(
    { apiKey: "ds-test", timeoutMs: 45_000 },
    {
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(init.body);
        models.push(body.model);
        if (models.length === 1) return new Response("unavailable", { status: 503 });
        return new Response('data: {"choices":[{"delta":{"content":"慢下来"}}]}\n\ndata: [DONE]\n\n');
      },
    },
  );

  const response = await provider.visible([{ role: "user", content: "我该怎么办？" }], { requestId: "request-1" });
  assert.equal(response.status, 200);
  assert.deepEqual(models, ["deepseek-v4-pro", "deepseek-v4-flash"]);
});

test("DeepSeek provider applies a timeout and never embeds the key in its error", async () => {
  const provider = createDeepSeekProvider(
    { apiKey: "ds-super-secret", timeoutMs: 5 },
    {
      fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      }),
    },
  );

  await assert.rejects(
    provider.background([{ role: "user", content: "Return JSON." }]),
    (error) => {
      assert.doesNotMatch(String(error), /ds-super-secret/);
      return /unavailable|timed out/i.test(String(error));
    },
  );
});

test("safe error responses preserve public errors and hide internal details", async () => {
  const publicResponse = errorResponse(
    new HttpError(429, "rate_limited", "Please wait a moment before asking again"),
    "request-1",
  );
  assert.equal(publicResponse.status, 429);
  assert.deepEqual(await publicResponse.json(), {
    error: { code: "rate_limited", message: "Please wait a moment before asking again" },
    requestId: "request-1",
  });

  const privateResponse = errorResponse(
    new Error("database password leaked"),
    "request-2",
  );
  assert.equal(privateResponse.status, 500);
  assert.doesNotMatch(await privateResponse.text(), /database|password/i);
});
