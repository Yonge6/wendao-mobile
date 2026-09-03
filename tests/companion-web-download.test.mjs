import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { WENDAO_APP_STORE_URL } from "../src/companion/plans.ts";

test("H5 routes inactive Companion accounts to the published iOS app", async () => {
  const source = await readFile(new URL("../src/companion/SubscriptionPanel.tsx", import.meta.url), "utf8");
  const downloadLinkSource = await readFile(new URL("../src/companion/AppStoreDownloadLink.tsx", import.meta.url), "utf8");

  assert.equal(WENDAO_APP_STORE_URL, "https://apps.apple.com/us/app/wendao-daodejing/id6796945428");
  assert.match(source, /if \(!native\)/);
  assert.match(source, /AppStoreDownloadLink/);
  assert.match(downloadLinkSource, /href=\{WENDAO_APP_STORE_URL\}/);
  assert.match(source, /前往 App Store 下载/);
  assert.doesNotMatch(source, /createStripeCheckout/);
});

test("iPhone WeChat downloads use a bilingual default-browser guide and copy fallback", async () => {
  const source = await readFile(new URL("../src/companion/AppStoreDownloadLink.tsx", import.meta.url), "utf8");

  assert.match(source, /MicroMessenger/);
  assert.match(source, /iPhone/);
  assert.match(source, /微信暂时无法直接打开 App Store/);
  assert.match(source, /在默认浏览器中打开/);
  assert.match(source, /Open Wendao in your default browser/);
  assert.match(source, /Copy App Store link/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /document\.execCommand\("copy"\)/);
});

test("native Companion subscriptions continue to use StoreKit", async () => {
  const source = await readFile(new URL("../src/companion/SubscriptionPanel.tsx", import.meta.url), "utf8");

  assert.match(source, /purchaseStoreKit/);
  assert.match(source, /restoreStoreKit/);
  assert.match(source, /订阅将通过 App Store 安全完成/);
});
