-- Saved delivery addresses and verified phone numbers for customer accounts.
-- Run once in Supabase → SQL Editor after 20261007000000_init.sql.

-- ─────────────────────────────────────────────────────────────────────────────
-- Saved addresses: each customer manages only their own (max 10).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null default 'Home' check (char_length(label) between 1 and 30),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),
  house       text not null check (char_length(house) between 1 and 120),
  street      text check (char_length(street) <= 120),
  area        text check (char_length(area) <= 120),
  landmark    text check (char_length(landmark) <= 120),
  city        text not null check (char_length(city) between 2 and 60),
  state       text not null check (char_length(state) between 2 and 60),
  pincode     text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id, is_default desc, created_at);
-- At most one default address per customer.
create unique index addresses_one_default on public.addresses (user_id) where is_default;

create trigger addresses_touch before update on public.addresses
  for each row execute function public.touch_updated_at();

-- Keeps the 10-address limit and makes a newly marked default the only default.
create or replace function public.addresses_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.addresses where user_id = new.user_id) >= 10 then
    raise exception 'You can save up to 10 addresses. Please delete one first.' using errcode = 'P0001';
  end if;
  if new.is_default then
    update public.addresses set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger addresses_guard before insert or update on public.addresses
  for each row execute function public.addresses_guard();

alter table public.addresses enable row level security;

create policy addresses_own_select on public.addresses
  for select to authenticated using (user_id = auth.uid());
create policy addresses_own_insert on public.addresses
  for insert to authenticated with check (user_id = auth.uid());
create policy addresses_own_update on public.addresses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_own_delete on public.addresses
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.addresses from anon;
revoke truncate, references, trigger on public.addresses from authenticated;
revoke all on function public.addresses_guard() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verified phone: when Supabase Auth confirms a phone (SMS code), copy it to the profile.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists phone_verified boolean not null default false;

create or replace function public.sync_verified_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone or new.phone_confirmed_at is distinct from old.phone_confirmed_at then
    update public.profiles
       set phone = public.normalize_phone(new.phone),
           phone_verified = new.phone_confirmed_at is not null and new.phone is not null
     where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_phone_changed
  after update of phone, phone_confirmed_at on auth.users
  for each row execute function public.sync_verified_phone();

revoke all on function public.sync_verified_phone() from public, anon, authenticated;
