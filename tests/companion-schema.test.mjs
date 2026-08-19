import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608190001_wendao_companion.sql",
  import.meta.url,
);

async function migrationSql() {
  return (await readFile(migrationUrl, "utf8"))
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const companionTables = [
  "wendao_accounts",
  "wendao_threads",
  "wendao_messages",
  "wendao_memories",
  "wendao_weekly_reflections",
  "wendao_entitlements",
  "wendao_usage_periods",
  "wendao_billing_events",
];

test("creates every authenticated Companion table", async () => {
  const sql = await migrationSql();

  for (const table of companionTables) {
    assert.match(sql, new RegExp(`create table (?:if not exists )?public\\.${table} \\(`));
  }
});

test("owns user data through auth.users foreign keys with cascade deletion", async () => {
  const sql = await migrationSql();

  for (const table of companionTables.filter((table) => table !== "wendao_billing_events")) {
    const tableStart = sql.indexOf(`create table public.${table}`);
    const tableEnd = sql.indexOf(";", tableStart);
    const definition = sql.slice(tableStart, tableEnd);
    assert.match(
      definition,
      /user_id uuid[^;]*references auth\.users \(id\) on delete cascade/,
      `${table} must cascade from auth.users`,
    );
  }
});

test("enables and forces RLS on every user-owned table", async () => {
  const sql = await migrationSql();

  for (const table of companionTables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`alter table public\\.${table} force row level security`));
  }
});

test("uses cached auth.uid ownership policies and indexes every user_id", async () => {
  const sql = await migrationSql();

  assert.doesNotMatch(sql, /using \(auth\.uid\(\) = user_id\)/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);

  for (const table of companionTables.filter((table) => table !== "wendao_billing_events")) {
    assert.match(
      sql,
      new RegExp(`create index ${table}_user_id_idx on public\\.${table} \\(user_id`),
      `${table}.user_id must be indexed`,
    );
  }
});

test("prevents duplicate billing events and seeds safe initial usage constraints", async () => {
  const sql = await migrationSql();

  assert.match(sql, /unique \(provider, provider_event_id\)/);
  assert.match(sql, /check \(used_questions between 0 and question_allowance\)/);
  assert.match(sql, /unique \(user_id, week_start\)/);
});

test("adds authenticated ownership to legacy product tables without removing client ids", async () => {
  const sql = await migrationSql();

  for (const table of [
    "wendao_profiles",
    "wendao_feedback",
    "wendao_conversations",
    "wendao_events",
  ]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} add column if not exists user_id uuid`),
    );
  }
});
