alter table public.wendao_usage_periods
  drop constraint if exists wendao_usage_periods_question_allowance_check;
alter table public.wendao_usage_periods
  drop constraint if exists wendao_usage_periods_used_questions_check;
alter table public.wendao_usage_periods
  alter column question_allowance drop not null;
alter table public.wendao_usage_periods
  add constraint wendao_usage_periods_optional_allowance_check
    check (question_allowance is null or question_allowance > 0),
  add constraint wendao_usage_periods_nonnegative_use_check
    check (used_questions >= 0);

update public.wendao_usage_periods set question_allowance = null;

revoke execute on function public.reserve_wendao_question(uuid, uuid, date, date, integer) from service_role;
drop function public.reserve_wendao_question(uuid, uuid, date, date, integer);

with duplicate_counts as (
  select user_id, period_start, count(*) - 1 as released_count
  from public.wendao_question_requests
  where state = 'pending'
  group by user_id, period_start
  having count(*) > 1
)
update public.wendao_usage_periods as usage
set used_questions = greatest(0, usage.used_questions - duplicate_counts.released_count)
from duplicate_counts
where usage.user_id = duplicate_counts.user_id
  and usage.period_start = duplicate_counts.period_start;

with ranked_pending as (
  select request_id,
    row_number() over (partition by user_id order by reserved_at desc, request_id desc) as pending_rank
  from public.wendao_question_requests
  where state = 'pending'
)
update public.wendao_question_requests as request
set state = 'released', completed_at = now()
from ranked_pending
where request.request_id = ranked_pending.request_id
  and ranked_pending.pending_rank > 1;

create unique index wendao_question_requests_one_pending_per_user_idx
  on public.wendao_question_requests (user_id)
  where state = 'pending';

create or replace function public.reserve_wendao_question_unlimited(
  p_user_id uuid,
  p_request_id uuid,
  p_period_start date,
  p_period_end date
)
returns table (reservation_state text, questions_this_month integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state text;
  v_used integer;
  v_stale record;
begin
  if p_period_end <= p_period_start then
    raise exception using errcode = 'P0001', message = 'invalid_usage_period';
  end if;

  select question_request.state
  into v_state
  from public.wendao_question_requests as question_request
  where question_request.request_id = p_request_id
    and question_request.user_id = p_user_id;

  if found then
    select usage.used_questions into v_used
    from public.wendao_usage_periods as usage
    where usage.user_id = p_user_id and usage.period_start = p_period_start;
    return query select v_state, coalesce(v_used, 0);
    return;
  end if;

  if not exists (
    select 1 from public.wendao_entitlements as entitlement
    where entitlement.user_id = p_user_id
      and entitlement.status in ('active', 'grace')
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  ) then
    raise exception using errcode = 'P0001', message = 'subscription_required';
  end if;

  if (
    select count(*) from public.wendao_question_requests as recent_request
    where recent_request.user_id = p_user_id
      and recent_request.reserved_at > now() - interval '1 minute'
  ) >= 12 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  for v_stale in
    select pending.request_id, pending.period_start
    from public.wendao_question_requests as pending
    where pending.user_id = p_user_id
      and pending.state = 'pending'
      and pending.reserved_at <= now() - interval '3 minutes'
    for update
  loop
    update public.wendao_usage_periods
    set used_questions = greatest(0, used_questions - 1)
    where user_id = p_user_id and period_start = v_stale.period_start;
    update public.wendao_question_requests
    set state = 'released', completed_at = now()
    where request_id = v_stale.request_id;
  end loop;

  if exists (
    select 1 from public.wendao_question_requests as pending
    where pending.user_id = p_user_id and pending.state = 'pending'
  ) then
    raise exception using errcode = 'P0001', message = 'request_in_progress';
  end if;

  insert into public.wendao_usage_periods (
    user_id, period_start, period_end, question_allowance
  ) values (
    p_user_id, p_period_start, p_period_end, null
  ) on conflict (user_id, period_start) do nothing;

  select usage.used_questions into v_used
  from public.wendao_usage_periods as usage
  where usage.user_id = p_user_id and usage.period_start = p_period_start
  for update;

  update public.wendao_usage_periods
  set used_questions = used_questions + 1
  where user_id = p_user_id and period_start = p_period_start;

  begin
    insert into public.wendao_question_requests (
      request_id, user_id, period_start, state
    ) values (
      p_request_id, p_user_id, p_period_start, 'pending'
    );
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'request_in_progress';
  end;

  return query select 'reserved'::text, v_used + 1;
end;
$$;

revoke all on function public.reserve_wendao_question_unlimited(uuid, uuid, date, date) from public, anon, authenticated;
grant execute on function public.reserve_wendao_question_unlimited(uuid, uuid, date, date) to service_role;
