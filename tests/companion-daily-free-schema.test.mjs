import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/202609220001_wendao_daily_free_questions.sql", import.meta.url);

test("daily free reservation grants three questions and keeps members unlimited", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /v_allowance constant integer := 3/);
  assert.match(migration, /entitlement\.status in \('active', 'grace'\)/);
  assert.match(migration, /daily_free_limit_reached/);
  assert.match(migration, /case when v_unlimited then null else v_allowance end/);
});

test("daily free reservation remains server-only and protects replay and concurrency", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /where question_request\.request_id = p_request_id/);
  assert.match(migration, /where pending\.user_id = p_user_id and pending\.state = 'pending'/);
  assert.match(migration, /reserved_at <= now\(\) - interval '3 minutes'/);
  assert.match(migration, /revoke all on function public\.reserve_wendao_question_daily_free[^;]+from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.reserve_wendao_question_daily_free[^;]+to service_role/);
});
