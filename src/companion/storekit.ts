import { Capacitor, registerPlugin } from "@capacitor/core";

import { releaseApplePurchase, reserveApplePurchase, verifyAppleTransaction } from "./api";

export const STOREKIT_PRODUCTS = Object.freeze({
  monthly: "com.yonge6.wendao.companion.monthly",
  annual: "com.yonge6.wendao.companion.annual",
});

export type StoreKitProduct = {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
};

type StoreKitPlugin = {
  products(): Promise<{ products: StoreKitProduct[] }>;
  purchase(input: { productId: string; appAccountToken: string }): Promise<{
    status: "purchased" | "pending" | "cancelled";
    transactionId?: string;
    signedTransaction?: string;
  }>;
  restore(): Promise<{ transactions: Array<{ transactionId: string; signedTransaction: string }> }>;
  finish(input: { transactionId: string }): Promise<{ finished: boolean }>;
  manage(): Promise<void>;
};

const nativeStoreKit = registerPlugin<StoreKitPlugin>("WendaoStoreKit");

function requireNative() {
  if (Capacitor.getPlatform() !== "ios") throw new Error("STOREKIT_UNAVAILABLE");
}

export async function loadStoreKitProducts(plugin: StoreKitPlugin = nativeStoreKit) {
  requireNative();
  const result = await plugin.products();
  return result.products.filter((product) => Object.values(STOREKIT_PRODUCTS).some((id) => id === product.id));
}

export async function purchaseStoreKit({
  plan,
  userId,
  apiUrl,
  accessToken,
  plugin = nativeStoreKit,
}: {
  plan: keyof typeof STOREKIT_PRODUCTS;
  userId: string;
  apiUrl: string;
  accessToken: string;
  plugin?: StoreKitPlugin;
}) {
  requireNative();
  await reserveApplePurchase(apiUrl, accessToken, plan);
  let result;
  try {
    result = await plugin.purchase({
      productId: STOREKIT_PRODUCTS[plan],
      appAccountToken: userId,
    });
  } catch (error) {
    await releaseApplePurchase(apiUrl, accessToken).catch(() => undefined);
    throw error;
  }
  if (result.status === "cancelled") {
    await releaseApplePurchase(apiUrl, accessToken).catch(() => undefined);
    return result.status;
  }
  if (result.status !== "purchased") return result.status;
  if (!result.transactionId || !result.signedTransaction) throw new Error("INVALID_STOREKIT_TRANSACTION");
  await verifyAppleTransaction(apiUrl, accessToken, result.signedTransaction);
  await plugin.finish({ transactionId: result.transactionId });
  return "purchased" as const;
}

export async function restoreStoreKit({
  apiUrl,
  accessToken,
  plugin = nativeStoreKit,
}: {
  apiUrl: string;
  accessToken: string;
  plugin?: StoreKitPlugin;
}) {
  requireNative();
  const result = await plugin.restore();
  let verified = 0;
  for (const transaction of result.transactions) {
    await verifyAppleTransaction(apiUrl, accessToken, transaction.signedTransaction);
    await plugin.finish({ transactionId: transaction.transactionId });
    verified += 1;
  }
  return verified;
}

export async function manageStoreKit(plugin: StoreKitPlugin = nativeStoreKit) {
  requireNative();
  await plugin.manage();
}
