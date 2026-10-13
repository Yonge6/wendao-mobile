import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../src/companion/allowance.ts", import.meta.url), "utf8");
const compiled = stripTypeScriptTypes(source, { mode: "strip" })
  .replace('"../readingAccess"', JSON.stringify(new URL("../src/readingAccess.ts", import.meta.url).href));
const { companionUtcPeriod, loadCompanionAllowance, companionAccessSnapshot, CompanionAccessError, formatCompanionReset } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function fixture({ entitlement = null, usage = null, errorTable = null } = {}) {
  const filters = [];
  const client = { from(table) {
    const query = {
      select() { return query; },
      eq(key, value) { filters.push({ table, key, value }); return query; },
      abortSignal(signal) { assert.equal(signal instanceof AbortSignal, true); return query; },
      async maybeSingle() { return { data: table === "wendao_entitlements" ? entitlement : usage, error: table === errorTable ? { message: "private upstream details" } : null }; },
    };
    return query;
  } };
  return { client, filters };
}

test("free allowance uses server usage for the UTC day and exposes the next reset", async () => {
  const now = () => new Date("2026-10-13T23:59:59.000Z");
  const f = fixture({ usage: { used_questions: 2, question_allowance: 3 } });
  const state = await loadCompanionAllowance(f.client, "account-a", undefined, now);
  assert.equal(state.remainingFreeQuestions, 1);
  assert.equal(state.periodStart, "2026-10-13");
  assert.equal(state.nextResetAt, "2026-10-14T00:00:00.000Z");
  assert.ok(f.filters.some(({ key, value }) => key === "period_start" && value === "2026-10-13"));
  assert.equal(companionAccessSnapshot(state).status, "ready");
});

test("a lookup spanning midnight reads the new UTC day instead of granting a local reset", async () => {
  const dates = ["2026-10-13T23:59:59Z", "2026-10-14T00:00:01Z"];
  const f = fixture({ usage: { used_questions: 1 } });
  const result = await loadCompanionAllowance(f.client, "account-a", undefined, () => new Date(dates.shift() ?? "2026-10-14T00:00:01Z"));
  assert.equal(result.periodStart, "2026-10-14");
  assert.equal(result.remainingFreeQuestions, 2);
  assert.deepEqual(f.filters.filter(({ key }) => key === "period_start").map(({ value }) => value), ["2026-10-13", "2026-10-14"]);
});

test("failed reservations recover only after a fresh server read", async () => {
  const used = fixture({ usage: { used_questions: 3 } });
  const exhausted = await loadCompanionAllowance(used.client, "account-a");
  assert.equal(exhausted.remainingFreeQuestions, 0);
  const released = fixture({ usage: { used_questions: 2 } });
  const recovered = await loadCompanionAllowance(released.client, "account-a");
  assert.equal(recovered.remainingFreeQuestions, 1);
});

test("membership and allowance query failures stay unknown and never become free access", async () => {
  for (const [table, kind] of [["wendao_entitlements", "membership"], ["wendao_usage_periods", "allowance"]]) {
    const f = fixture({ errorTable: table });
    await assert.rejects(loadCompanionAllowance(f.client, "account-a"), (error) => error instanceof CompanionAccessError && error.kind === kind && !error.message.includes("private"));
  }
  assert.deepEqual(companionAccessSnapshot(null, true), { status: "error", isMember: false, remainingFreeQuestions: null, nextResetAt: null });
});

test("active and unexpired grace entitlements produce member access independently of quota", async () => {
  for (const status of ["active", "grace"]) {
    const f = fixture({ entitlement: { status, source: "apple", expires_at: "2099-01-01T00:00:00Z" }, usage: { used_questions: 99 } });
    const state = await loadCompanionAllowance(f.client, "account-a");
    assert.equal(companionAccessSnapshot(state).isMember, true);
    assert.equal(state.remainingFreeQuestions, 0);
  }
  const expired = fixture({ entitlement: { status: "active", source: "apple", expires_at: "2000-01-01T00:00:00Z" } });
  assert.equal(companionAccessSnapshot(await loadCompanionAllowance(expired.client, "account-a")).isMember, false);
});

test("reset labels include local time and do not expose an artificial UTC midnight", () => {
  assert.match(formatCompanionReset("2026-10-14T00:00:00Z", "zh"), /恢复 3 条（当地时间）/);
  assert.match(formatCompanionReset("2026-10-14T00:00:00Z", "en"), /3 questions reset.*local time/);
  assert.equal(companionUtcPeriod(new Date("2026-10-13T16:00:00Z")).periodStart, "2026-10-13");
});

function pendingFixture() {
  const signals = [];
  const client = { from() {
    const query = {
      select() { return query; },
      eq() { return query; },
      abortSignal(signal) { signals.push(signal); return query; },
      // Model native transports that do not settle when their signal aborts.
      maybeSingle() { return new Promise(() => {}); },
    };
    return query;
  } };
  return { client, signals };
}

test("inherited cancellation promptly settles a hanging native transport and cleans listeners", async (context) => {
  context.mock.method(AbortSignal, "any", () => { throw new Error("Unavailable on iOS 16"); });
  context.mock.method(AbortSignal, "timeout", () => { throw new Error("Unavailable on iOS 16"); });
  const upstream = new AbortController();
  const remove = context.mock.method(upstream.signal, "removeEventListener");
  const f = pendingFixture();
  const promise = loadCompanionAllowance(f.client, "account-a", upstream.signal);
  const reason = new Error("READER_CLOSED");
  upstream.abort(reason);
  await assert.rejects(promise, (error) => error === reason);
  assert.equal(f.signals.length, 2);
  assert.equal(f.signals.every((signal) => signal.aborted), true);
  assert.equal(remove.mock.calls.filter(({ arguments: args }) => args[0] === "abort").length, 1);
});

test("deadline rejects unknown access even when the fetch transport ignores abort", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const f = pendingFixture();
  const promise = loadCompanionAllowance(f.client, "account-a");
  const rejection = assert.rejects(promise, (error) => error instanceof CompanionAccessError && error.kind === "unavailable");
  context.mock.timers.tick(10_000);
  await rejection;
  assert.equal(f.signals.every((signal) => signal.aborted), true);
});

test("completed reads clear deadline and inherited listener without aborting their result", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const upstream = new AbortController();
  const remove = context.mock.method(upstream.signal, "removeEventListener");
  const f = fixture({ usage: { used_questions: 1 } });
  const result = await loadCompanionAllowance(f.client, "account-a", upstream.signal);
  context.mock.timers.tick(10_000);
  assert.equal(result.remainingFreeQuestions, 2);
  assert.equal(remove.mock.calls.filter(({ arguments: args }) => args[0] === "abort").length, 1);
});
