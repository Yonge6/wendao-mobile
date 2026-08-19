create table public.wendao_question_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  state text not null default 'pending'
    check (state in ('pending', 'succeeded', 'released')),
  thread_id uuid references public.wendao_threads (id) on delete set null,
  answer_message_id uuid references public.wendao_messages (id) on delete set null,
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index wendao_question_requests_user_id_idx
  on public.wendao_question_requests (user_id, reserved_at desc);
create index wendao_question_requests_thread_id_idx
  on public.wendao_question_requests (thread_id)
  where thread_id is not null;
create index wendao_question_requests_answer_message_id_idx
  on public.wendao_question_requests (answer_message_id)
  where answer_message_id is not null;
create index wendao_question_requests_pending_idx
  on public.wendao_question_requests (reserved_at)
  where state = 'pending';

alter table public.wendao_question_requests enable row level security;
alter table public.wendao_question_requests force row level security;

revoke all on table public.wendao_question_requests from anon, authenticated;
grant select on table public.wendao_question_requests to authenticated;

create policy "Users can read their Wendao question requests"
on public.wendao_question_requests for select
to authenticated
using ((select auth.uid()) = user_id);

drop trigger if exists set_wendao_question_request_updated_at on public.wendao_question_requests;
create trigger set_wendao_question_request_updated_at
before update on public.wendao_question_requests
for each row execute function public.set_wendao_updated_at();

create or replace function public.reserve_wendao_question(
  p_user_id uuid,
  p_request_id uuid,
  p_period_start date,
  p_period_end date,
  p_allowance integer
)
returns table (reservation_state text, remaining_questions integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state text;
  v_allowance integer;
  v_used integer;
begin
  if p_allowance < 1 or p_period_end <= p_period_start then
    raise exception using errcode = 'P0001', message = 'invalid_usage_period';
  end if;

  select question_request.state
  into v_state
  from public.wendao_question_requests as question_request
  where question_request.request_id = p_request_id
    and question_request.user_id = p_user_id;

  if found then
    select usage.question_allowance, usage.used_questions
    into v_allowance, v_used
    from public.wendao_usage_periods as usage
    where usage.user_id = p_user_id
      and usage.period_start = p_period_start;
    return query select v_state, greatest(0, coalesce(v_allowance, 0) - coalesce(v_used, 0));
    return;
  end if;

  if not exists (
    select 1
    from public.wendao_entitlements as entitlement
    where entitlement.user_id = p_user_id
      and entitlement.status in ('active', 'grace')
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  ) then
    raise exception using errcode = 'P0001', message = 'subscription_required';
  end if;

  insert into public.wendao_usage_periods (
    user_id,
    period_start,
    period_end,
    question_allowance
  ) values (
    p_user_id,
    p_period_start,
    p_period_end,
    p_allowance
  )
  on conflict (user_id, period_start) do nothing;

  select usage.question_allowance, usage.used_questions
  into v_allowance, v_used
  from public.wendao_usage_periods as usage
  where usage.user_id = p_user_id
    and usage.period_start = p_period_start
  for update;

  if v_used >= v_allowance then
    raise exception using errcode = 'P0001', message = 'quota_exhausted';
  end if;

  update public.wendao_usage_periods
  set used_questions = used_questions + 1
  where user_id = p_user_id
    and period_start = p_period_start;

  insert into public.wendao_question_requests (
    request_id,
    user_id,
    period_start,
    state
  ) values (
    p_request_id,
    p_user_id,
    p_period_start,
    'pending'
  );

  return query select 'reserved'::text, greatest(0, v_allowance - v_used - 1);
end;
$$;

create or replace function public.complete_wendao_question(
  p_user_id uuid,
  p_request_id uuid,
  p_thread_id uuid,
  p_answer_message_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.wendao_question_requests
  set state = 'succeeded',
      thread_id = p_thread_id,
      answer_message_id = p_answer_message_id,
      completed_at = coalesce(completed_at, now())
  where request_id = p_request_id
    and user_id = p_user_id
    and state in ('pending', 'succeeded');
  return found;
end;
$$;

create or replace function public.release_wendao_question(
  p_user_id uuid,
  p_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.wendao_question_requests%rowtype;
begin
  select question_request.*
  into v_request
  from public.wendao_question_requests as question_request
  where question_request.request_id = p_request_id
    and question_request.user_id = p_user_id
  for update;

  if not found or v_request.state <> 'pending' then
    return false;
  end if;

  update public.wendao_usage_periods
  set used_questions = greatest(0, used_questions - 1)
  where user_id = p_user_id
    and period_start = v_request.period_start;

  update public.wendao_question_requests
  set state = 'released',
      completed_at = now()
  where request_id = p_request_id
    and user_id = p_user_id;

  return true;
end;
$$;

create or replace function public.finish_wendao_exchange(
  p_user_id uuid,
  p_request_id uuid,
  p_thread_id uuid,
  p_locale text,
  p_chapter_id integer,
  p_question text,
  p_answer text,
  p_provider text,
  p_model text
)
returns table (thread_id uuid, answer_message_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.wendao_question_requests%rowtype;
  v_thread_id uuid;
  v_answer_message_id uuid;
begin
  select question_request.*
  into v_request
  from public.wendao_question_requests as question_request
  where question_request.request_id = p_request_id
    and question_request.user_id = p_user_id
  for update;

  if not found or v_request.state = 'released' then
    raise exception using errcode = 'P0001', message = 'reservation_not_found';
  end if;

  if v_request.state = 'succeeded' then
    return query select v_request.thread_id, v_request.answer_message_id;
    return;
  end if;

  if p_locale not in ('zh', 'en')
    or p_chapter_id not between 1 and 81
    or char_length(p_question) not between 1 and 2000
    or char_length(p_answer) not between 1 and 12000 then
    raise exception using errcode = 'P0001', message = 'invalid_exchange';
  end if;

  if p_thread_id is null then
    insert into public.wendao_threads (
      user_id,
      title,
      locale,
      chapter_id,
      last_message_at
    ) values (
      p_user_id,
      left(p_question, 80),
      p_locale,
      p_chapter_id,
      now()
    ) returning id into v_thread_id;
  else
    select thread.id
    into v_thread_id
    from public.wendao_threads as thread
    where thread.id = p_thread_id
      and thread.user_id = p_user_id
      and thread.status = 'active'
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'thread_not_found';
    end if;

    update public.wendao_threads
    set last_message_at = now()
    where id = v_thread_id;
  end if;

  insert into public.wendao_messages (
    thread_id,
    user_id,
    role,
    content,
    chapter_id
  ) values (
    v_thread_id,
    p_user_id,
    'user',
    p_question,
    p_chapter_id
  );

  insert into public.wendao_messages (
    thread_id,
    user_id,
    role,
    content,
    chapter_id,
    provider,
    model,
    request_id
  ) values (
    v_thread_id,
    p_user_id,
    'assistant',
    p_answer,
    p_chapter_id,
    p_provider,
    p_model,
    p_request_id
  ) returning id into v_answer_message_id;

  update public.wendao_question_requests
  set state = 'succeeded',
      thread_id = v_thread_id,
      answer_message_id = v_answer_message_id,
      completed_at = now()
  where request_id = p_request_id
    and user_id = p_user_id;

  return query select v_thread_id, v_answer_message_id;
end;
$$;

revoke all on function public.reserve_wendao_question(uuid, uuid, date, date, integer) from public, anon, authenticated;
revoke all on function public.complete_wendao_question(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_wendao_question(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finish_wendao_exchange(uuid, uuid, uuid, text, integer, text, text, text, text) from public, anon, authenticated;

grant execute on function public.reserve_wendao_question(uuid, uuid, date, date, integer) to service_role;
grant execute on function public.complete_wendao_question(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.release_wendao_question(uuid, uuid) to service_role;
grant execute on function public.finish_wendao_exchange(uuid, uuid, uuid, text, integer, text, text, text, text) to service_role;
