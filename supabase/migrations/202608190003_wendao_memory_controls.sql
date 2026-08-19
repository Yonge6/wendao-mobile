create or replace function public.apply_wendao_memory_candidates(
  p_user_id uuid,
  p_source_thread_id uuid,
  p_candidates jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate jsonb;
  v_kind text;
  v_summary text;
  v_confidence numeric;
  v_occurred_at timestamptz;
  v_expires_at timestamptz;
  v_count integer := 0;
begin
  if jsonb_typeof(p_candidates) <> 'array' then
    raise exception using errcode = 'P0001', message = 'invalid_memory_candidates';
  end if;

  if not exists (
    select 1 from public.wendao_accounts as account
    where account.user_id = p_user_id and account.memory_enabled = true
  ) then
    return 0;
  end if;

  if p_source_thread_id is not null and not exists (
    select 1 from public.wendao_threads as thread
    where thread.id = p_source_thread_id and thread.user_id = p_user_id
  ) then
    raise exception using errcode = 'P0001', message = 'thread_not_found';
  end if;

  for v_candidate in
    select candidate.value
    from jsonb_array_elements(p_candidates) with ordinality as candidate(value, position)
    where candidate.position <= 3
  loop
    if jsonb_typeof(v_candidate) <> 'object'
      or (v_candidate - array['kind', 'summary', 'confidence', 'occurredAt', 'expiresAt']) <> '{}'::jsonb then
      raise exception using errcode = 'P0001', message = 'invalid_memory_candidate';
    end if;

    v_kind := v_candidate ->> 'kind';
    v_summary := btrim(regexp_replace(v_candidate ->> 'summary', '\s+', ' ', 'g'));
    v_confidence := coalesce((v_candidate ->> 'confidence')::numeric, 0.5);
    v_occurred_at := nullif(v_candidate ->> 'occurredAt', '')::timestamptz;
    v_expires_at := nullif(v_candidate ->> 'expiresAt', '')::timestamptz;

    if v_kind not in ('current_situation', 'recurring_theme', 'preference_boundary', 'practice_outcome')
      or char_length(v_summary) not between 1 and 800
      or v_confidence not between 0 and 1 then
      raise exception using errcode = 'P0001', message = 'invalid_memory_candidate';
    end if;

    update public.wendao_memories
    set source_thread_id = coalesce(p_source_thread_id, source_thread_id),
        confidence = greatest(confidence, v_confidence),
        occurred_at = coalesce(v_occurred_at, occurred_at),
        expires_at = coalesce(v_expires_at, expires_at),
        status = 'active',
        updated_at = now()
    where user_id = p_user_id
      and kind = v_kind
      and lower(summary) = lower(v_summary);

    if not found then
      insert into public.wendao_memories (
        user_id,
        source_thread_id,
        kind,
        summary,
        confidence,
        occurred_at,
        expires_at
      ) values (
        p_user_id,
        p_source_thread_id,
        v_kind,
        v_summary,
        v_confidence,
        v_occurred_at,
        v_expires_at
      );
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.set_wendao_memory_enabled(
  p_user_id uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wendao_accounts (user_id, memory_enabled)
  values (p_user_id, p_enabled)
  on conflict (user_id) do update
    set memory_enabled = excluded.memory_enabled;
  return p_enabled;
end;
$$;

create or replace function public.set_wendao_memory_status(
  p_user_id uuid,
  p_memory_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('active', 'resolved', 'expired') then
    raise exception using errcode = 'P0001', message = 'invalid_memory_status';
  end if;
  update public.wendao_memories
  set status = p_status
  where id = p_memory_id and user_id = p_user_id;
  return found;
end;
$$;

create or replace function public.clear_wendao_memories(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.wendao_memories where user_id = p_user_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.apply_wendao_memory_candidates(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.set_wendao_memory_enabled(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_wendao_memory_status(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.clear_wendao_memories(uuid) from public, anon, authenticated;

grant execute on function public.apply_wendao_memory_candidates(uuid, uuid, jsonb) to service_role;
grant execute on function public.set_wendao_memory_enabled(uuid, boolean) to service_role;
grant execute on function public.set_wendao_memory_status(uuid, uuid, text) to service_role;
grant execute on function public.clear_wendao_memories(uuid) to service_role;
