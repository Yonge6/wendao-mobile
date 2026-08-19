import { createHash } from "node:crypto";

export function billingPayloadHash(rawBody) {
  return createHash("sha256").update(rawBody).digest("hex");
}
