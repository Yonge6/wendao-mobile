import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeAppleTransaction } from "../api/_lib/apple.mjs";
import { readAppleEnvironment } from "../api/_lib/env.mjs";
import { handleAppleNotification } from "../api/billing/apple-notifications.mjs";
import { handleApplePurchaseIntent } from "../api/billing/apple-purchase-intent.mjs";
import { handleAppleTransaction } from "../api/billing/apple-transaction.mjs";

const userId = "11111111-1111-4111-8111-111111111111";
const environment = {
  publicOrigins: ["capacitor://localhost", "https://wendao.wonderelian.com"],
  requestTimeoutMs: 1000,
  appleBundleId: "com.yonge6.wendao",
  appleAppId: 6796945428,
  appleRootCertificates: [Buffer.alloc(600), Buffer.alloc(600)],
};

function transaction(overrides = {}) {
  return {
    transactionId: "200000000000001",
    originalTransactionId: "200000000000000",
    productId: "com.yonge6.wendao.companion.annual",
    appAccountToken: userId,
    purchaseDate: Date.now() - 1000,
    expiresDate: Date.now() + 86_400_000,
    ...overrides,
  };
}

function request(signedTransaction = "signed-transaction") {
  return new Request("https://api.example/api/billing/apple-transaction", {
    method: "POST",
    headers: { origin: "capacitor://localhost", authorization: "Bearer session", "content-type": "application/json" },
    body: JSON.stringify({ signedTransaction }),
  });
}

test("Apple environment keeps certificates and identifiers server-only", () => {
  const result = readAppleEnvironment({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    PUBLIC_ORIGINS: "https://wendao.wonderelian.com,capacitor://localhost",
    APPLE_BUNDLE_ID: "com.yonge6.wendao",
    APPLE_APP_ID: "6796945428",
  });
  assert.equal(result.appleAppId, 6796945428);
  assert.ok(result.appleRootCertificates.every((certificate) => certificate.length >= 500));
});

test("normalizes verified StoreKit transactions and notification state changes", () => {
  assert.equal(normalizeAppleTransaction(transaction()).status, "active");
  assert.equal(normalizeAppleTransaction(transaction(), {
    notificationUUID: "notification-1",
    notificationType: "DID_FAIL_TO_RENEW",
    subtype: "GRACE_PERIOD",
  }).status, "grace");
  assert.equal(normalizeAppleTransaction(transaction(), {
    notificationType: "REFUND",
  }).status, "revoked");
});

test("authenticated transaction verification binds appAccountToken to the signed-in account", async () => {
  let stored;
  const response = await handleAppleTransaction(request(), {
    environment,
    authenticate: async () => ({ id: userId }),
    appleVerifiers: {
      production: { verifyAndDecodeTransaction: async () => transaction() },
      sandbox: { verifyAndDecodeTransaction: async () => { throw new Error("unused"); } },
    },
    store: { processBillingEvent: async (event) => { stored = event; return true; } },
  });
  assert.equal(response.status, 200);
  assert.equal(stored.userId, userId);
  assert.equal(stored.status, "active");
  assert.match(stored.payloadHash, /^[a-f0-9]{64}$/);

  const mismatch = await handleAppleTransaction(request(), {
    environment,
    authenticate: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
    appleVerifiers: {
      production: { verifyAndDecodeTransaction: async () => transaction() },
      sandbox: { verifyAndDecodeTransaction: async () => { throw new Error("unused"); } },
    },
  });
  assert.equal(mismatch.status, 403);
});

test("native purchase intent blocks cross-provider double billing before StoreKit opens", async () => {
  let reserved = false;
  const activeResponse = await handleApplePurchaseIntent(new Request("https://api.example/api/billing/apple-purchase-intent", {
    method: "POST",
    headers: { origin: "capacitor://localhost", authorization: "Bearer session", "content-type": "application/json" },
    body: JSON.stringify({ plan: "annual" }),
  }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: {
      getEntitlement: async () => ({ status: "active", source: "stripe", expires_at: "2026-09-19T00:00:00Z" }),
      reserveCheckout: async () => { reserved = true; return true; },
    },
  });
  assert.equal(activeResponse.status, 409);
  assert.equal(reserved, false);

  const readyResponse = await handleApplePurchaseIntent(new Request("https://api.example/api/billing/apple-purchase-intent", {
    method: "POST",
    headers: { origin: "capacitor://localhost", authorization: "Bearer session", "content-type": "application/json" },
    body: JSON.stringify({ plan: "monthly" }),
  }), {
    environment,
    authenticate: async () => ({ id: userId }),
    store: { getEntitlement: async () => null, reserveCheckout: async () => true },
  });
  assert.equal(readyResponse.status, 200);
});

test("server notifications verify both signed layers and recover the owning account", async () => {
  let stored;
  const verifiedTransaction = transaction({ appAccountToken: undefined });
  const production = {
    verifyAndDecodeNotification: async () => ({
      notificationUUID: "notification-1",
      notificationType: "DID_RENEW",
      data: { signedTransactionInfo: "nested-signed-transaction" },
    }),
    verifyAndDecodeTransaction: async (signed) => {
      assert.equal(signed, "nested-signed-transaction");
      return verifiedTransaction;
    },
  };
  const response = await handleAppleNotification(new Request("https://api.example/api/billing/apple-notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ signedPayload: "signed-notification" }),
  }), {
    environment,
    appleVerifiers: { production, sandbox: production },
    store: {
      findAppleUserByOriginalTransaction: async (id) => {
        assert.equal(id, verifiedTransaction.originalTransactionId);
        return userId;
      },
      processBillingEvent: async (event) => { stored = event; return true; },
    },
  });
  assert.equal(response.status, 200);
  assert.equal(stored.providerEventId, "notification-1");
  assert.equal(stored.userId, userId);
});

test("native StoreKit bridge purchases with appAccountToken and defers finish", async () => {
  const swiftUrl = new URL("../ios/App/App/WendaoStoreKitPlugin.swift", import.meta.url);
  const projectUrl = new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url);
  const clientUrl = new URL("../src/companion/storekit.ts", import.meta.url);
  const [swift, project, client] = await Promise.all([
    readFile(swiftUrl, "utf8"),
    readFile(projectUrl, "utf8"),
    readFile(clientUrl, "utf8"),
  ]);
  assert.match(swift, /purchase\(options: \[\.appAccountToken\(token\)\]\)/);
  assert.match(swift, /Transaction\.currentEntitlements/);
  assert.match(swift, /Transaction\.unfinished/);
  assert.match(swift, /CAPPluginMethod\(name: "review"/);
  assert.match(swift, /action=write-review/);
  assert.match(client, /await verifyAppleTransaction[\s\S]+await plugin\.finish/);
  assert.match(client, /export async function reviewStoreKit/);
  assert.match(project, /WendaoStoreKitPlugin\.swift in Sources/);
});
