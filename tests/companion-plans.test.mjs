import assert from "node:assert/strict";
import test from "node:test";

import { COMPANION_MEMBERSHIP, COMPANION_PLANS } from "../src/companion/plans.ts";

test("locks the approved subscription and lifetime price configuration", () => {
  assert.deepEqual(COMPANION_PLANS.monthly, {
    id: "wendao_companion_monthly",
    cny: 68,
    usd: 19.99,
    interval: "month",
  });
  assert.deepEqual(COMPANION_PLANS.annual, {
    id: "wendao_companion_annual",
    cny: 698,
    usd: 199.99,
    interval: "year",
  });
  assert.deepEqual(COMPANION_PLANS.lifetime, {
    id: "wendao_reading_lifetime",
    cny: 9.9,
    usd: 7,
    interval: "lifetime",
  });
});

test("membership has no trial and unlimited questions", () => {
  assert.deepEqual(COMPANION_MEMBERSHIP, {
    hasTrial: false,
    unlimitedQuestions: true,
    localizationBase: "USD",
  });
});
