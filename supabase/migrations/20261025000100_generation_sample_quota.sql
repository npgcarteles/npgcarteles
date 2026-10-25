create table if not exists public.generation_sample_quotas (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  used_count integer not null default 0 check (used_count between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_sample_reservations (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null references public.generation_sample_quotas(ip_hash) on delete cascade,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists generation_sample_reservations_ip_expiry_idx
  on public.generation_sample_reservations (ip_hash, expires_at);
create index if not exists generation_sample_reservations_expiry_idx
  on public.generation_sample_reservations (expires_at);

alter table public.generation_sample_quotas enable row level security;
alter table public.generation_sample_reservations enable row level security;

create or replace function public.reserve_generation_sample(p_ip_hash text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
  v_pending integer;
  v_reservation uuid;
begin
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid IP hash';
  end if;

  insert into public.generation_sample_quotas (ip_hash)
  values (p_ip_hash)
  on conflict (ip_hash) do nothing;

  select used_count into v_used
  from public.generation_sample_quotas
  where ip_hash = p_ip_hash
  for update;

  delete from public.generation_sample_reservations where expires_at <= now();

  select count(*)::integer into v_pending
  from public.generation_sample_reservations
  where ip_hash = p_ip_hash and expires_at > now();

  if v_used + v_pending >= 2 then
    return null;
  end if;

  insert into public.generation_sample_reservations (ip_hash)
  values (p_ip_hash)
  returning id into v_reservation;

  return v_reservation;
end;
$$;

create or replace function public.finish_generation_sample(p_reservation_id uuid, p_succeeded boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ip_hash text;
begin
  select ip_hash into v_ip_hash
  from public.generation_sample_reservations
  where id = p_reservation_id
  for update;

  if v_ip_hash is null then
    return;
  end if;

  if p_succeeded then
    update public.generation_sample_quotas
    set used_count = least(2, used_count + 1), updated_at = now()
    where ip_hash = v_ip_hash;
  end if;

  delete from public.generation_sample_reservations where id = p_reservation_id;
end;
$$;

create or replace function public.generation_sample_usage(p_ip_hash text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
  v_pending integer;
begin
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid IP hash';
  end if;

  select used_count into v_used
  from public.generation_sample_quotas
  where ip_hash = p_ip_hash;

  if v_used is null then
    return 0;
  end if;

  select count(*)::integer into v_pending
  from public.generation_sample_reservations
  where ip_hash = p_ip_hash and expires_at > now();

  return least(2, v_used + v_pending);
end;
$$;

revoke all on public.generation_sample_quotas from public, anon, authenticated;
revoke all on public.generation_sample_reservations from public, anon, authenticated;
revoke all on function public.reserve_generation_sample(text) from public, anon, authenticated;
revoke all on function public.finish_generation_sample(uuid, boolean) from public, anon, authenticated;
revoke all on function public.generation_sample_usage(text) from public, anon, authenticated;
grant execute on function public.reserve_generation_sample(text) to service_role;
grant execute on function public.finish_generation_sample(uuid, boolean) to service_role;
grant execute on function public.generation_sample_usage(text) to service_role;

