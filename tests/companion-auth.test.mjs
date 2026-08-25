import assert from "node:assert/strict";
import test from "node:test";

import { readNativeAuthCallback } from "../src/companion/auth-callback.ts";

test("reads the PKCE code from the Wendao native auth callback", () => {
  assert.deepEqual(
    readNativeAuthCallback("com.yonge6.wendao://auth/callback?code=review-code"),
    { code: "review-code" },
  );
});

test("ignores unrelated deep links", () => {
  assert.equal(readNativeAuthCallback("not a URL"), null);
  assert.equal(readNativeAuthCallback("https://wendao.wonderelian.com/?chapter=8"), null);
  assert.equal(
    readNativeAuthCallback("com.yonge6.wendao://auth/callback-untrusted?code=review-code"),
    null,
  );
});

test("surfaces Apple callback errors instead of reporting a missing code", () => {
  assert.throws(
    () => readNativeAuthCallback("com.yonge6.wendao://auth/callback?error=access_denied&error_description=The%20request%20was%20cancelled"),
    /The request was cancelled/,
  );
});

test("rejects an incomplete native auth callback", () => {
  assert.throws(
    () => readNativeAuthCallback("com.yonge6.wendao://auth/callback"),
    /OAUTH_CODE_MISSING/,
  );
});
