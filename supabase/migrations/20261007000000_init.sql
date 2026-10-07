-- BloomCraft database: catalogue, orders, custom requests, maker (admin) access.
-- Run once in Supabase → SQL Editor (or `supabase db push`). Safe to read top to bottom:
--   1. tables          2. helper functions      3. row-level security
--   4. order / request RPCs (the only way customers write data)
--   5. realtime        6. grants

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- The maker's login e-mail(s). Only confirmed accounts with one of these e-mails are admins.
create table public.admin_emails (
  email text primary key check (email = lower(email))
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 80),
  email       text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id                 text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name               text not null check (char_length(name) between 2 and 120),
  images             text[] not null default '{}',
  description        text not null default '',
  short_description  text not null default '',
  price              integer not null check (price >= 0),           -- paise
  compare_at_price   integer check (compare_at_price is null or compare_at_price >= 0),
  category           text not null check (category in ('keychain', 'customized', 'bouquet', 'other')),
  keychain_type      text check (keychain_type in ('tulip', 'daisy', 'rose', 'others')),
  tags               text[] not null default '{}',
  colors             jsonb not null default '[]'::jsonb check (jsonb_typeof(colors) = 'array'),
  availability       text not null default 'in_stock'
                     check (availability in ('in_stock', 'made_to_order', 'out_of_stock')),
  stock              integer check (stock is null or stock >= 0),
  max_qty_per_order  integer not null default 10 check (max_qty_per_order between 1 and 100),
  making_time_days   integer not null default 2 check (making_time_days between 0 and 60),
  is_customizable    boolean not null default false,
  yarn_type          text,
  dimensions         text,
  stems_count        text,
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.coupons (
  code             text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  type             text not null check (type in ('percentage', 'flat')),
  discount_value   integer not null check (discount_value > 0),   -- % or paise
  min_order_paise  integer not null default 0 check (min_order_paise >= 0),
  description      text not null default '',
  active           boolean not null default true,
  expires_at       timestamptz,
  check (type <> 'percentage' or discount_value <= 90)
);

create sequence public.order_number_seq start 1;
create sequence public.custom_request_number_seq start 1;

create table public.orders (
  id                   text primary key,                      -- BC-2026-00001
  user_id              uuid references auth.users (id) on delete set null,
  customer             jsonb not null,                        -- {name, phone, email?}
  -- NULL only for past in-person sales imported from records (see past_orders.sql);
  -- every order placed on the website must have a valid mobile number.
  customer_phone       text check (customer_phone ~ '^[6-9][0-9]{9}$'),
  items                jsonb not null check (jsonb_typeof(items) = 'array'),
  pricing              jsonb not null,                        -- paise: subtotal, delivery, giftWrap, discount, total
  delivery             jsonb not null,                        -- {method, details, charge}
  payment              jsonb not null,                        -- {method, status, upiTxnRef?}
  gift_wrap_requested  boolean not null default false,
  gift_message         text check (char_length(gift_message) <= 300),
  coupon_code          text,
  status               text not null default 'placed'
                       check (status in ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled')),
  status_history       jsonb not null default '[]'::jsonb,
  client_ref           uuid unique,                           -- browser-generated; makes retries safe
  client_ip_hash       text,                                  -- sha256 of the caller IP, for rate limits
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_phone_idx on public.orders (customer_phone);
create index orders_created_idx on public.orders (created_at desc);
create index orders_ip_idx on public.orders (client_ip_hash, created_at);
-- A UPI reference can pay for one order only.
create unique index orders_utr_unique on public.orders ((payment ->> 'upiTxnRef'))
  where payment ->> 'upiTxnRef' is not null;

create table public.custom_requests (
  id                text primary key,                         -- CUSTOM-BC-001
  user_id           uuid references auth.users (id) on delete set null,
  customer          jsonb not null,
  customer_phone    text not null check (customer_phone ~ '^[6-9][0-9]{9}$'),
  item_type         text check (char_length(item_type) <= 80),
  reference_images  text[] not null default '{}',
  description       text not null check (char_length(description) between 5 and 2000),
  colors            text[] not null default '{}',
  quantity          integer not null default 1 check (quantity between 1 and 500),
  budget            jsonb not null default '{}'::jsonb,       -- rupees {min?, max?}
  needed_by         date,
  occasion          text check (char_length(occasion) <= 80),
  status            text not null default 'received'
                    check (status in ('received', 'quoted', 'accepted', 'in_progress', 'completed', 'declined')),
  quoted_price      integer check (quoted_price is null or quoted_price >= 0),   -- rupees
  notes             text check (char_length(notes) <= 2000),
  client_ip_hash    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index custom_requests_created_idx on public.custom_requests (created_at desc);
create index custom_requests_user_idx on public.custom_requests (user_id);
create index custom_requests_ip_idx on public.custom_requests (client_ip_hash, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Helper functions & triggers
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger custom_requests_touch before update on public.custom_requests
  for each row execute function public.touch_updated_at();

-- Every new sign-up (Google, e-mail, phone) gets a profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''), 80),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indian mobile → 10 digits (drops +91 / 91 / leading 0 and separators). NULL when invalid.
create or replace function public.normalize_phone(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d ~ '^[6-9][0-9]{9}$' then d
    when d ~ '^91[6-9][0-9]{9}$' then substr(d, 3)
    when d ~ '^0[6-9][0-9]{9}$' then substr(d, 2)
  end
  from (select regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g') as d) s;
$$;

-- Trimmed text, NULL when empty, cut to max_len.
create or replace function public.clean_text(raw text, max_len integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(nullif(trim(coalesce(raw, '')), ''), max_len);
$$;

-- SHA-256 of the caller's IP (first X-Forwarded-For entry set by the Supabase gateway).
-- Only the hash is stored; it is used to rate-limit anonymous checkouts.
create or replace function public.request_ip_hash()
returns text
language sql
stable
set search_path = ''
as $$
  select encode(sha256(convert_to(ip, 'UTF8')), 'hex')
  from (
    select nullif(trim(split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), '') as ip
  ) s
  where ip is not null;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row-level security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.admin_emails enable row level security;      -- no policies: invisible via the API
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.custom_requests enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy products_public_read on public.products
  for select to anon, authenticated using (is_active or public.is_admin());
create policy products_admin_insert on public.products
  for insert to authenticated with check (public.is_admin());
create policy products_admin_update on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on public.products
  for delete to authenticated using (public.is_admin());

-- Customers cannot list coupons; they check one code at a time with public.check_coupon().
create policy coupons_admin_write on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Customers see their own orders; the maker sees all. Writes go through the functions below.
create policy orders_select on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy custom_requests_select on public.custom_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy custom_requests_admin_update on public.custom_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPCs
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.order_to_json(o public.orders)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'createdAt', o.created_at,
    'customer', o.customer,
    'items', o.items,
    'pricing', o.pricing,
    'delivery', o.delivery,
    'payment', o.payment,
    'giftWrapRequested', o.gift_wrap_requested,
    'giftMessage', o.gift_message,
    'couponCode', o.coupon_code,
    'status', o.status,
    'statusHistory', o.status_history
  );
$$;

-- Places an order. Prices, delivery, gift wrap and coupon are recomputed here from the
-- database, so a tampered browser cannot change what an order costs.
-- Keep the constants in sync with frontend/src/config (delivery.config.ts, payment.config.ts).
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_gift_wrap      constant integer := 4000;    -- ₹40
  c_parcel_charge  constant integer := 6000;    -- ₹60
  c_parcel_free    constant integer := 99900;   -- free parcel from ₹999

  v_name      text := public.clean_text(payload #>> '{customer,name}', 80);
  v_phone     text := public.normalize_phone(payload #>> '{customer,phone}');
  v_email     text := lower(public.clean_text(payload #>> '{customer,email}', 120));
  v_method    text := payload #>> '{delivery,method}';
  v_details   jsonb := coalesce(payload #> '{delivery,details}', '{}'::jsonb);
  v_pay       text := payload #>> '{payment,method}';
  v_utr       text := nullif(regexp_replace(coalesce(payload #>> '{payment,upiTxnRef}', ''), '\s', '', 'g'), '');
  v_gift      boolean := false;
  v_gift_msg  text := public.clean_text(payload ->> 'giftMessage', 300);
  v_code      text := upper(public.clean_text(payload ->> 'couponCode', 20));
  v_expected  integer;
  v_ref       uuid;
  v_ip        text := public.request_ip_hash();

  v_item      jsonb;
  v_product   public.products;
  v_qty       integer;
  v_color     text;
  v_note      text;
  v_items     jsonb := '[]'::jsonb;
  v_subtotal  integer := 0;
  v_delivery  integer := 0;
  v_wrap      integer := 0;
  v_discount  integer := 0;
  v_total     integer;
  v_coupon    public.coupons;
  v_clean     jsonb;
  v_id        text;
  v_now       timestamptz := now();
  v_order     public.orders;
  v_label     text;
begin
  v_gift := coalesce((payload ->> 'giftWrapRequested')::boolean, false);
  v_expected := (payload ->> 'expectedTotal')::integer;
  v_ref := nullif(payload ->> 'clientRef', '')::uuid;

  -- Customer
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Please enter your name' using errcode = 'P0001';
  end if;
  if v_phone is null then
    raise exception 'Please enter a valid 10-digit Indian mobile number' using errcode = 'P0001';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid e-mail address' using errcode = 'P0001';
  end if;

  -- Retried submit (e.g. the connection dropped after the order was saved): return the same order.
  if v_ref is not null then
    select * into v_order from public.orders where client_ref = v_ref;
    if found then
      if v_order.customer_phone <> v_phone then
        raise exception 'This order could not be placed. Please refresh and try again.' using errcode = 'P0001';
      end if;
      return public.order_to_json(v_order);
    end if;
  end if;

  -- Abuse guards: at most 8 orders per phone and 20 per network address per hour.
  if (select count(*) from public.orders
      where customer_phone = v_phone and created_at > v_now - interval '1 hour') >= 8 then
    raise exception 'Too many orders from this number. Please message us on WhatsApp.' using errcode = 'P0001';
  end if;
  if v_ip is not null and (select count(*) from public.orders
      where client_ip_hash = v_ip and created_at > v_now - interval '1 hour') >= 20 then
    raise exception 'Too many orders right now. Please try again later or message us on WhatsApp.' using errcode = 'P0001';
  end if;

  -- Items
  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0
     or jsonb_array_length(payload -> 'items') > 30 then
    raise exception 'Your cart is empty' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    select * into v_product from public.products
      where id = v_item ->> 'productId' and is_active;
    if not found then
      raise exception 'An item in your cart is no longer available. Please remove it and try again.' using errcode = 'P0001';
    end if;
    if v_product.availability = 'out_of_stock' then
      raise exception '% is out of stock', v_product.name using errcode = 'P0001';
    end if;

    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_qty < 1 or v_qty > v_product.max_qty_per_order then
      raise exception 'You can order 1 to % of %', v_product.max_qty_per_order, v_product.name using errcode = 'P0001';
    end if;

    v_color := public.clean_text(v_item ->> 'selectedColor', 60);
    if v_color is not null and jsonb_array_length(v_product.colors) > 0 and not exists (
      select 1 from jsonb_array_elements(v_product.colors) c where c ->> 'name' = v_color
    ) then
      v_color := null;
    end if;
    v_note := public.clean_text(v_item ->> 'customNote', 30);

    v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'id', v_product.id || '-' || coalesce(v_color, 'default') || '-' || coalesce(v_note, 'none'),
      'productId', v_product.id,
      'name', v_product.name,
      'image', v_product.images[1],
      'quantity', v_qty,
      'selectedColor', v_color,
      'customNote', v_note,
      'priceAtAdd', v_product.price
    )));
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  -- Delivery
  if v_method = 'vadodara_local' then
    v_clean := jsonb_build_object(
      'area', public.clean_text(v_details ->> 'area', 80),
      'preferredDate', public.clean_text(v_details ->> 'preferredDate', 20),
      'preferredTimeSlot', public.clean_text(v_details ->> 'preferredTimeSlot', 60),
      'message', public.clean_text(v_details ->> 'message', 300));
    if v_clean ->> 'area' is null or v_clean ->> 'preferredDate' is null or v_clean ->> 'preferredTimeSlot' is null then
      raise exception 'Please choose a handover area, date and time slot' using errcode = 'P0001';
    end if;
    v_label := 'Vadodara Local Handover';
  elsif v_method = 'college' then
    v_clean := jsonb_build_object(
      'collegeName', public.clean_text(v_details ->> 'collegeName', 120),
      'campus', public.clean_text(v_details ->> 'campus', 120),
      'deliveryPoint', public.clean_text(v_details ->> 'deliveryPoint', 120),
      'preferredDate', public.clean_text(v_details ->> 'preferredDate', 20),
      'instructions', public.clean_text(v_details ->> 'instructions', 300));
    if v_clean ->> 'collegeName' is null or v_clean ->> 'deliveryPoint' is null or v_clean ->> 'preferredDate' is null then
      raise exception 'Please choose your college, delivery point and date' using errcode = 'P0001';
    end if;
    v_label := 'College Campus Delivery';
  elsif v_method = 'parcel' then
    v_clean := jsonb_build_object(
      'house', public.clean_text(v_details ->> 'house', 120),
      'street', public.clean_text(v_details ->> 'street', 120),
      'area', public.clean_text(v_details ->> 'area', 120),
      'city', public.clean_text(v_details ->> 'city', 60),
      'state', public.clean_text(v_details ->> 'state', 60),
      'pincode', public.clean_text(v_details ->> 'pincode', 6),
      'instructions', public.clean_text(v_details ->> 'instructions', 300));
    if v_clean ->> 'house' is null or v_clean ->> 'city' is null or v_clean ->> 'state' is null
       or coalesce(v_clean ->> 'pincode', '') !~ '^[1-9][0-9]{5}$' then
      raise exception 'Please complete your shipping address and 6-digit PIN code' using errcode = 'P0001';
    end if;
    v_delivery := case when v_subtotal >= c_parcel_free then 0 else c_parcel_charge end;
    v_label := 'Courier Parcel';
  else
    raise exception 'Please choose a delivery method' using errcode = 'P0001';
  end if;
  v_clean := jsonb_strip_nulls(v_clean);

  -- Gift wrap & coupon
  if v_gift then
    v_wrap := c_gift_wrap;
  end if;
  if v_code is not null then
    select * into v_coupon from public.coupons
      where code = v_code and active and (expires_at is null or expires_at > v_now);
    if not found then
      raise exception 'Coupon % is not valid any more', v_code using errcode = 'P0001';
    end if;
    if v_subtotal < v_coupon.min_order_paise then
      raise exception 'Coupon % needs a minimum order of ₹%', v_code, v_coupon.min_order_paise / 100 using errcode = 'P0001';
    end if;
    v_discount := case
      when v_coupon.type = 'percentage' then round(v_subtotal * v_coupon.discount_value / 100.0)::integer
      else least(v_coupon.discount_value, v_subtotal)
    end;
  end if;

  v_total := greatest(0, v_subtotal + v_delivery + v_wrap - v_discount);
  if v_expected is not null and v_expected <> v_total then
    raise exception 'Prices were updated. Please review your order — the new total is ₹%.', round(v_total / 100.0, 2)
      using errcode = 'P0001';
  end if;

  -- Payment
  if v_pay = 'upi' then
    if v_utr is null or v_utr !~ '^[0-9]{12}$' then
      raise exception 'Please enter the 12-digit UPI reference (UTR) from your payment app' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.orders where payment ->> 'upiTxnRef' = v_utr) then
      raise exception 'This UPI reference has already been used for another order' using errcode = 'P0001';
    end if;
  elsif v_pay = 'cod' then
    v_utr := null;
  else
    raise exception 'Please choose a payment method' using errcode = 'P0001';
  end if;

  v_id := 'BC-' || to_char(v_now at time zone 'Asia/Kolkata', 'YYYY') || '-'
          || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    id, user_id, customer, customer_phone, items, pricing, delivery, payment,
    gift_wrap_requested, gift_message, coupon_code, status, status_history, client_ref, client_ip_hash, created_at
  ) values (
    v_id,
    auth.uid(),
    jsonb_strip_nulls(jsonb_build_object('name', v_name, 'phone', v_phone, 'email', v_email)),
    v_phone,
    v_items,
    jsonb_build_object('subtotal', v_subtotal, 'delivery', v_delivery, 'giftWrap', v_wrap,
                       'discount', v_discount, 'total', v_total),
    jsonb_build_object('method', v_method, 'details', v_clean, 'charge', v_delivery),
    jsonb_strip_nulls(jsonb_build_object(
      'method', v_pay,
      'status', case when v_pay = 'upi' then 'awaiting_verification' else 'pending' end,
      'upiTxnRef', v_utr)),
    v_gift,
    case when v_gift then v_gift_msg end,
    case when v_discount > 0 then v_code end,
    'placed',
    jsonb_build_array(jsonb_build_object('status', 'placed', 'at', v_now, 'note', 'Order placed via ' || v_label)),
    v_ref,
    v_ip,
    v_now
  )
  returning * into v_order;

  return public.order_to_json(v_order);
exception
  when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
    raise exception 'Some order details were not valid. Please refresh the page and try again.' using errcode = 'P0001';
  when unique_violation then
    raise exception 'This order was already received. Please check My Orders before trying again.' using errcode = 'P0001';
end;
$$;

-- Looks up one coupon code (codes stay private: there is no way to list them).
create or replace function public.check_coupon(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', c.code, 'type', c.type, 'discountValue', c.discount_value,
    'minOrderPaise', c.min_order_paise, 'description', c.description)
  from public.coupons c
  where c.code = upper(trim(p_code))
    and c.active
    and (c.expires_at is null or c.expires_at > now());
$$;

-- Guest order tracking: needs both the order number and the phone used at checkout.
create or replace function public.track_order(p_order_id text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.order_to_json(o)
  from public.orders o
  where o.id = upper(trim(p_order_id))
    and o.customer_phone = public.normalize_phone(p_phone);
$$;

create or replace function public.admin_update_order_status(p_order_id text, p_status text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Only the maker can update orders' using errcode = '42501';
  end if;
  if p_status not in ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Unknown order status %', p_status using errcode = 'P0001';
  end if;
  update public.orders
     set status = p_status,
         status_history = status_history || jsonb_build_array(jsonb_build_object(
           'status', p_status, 'at', now(),
           'note', coalesce(public.clean_text(p_note, 300), 'Status updated to ' || p_status)))
   where id = p_order_id
  returning * into v_order;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'P0002';
  end if;
  return public.order_to_json(v_order);
end;
$$;

create or replace function public.admin_set_payment_status(p_order_id text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Only the maker can update payments' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded') then
    raise exception 'Unknown payment status %', p_status using errcode = '22023';
  end if;
  update public.orders
     set payment = payment || jsonb_build_object('status', p_status),
         status_history = case when p_status = 'paid'
           then status_history || jsonb_build_array(jsonb_build_object(
                  'status', status, 'at', now(), 'note', 'Payment received ✓'))
           else status_history end
   where id = p_order_id
  returning * into v_order;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'P0002';
  end if;
  return public.order_to_json(v_order);
end;
$$;

create or replace function public.submit_custom_request(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name   text := public.clean_text(payload #>> '{customer,name}', 80);
  v_phone  text := public.normalize_phone(payload #>> '{customer,phone}');
  v_desc   text := public.clean_text(payload ->> 'description', 2000);
  v_colors text[];
  v_id     text;
  v_row    public.custom_requests;
  v_ip     text := public.request_ip_hash();
begin
  if v_name is null then
    raise exception 'Please enter your name' using errcode = 'P0001';
  end if;
  if v_phone is null then
    raise exception 'Please enter a valid 10-digit Indian mobile number' using errcode = 'P0001';
  end if;
  if v_desc is null or char_length(v_desc) < 5 then
    raise exception 'Please describe your idea in a few words' using errcode = 'P0001';
  end if;
  if (select count(*) from public.custom_requests
      where customer_phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests from this number. Please message us on WhatsApp.' using errcode = 'P0001';
  end if;
  if v_ip is not null and (select count(*) from public.custom_requests
      where client_ip_hash = v_ip and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many requests right now. Please try again later or message us on WhatsApp.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(left(trim(c), 40)), '{}') into v_colors
    from jsonb_array_elements_text(coalesce(payload -> 'colors', '[]'::jsonb)) c
   where trim(c) <> '';

  v_id := 'CUSTOM-BC-' || lpad(nextval('public.custom_request_number_seq')::text, 3, '0');

  insert into public.custom_requests (id, user_id, customer, customer_phone, item_type, description, colors,
                                      quantity, occasion, client_ip_hash)
  values (
    v_id, auth.uid(),
    jsonb_strip_nulls(jsonb_build_object('name', v_name, 'phone', v_phone,
                                         'email', lower(public.clean_text(payload #>> '{customer,email}', 120)))),
    v_phone,
    public.clean_text(payload ->> 'itemType', 80),
    v_desc,
    v_colors[1:10],
    greatest(1, least(500, coalesce((payload ->> 'quantity')::integer, 1))),
    public.clean_text(payload ->> 'occasion', 80),
    v_ip
  )
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'createdAt', v_row.created_at, 'status', v_row.status);
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'Some details were not valid. Please check the form and try again.' using errcode = 'P0001';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Realtime: the maker dashboard hears new orders and requests instantly (RLS still applies)
-- ─────────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.orders, public.custom_requests;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Grants
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
revoke all on function public.track_order(text, text) from public, anon, authenticated;
revoke all on function public.check_coupon(text) from public, anon, authenticated;
revoke all on function public.submit_custom_request(jsonb) from public, anon, authenticated;
revoke all on function public.admin_update_order_status(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_payment_status(text, text) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.request_ip_hash() from public, anon, authenticated;

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.check_coupon(text) to anon, authenticated;
grant execute on function public.submit_custom_request(jsonb) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.admin_update_order_status(text, text, text) to authenticated;
grant execute on function public.admin_set_payment_status(text, text) to authenticated;

-- Supabase grants every privilege on new tables to anon/authenticated by default. TRUNCATE,
-- REFERENCES and TRIGGER ignore row-level security, so take them away everywhere.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Direct table writes are limited to what the policies above allow.
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, delete on public.custom_requests from anon, authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;   -- customers may change only their name
revoke all on public.profiles from anon;
revoke all on public.orders, public.custom_requests, public.coupons from anon;  -- guests use the functions only
revoke all on public.admin_emails from anon, authenticated;
