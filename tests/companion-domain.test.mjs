import assert from "node:assert/strict";
import test from "node:test";

import { getCompanionAccess } from "../src/companion/entitlements.ts";
import {
  isMemoryRetrievable,
  normalizeMemoryCandidate,
  resolveMemoryStatus,
} from "../src/companion/memory.ts";

const NOW = new Date("2026-08-19T12:00:00.000Z");

test("requires login before checking subscription state", () => {
  assert.deepEqual(
    getCompanionAccess({ isSignedIn: false, entitlement: null, usage: null }, NOW),
    { allowed: false, reason: "signed_out", unlimited: false },
  );
});

test("requires an active or grace-period entitlement", () => {
  assert.equal(
    getCompanionAccess(
      {
        isSignedIn: true,
        entitlement: {
          status: "expired",
          expiresAt: "2026-08-18T12:00:00.000Z",
        },
        usage: null,
      },
      NOW,
    ).reason,
    "subscription_required",
  );

  assert.equal(
    getCompanionAccess(
      {
        isSignedIn: true,
        entitlement: {
          status: "grace",
          expiresAt: "2026-08-20T12:00:00.000Z",
        },
        usage: { usedQuestions: 8 },
      },
      NOW,
    ).allowed,
    true,
  );
});

test("active members retain access regardless of observed monthly use", () => {
  assert.deepEqual(
    getCompanionAccess(
      {
        isSignedIn: true,
        entitlement: {
          status: "active",
          expiresAt: "2026-09-19T12:00:00.000Z",
        },
        usage: { usedQuestions: 10_000 },
      },
      NOW,
    ),
    { allowed: true, reason: "active", unlimited: true },
  );
});

test("expires short-lived memories and respects the account memory switch", () => {
  const memory = {
    status: "active",
    expiresAt: "2026-08-19T11:59:59.000Z",
  };

  assert.equal(resolveMemoryStatus(memory, NOW), "expired");
  assert.equal(isMemoryRetrievable(memory, true, NOW), false);
  assert.equal(
    isMemoryRetrievable({ status: "active", expiresAt: null }, false, NOW),
    false,
  );
});

test("normalizes safe memory candidates", () => {
  assert.deepEqual(
    normalizeMemoryCandidate({
      kind: "practice_outcome",
      summary: "  午后散步十分钟后，重新看问题时不再急着下结论。  ",
      confidence: 0.78,
      occurredAt: "2026-08-19T10:00:00.000Z",
    }),
    {
      kind: "practice_outcome",
      summary: "午后散步十分钟后，重新看问题时不再急着下结论。",
      confidence: 0.78,
      occurredAt: "2026-08-19T10:00:00.000Z",
      expiresAt: null,
    },
  );
});

test("rejects account, payment, and raw birth fields from automatic memory", () => {
  for (const candidate of [
    { kind: "current_situation", summary: "工作变化", email: "reader@example.com" },
    { kind: "current_situation", summary: "工作变化", paymentId: "pi_secret" },
    { kind: "life_manual_context", summary: "生产者", birthDate: "1986-06-24" },
    { kind: "life_manual_context", summary: "生产者", birth_place: "Wuhan" },
  ]) {
    assert.throws(() => normalizeMemoryCandidate(candidate), /sensitive field/i);
  }
});
