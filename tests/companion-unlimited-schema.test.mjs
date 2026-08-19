import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/202608190005_wendao_unlimited_questions.sql", import.meta.url);

async function sql() {
  return (await readFile(migrationUrl, "utf8")).replace(/\s+/g, " ").toLowerCase();
}

test("removes monthly allowance enforcement while retaining usage observation", async () => {
  const migration = await sql();
  assert.match(migration, /alter column question_allowance drop not null/);
  assert.match(migration, /question_allowance is null or question_allowance > 0/);
  assert.match(migration, /set question_allowance = null/);
  assert.match(migration, /set used_questions = used_questions \+ 1/);
  assert.doesNotMatch(migration, /quota_exhausted/);
});

test("unlimited membership still protects concurrency and automated bursts", async () => {
  const migration = await sql();
  assert.match(migration, /unique index wendao_question_requests_one_pending_per_user_idx/);
  assert.match(migration, /row_number\(\) over \(partition by user_id/);
  assert.match(migration, /message = 'request_in_progress'/);
  assert.match(migration, /exception when unique_violation/);
  assert.match(migration, /interval '1 minute'/);
  assert.match(migration, />= 12/);
  assert.match(migration, /interval '3 minutes'/);
});

test("unlimited reservation remains entitlement-gated and server-only", async () => {
  const migration = await sql();
  assert.match(migration, /entitlement\.status in \('active', 'grace'\)/);
  assert.match(migration, /revoke all on function public\.reserve_wendao_question_unlimited[^;]+from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.reserve_wendao_question_unlimited[^;]+to service_role/);
});
