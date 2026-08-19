import { Environment, SignedDataVerifier } from "@apple/app-store-server-library";

import { HttpError } from "./http.mjs";

const PRODUCTS = new Set([
  "com.yonge6.wendao.companion.monthly",
  "com.yonge6.wendao.companion.annual",
]);

function verifier(environment, target) {
  return new SignedDataVerifier(
    environment.appleRootCertificates,
    true,
    target,
    environment.appleBundleId,
    target === Environment.PRODUCTION ? environment.appleAppId : undefined,
  );
}

export function createAppleVerifiers(environment, dependencies = {}) {
  if (dependencies.appleVerifiers) return dependencies.appleVerifiers;
  return {
    production: verifier(environment, Environment.PRODUCTION),
    sandbox: verifier(environment, Environment.SANDBOX),
  };
}

async function verifyWithEither(verifiers, method, signedPayload) {
  try {
    return { decoded: await verifiers.production[method].call(verifiers.production, signedPayload), verifier: verifiers.production };
  } catch {
    try {
      return { decoded: await verifiers.sandbox[method].call(verifiers.sandbox, signedPayload), verifier: verifiers.sandbox };
    } catch {
      throw new HttpError(400, "invalid_apple_signature", "Invalid App Store signature");
    }
  }
}

export function verifyAppleTransaction(verifiers, signedTransaction) {
  return verifyWithEither(verifiers, "verifyAndDecodeTransaction", signedTransaction);
}

export function verifyAppleNotification(verifiers, signedPayload) {
  return verifyWithEither(verifiers, "verifyAndDecodeNotification", signedPayload);
}

function isoMilliseconds(value) {
  return Number.isFinite(value) && value > 0 ? new Date(value).toISOString() : null;
}

export function normalizeAppleTransaction(transaction, event = {}) {
  if (!transaction?.transactionId || !transaction?.originalTransactionId) {
    throw new HttpError(400, "invalid_apple_transaction", "Invalid App Store transaction");
  }
  if (!PRODUCTS.has(transaction.productId)) {
    throw new HttpError(400, "invalid_apple_product", "Unknown App Store product");
  }
  let status = transaction.revocationDate ? "revoked" : (
    Number(transaction.expiresDate) > Date.now() ? "active" : "expired"
  );
  if (event.notificationType === "DID_FAIL_TO_RENEW") {
    status = event.subtype === "GRACE_PERIOD" ? "grace" : "past_due";
  } else if (event.notificationType === "GRACE_PERIOD_EXPIRED") {
    status = "past_due";
  } else if (["EXPIRED"].includes(event.notificationType)) {
    status = "expired";
  } else if (["REFUND", "REVOKE"].includes(event.notificationType)) {
    status = "revoked";
  }
  return {
    provider: "apple",
    providerEventId: event.notificationUUID
      ?? `transaction:${transaction.transactionId}:${transaction.expiresDate ?? 0}:${transaction.revocationDate ?? 0}`,
    eventType: event.notificationType ?? "client.transaction.verified",
    userId: typeof transaction.appAccountToken === "string" ? transaction.appAccountToken : null,
    status,
    productId: transaction.productId,
    customerId: null,
    subscriptionId: transaction.originalTransactionId,
    startsAt: isoMilliseconds(transaction.purchaseDate),
    expiresAt: isoMilliseconds(transaction.expiresDate),
  };
}
