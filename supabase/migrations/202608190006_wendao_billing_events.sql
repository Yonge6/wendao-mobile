create table public.wendao_checkout_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'annual')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.wendao_checkout_locks enable row level security;
alter table public.wendao_checkout_locks force row level security;
revoke all on table public.wendao_checkout_locks from public, anon, authenticated;

create or replace function public.reserve_wendao_checkout(p_user_id uuid, p_plan text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if p_plan not in ('monthly', 'annual') then
    raise exception using errcode = 'P0001', message = 'invalid_plan';
  end if;
  insert into public.wendao_checkout_locks (user_id, plan, expires_at)
  values (p_user_id, p_plan, now() + interval '30 minutes')
  on conflict (user_id) do update set
    plan = excluded.plan,
    expires_at = excluded.expires_at,
    created_at = now()
  where public.wendao_checkout_locks.expires_at <= now()
  returning user_id into v_user_id;
  return v_user_id is not null;
end;
$$;

create or replace function public.release_wendao_checkout(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.wendao_checkout_locks where user_id = p_user_id;
  return found;
end;
$$;

revoke all on function public.reserve_wendao_checkout(uuid, text) from public, anon, authenticated;
revoke all on function public.release_wendao_checkout(uuid) from public, anon, authenticated;
grant execute on function public.reserve_wendao_checkout(uuid, text) to service_role;
grant execute on function public.release_wendao_checkout(uuid) to service_role;

create or replace function public.process_wendao_billing_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_user_id uuid default null,
  p_status text default null,
  p_product_id text default null,
  p_provider_customer_id text default null,
  p_provider_subscription_id text default null,
  p_starts_at timestamptz default null,
  p_expires_at timestamptz default null
)
returns table (processed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted_id bigint;
begin
  if p_provider not in ('apple', 'stripe') then
    raise exception using errcode = 'P0001', message = 'invalid_billing_provider';
  end if;
  if p_status is not null and p_status not in (
    'none', 'active', 'grace', 'past_due', 'expired', 'revoked'
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_entitlement_status';
  end if;

  insert into public.wendao_billing_events (
    user_id, provider, provider_event_id, event_type, payload_hash, processed_at
  ) values (
    p_user_id, p_provider, p_provider_event_id, p_event_type, p_payload_hash, now()
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return query select false;
    return;
  end if;

  if p_user_id is not null and p_status is not null then
    insert into public.wendao_entitlements (
      user_id,
      status,
      source,
      product_id,
      provider_customer_id,
      provider_subscription_id,
      starts_at,
      expires_at
    ) values (
      p_user_id,
      p_status,
      p_provider,
      p_product_id,
      p_provider_customer_id,
      p_provider_subscription_id,
      p_starts_at,
      p_expires_at
    )
    on conflict (user_id) do update set
      status = excluded.status,
      source = excluded.source,
      product_id = coalesce(excluded.product_id, public.wendao_entitlements.product_id),
      provider_customer_id = coalesce(excluded.provider_customer_id, public.wendao_entitlements.provider_customer_id),
      provider_subscription_id = coalesce(excluded.provider_subscription_id, public.wendao_entitlements.provider_subscription_id),
      starts_at = coalesce(excluded.starts_at, public.wendao_entitlements.starts_at),
      expires_at = excluded.expires_at
    where public.wendao_entitlements.source in ('none', excluded.source)
      or public.wendao_entitlements.status in ('none', 'expired', 'revoked')
      or (
        public.wendao_entitlements.expires_at is not null
        and public.wendao_entitlements.expires_at <= now()
      );
  end if;

  if p_user_id is not null and p_event_type = 'checkout.session.completed' then
    delete from public.wendao_checkout_locks where user_id = p_user_id;
  end if;

  return query select true;
end;
$$;

revoke all on function public.process_wendao_billing_event(
  text, text, text, text, uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.process_wendao_billing_event(
  text, text, text, text, uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
