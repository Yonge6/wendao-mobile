import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { handleCompanionAccount } from "../api/companion/account.mjs";
import { createCompanionStore } from "../api/_lib/store.mjs";

const userId = "11111111-1111-4111-8111-111111111111";
const environment = {
  publicOrigins: ["https://wendao.wonderelian.com", "capacitor://localhost"],
  requestTimeoutMs: 1000,
  stripeSecretKey: "sk_test_secret",
};

function request(method, body) {
  return new Request("https://api.example/api/companion/account", {
    method,
    headers: {
      origin: "https://wendao.wonderelian.com",
      authorization: "Bearer session",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("account export is authenticated and returns only the signed-in user's data", async () => {
  let exportedUserId;
  const response = await handleCompanionAccount(request("GET"), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      getAccountExport: async (nextUserId) => {
        exportedUserId = nextUserId;
        return { account: [{ user_id: nextUserId }], messages: [] };
      },
    },
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(exportedUserId, userId);
  assert.equal(payload.data.account[0].user_id, userId);
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("account export scopes every backing-table query to the owner", async () => {
  const urls = [];
  const store = createCompanionStore({
    supabaseUrl: "https://project.supabase.co",
    supabaseServiceRoleKey: "server-only-service-key",
    requestTimeoutMs: 1000,
  }, {
    fetchImpl: async (url) => {
      urls.push(url);
      return Response.json([]);
    },
  });
  const result = await store.getAccountExport(userId);
  assert.equal(urls.length, 9);
  assert.ok(urls.every((url) => url.includes(`user_id=eq.${userId}`)));
  assert.deepEqual(Object.keys(result), [
    "account",
    "profiles",
    "threads",
    "messages",
    "memories",
    "weeklyReflections",
    "entitlement",
    "usage",
    "feedback",
  ]);
});

test("account deletion requires an explicit DELETE confirmation", async () => {
  let deleted = false;
  const response = await handleCompanionAccount(request("DELETE", { confirmation: "delete" }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      getEntitlement: async () => null,
      deleteAuthUser: async () => { deleted = true; },
    },
  });
  assert.equal(response.status, 400);
  assert.equal(deleted, false);
});

test("Stripe membership is cancelled before the account is deleted", async () => {
  const calls = [];
  const response = await handleCompanionAccount(request("DELETE", { confirmation: "DELETE" }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      getEntitlement: async () => ({ source: "stripe", provider_subscription_id: "sub_owner" }),
      deleteAuthUser: async (nextUserId) => calls.push(["delete", nextUserId]),
    },
    stripe: {
      subscriptions: {
        cancel: async (subscriptionId) => calls.push(["cancel", subscriptionId]),
      },
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [["cancel", "sub_owner"], ["delete", userId]]);
  assert.deepEqual(await response.json(), { deleted: true, appleSubscriptionMayContinue: false });
});

test("Apple account deletion remains available and reports the continuing store subscription", async () => {
  let deleted = false;
  const response = await handleCompanionAccount(request("DELETE", { confirmation: "DELETE" }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      getEntitlement: async () => ({ source: "apple", provider_subscription_id: "200000000000000" }),
      deleteAuthUser: async () => { deleted = true; },
    },
  });
  assert.equal(response.status, 200);
  assert.equal(deleted, true);
  assert.deepEqual(await response.json(), { deleted: true, appleSubscriptionMayContinue: true });
});

test("the shipped Companion UI exposes export and in-app account deletion", async () => {
  const [panel, account, api] = await Promise.all([
    readFile(new URL("../src/companion/CompanionPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/companion/AccountPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/companion/api.ts", import.meta.url), "utf8"),
  ]);
  assert.match(panel, /view === "account"[\s\S]+<AccountPanel/);
  assert.match(account, /导出我的数据/);
  assert.match(account, /删除账号/);
  assert.match(account, /confirmation !== "DELETE"/);
  assert.match(api, /method: "DELETE", body: JSON\.stringify\(\{ confirmation: "DELETE" \}\)/);
});

test("the subscription screen links the Apple standard EULA and privacy policy", async () => {
  const source = await readFile(new URL("../src/companion/SubscriptionPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula/);
  assert.match(source, /wendao\.wonderelian\.com\/privacy\.html/);
});

test("the subscription screen selects a plan before one explicit payment confirmation", async () => {
  const source = await readFile(new URL("../src/companion/SubscriptionPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /aria-pressed=\{selectedPlan === "annual"\}/);
  assert.match(source, /aria-pressed=\{selectedPlan === "monthly"\}/);
  assert.match(source, /确认并前往支付/);
  assert.match(source, /onClick=\{\(\) => void beginCheckout\(\)\}/);
});
