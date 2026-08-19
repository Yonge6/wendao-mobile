create or replace function public.save_wendao_weekly_reflection(
  p_user_id uuid,
  p_week_start date,
  p_locale text,
  p_content text,
  p_chapter_ids integer[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_locale not in ('zh', 'en')
    or char_length(p_content) not between 1 and 12000
    or exists (select 1 from unnest(p_chapter_ids) as chapter_id where chapter_id not between 1 and 81) then
    raise exception using errcode = 'P0001', message = 'invalid_weekly_reflection';
  end if;
  if not exists (
    select 1 from public.wendao_entitlements as entitlement
    where entitlement.user_id = p_user_id
      and entitlement.status in ('active', 'grace')
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  ) then
    raise exception using errcode = 'P0001', message = 'subscription_required';
  end if;

  insert into public.wendao_weekly_reflections (
    user_id,
    week_start,
    locale,
    content,
    chapter_ids
  ) values (
    p_user_id,
    p_week_start,
    p_locale,
    p_content,
    p_chapter_ids
  )
  on conflict (user_id, week_start) do update
    set locale = excluded.locale,
        content = excluded.content,
        chapter_ids = excluded.chapter_ids
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.save_wendao_weekly_reflection(uuid, date, text, text, integer[]) from public, anon, authenticated;
grant execute on function public.save_wendao_weekly_reflection(uuid, date, text, text, integer[]) to service_role;
