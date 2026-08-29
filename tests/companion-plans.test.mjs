import assert from "node:assert/strict";
import test from "node:test";

import { COMPANION_MEMBERSHIP, COMPANION_PLANS } from "../src/companion/plans.ts";

test("locks the approved monthly and annual prices", () => {
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
    cny: 198,
    usd: 39.99,
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
