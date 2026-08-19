import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608190002_wendao_question_reservations.sql",
  import.meta.url,
);

async function migrationSql() {
  return (await readFile(migrationUrl, "utf8"))
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

test("creates an owned and protected idempotent reservation table", async () => {
  const sql = await migrationSql();
  assert.match(sql, /create table public\.wendao_question_requests/);
  assert.match(sql, /request_id uuid primary key/);
  assert.match(sql, /user_id uuid not null references auth\.users \(id\) on delete cascade/);
  assert.match(sql, /check \(state in \('pending', 'succeeded', 'released'\)\)/);
  assert.match(sql, /alter table public\.wendao_question_requests enable row level security/);
  assert.match(sql, /alter table public\.wendao_question_requests force row level security/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);
});

test("reserves and releases quota transactionally", async () => {
  const sql = await migrationSql();
  assert.match(sql, /function public\.reserve_wendao_question/);
  assert.match(sql, /for update/);
  assert.match(sql, /used_questions = used_questions \+ 1/);
  assert.match(sql, /select 'reserved'::text/);
  assert.match(sql, /function public\.release_wendao_question/);
  assert.match(sql, /used_questions = greatest\(0, used_questions - 1\)/);
  assert.match(sql, /state = 'released'/);
  assert.match(sql, /function public\.finish_wendao_exchange/);
  assert.match(sql, /insert into public\.wendao_messages/);
});

test("keeps quota mutation RPCs server-only", async () => {
  const sql = await migrationSql();
  for (const functionName of [
    "reserve_wendao_question",
    "complete_wendao_question",
    "release_wendao_question",
    "finish_wendao_exchange",
  ]) {
    assert.match(
      sql,
      new RegExp(`revoke all on function public\\.${functionName}[^;]+from public, anon, authenticated`),
    );
    assert.match(
      sql,
      new RegExp(`grant execute on function public\\.${functionName}[^;]+to service_role`),
    );
  }
});
