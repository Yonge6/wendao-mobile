create or replace function public.reserve_wendao_question_daily_free(
  p_user_id uuid,
  p_request_id uuid,
  p_period_start date,
  p_period_end date
)
returns table (
  reservation_state text,
  is_unlimited boolean,
  remaining_free_questions integer,
  questions_today integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state text;
  v_unlimited boolean;
  v_used integer;
  v_stale record;
  v_allowance constant integer := 3;
begin
  if p_period_end <> p_period_start + 1 then
    raise exception using errcode = 'P0001', message = 'invalid_usage_period';
  end if;

  select exists (
    select 1 from public.wendao_entitlements as entitlement
    where entitlement.user_id = p_user_id
      and entitlement.status in ('active', 'grace')
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  ) into v_unlimited;

  select question_request.state
  into v_state
  from public.wendao_question_requests as question_request
  where question_request.request_id = p_request_id
    and question_request.user_id = p_user_id;

  if found then
    select usage.used_questions into v_used
    from public.wendao_usage_periods as usage
    where usage.user_id = p_user_id and usage.period_start = p_period_start;
    return query select v_state, v_unlimited,
      case when v_unlimited then null else greatest(0, v_allowance - coalesce(v_used, 0)) end,
      coalesce(v_used, 0);
    return;
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
    p_user_id, p_period_start, p_period_end,
    case when v_unlimited then null else v_allowance end
  ) on conflict (user_id, period_start) do update
    set period_end = excluded.period_end,
        question_allowance = excluded.question_allowance;

  select usage.used_questions into v_used
  from public.wendao_usage_periods as usage
  where usage.user_id = p_user_id and usage.period_start = p_period_start
  for update;

  if not v_unlimited and v_used >= v_allowance then
    raise exception using errcode = 'P0001', message = 'daily_free_limit_reached';
  end if;

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
    update public.wendao_usage_periods
    set used_questions = greatest(0, used_questions - 1)
    where user_id = p_user_id and period_start = p_period_start;
    raise exception using errcode = 'P0001', message = 'request_in_progress';
  end;

  return query select 'reserved'::text, v_unlimited,
    case when v_unlimited then null else greatest(0, v_allowance - v_used - 1) end,
    v_used + 1;
end;
$$;

revoke all on function public.reserve_wendao_question_daily_free(uuid, uuid, date, date) from public, anon, authenticated;
grant execute on function public.reserve_wendao_question_daily_free(uuid, uuid, date, date) to service_role;
