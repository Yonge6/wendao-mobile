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

  assert.equal(visible.model, "deepseek-v4-pro");
  assert.equal(visible.stream, true);
  assert.deepEqual(visible.thinking, { type: "enabled" });
  assert.equal(visible.max_tokens, 1800);
  assert.equal(background.model, "deepseek-v4-flash");
  assert.equal(background.stream, false);
  assert.deepEqual(background.response_format, { type: "json_object" });
  assert.equal(background.max_tokens, 700);
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
    new HttpError(429, "quota_exhausted", "Monthly allowance reached"),
    "request-1",
  );
  assert.equal(publicResponse.status, 429);
  assert.deepEqual(await publicResponse.json(), {
    error: { code: "quota_exhausted", message: "Monthly allowance reached" },
    requestId: "request-1",
  });

  const privateResponse = errorResponse(
    new Error("database password leaked"),
    "request-2",
  );
  assert.equal(privateResponse.status, 500);
  assert.doesNotMatch(await privateResponse.text(), /database|password/i);
});
