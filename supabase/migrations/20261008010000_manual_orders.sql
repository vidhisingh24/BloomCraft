-- Orders the maker records by hand (Instagram, WhatsApp, in person …) so every sale is in one place.
-- Run once in Supabase → SQL Editor after the earlier migrations.

alter table public.orders
  add column if not exists source text not null default 'website'
    check (source in ('website', 'instagram', 'whatsapp', 'in_person', 'other')),
  add column if not exists maker_note text check (char_length(maker_note) <= 500);

-- The 18 sales recorded before the website launched came from outside the website.
update public.orders set source = 'other' where coalesce(payment ->> 'provider', '') = 'Google Pay' and user_id is null;

-- Include the new fields in what the app reads.
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
    'statusHistory', o.status_history,
    'source', o.source,
    'makerNote', o.maker_note
  );
$$;

-- Maker only: record an order that was placed outside the website.
-- payload = {
--   source, orderedAt (date), customer {name, phone?},
--   items [{name, quantity, price (paise), productId?, image?}],
--   deliveryCharge?, discount? (paise), deliveryMethod?, payment {method: upi|cod, provider?, status: paid|pending},
--   status?, note?
-- }
create or replace function public.admin_add_manual_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source    text := coalesce(payload ->> 'source', 'other');
  v_name      text := public.clean_text(payload #>> '{customer,name}', 80);
  v_phone_raw text := public.clean_text(payload #>> '{customer,phone}', 20);
  v_phone     text;
  v_at        timestamptz;
  v_item      jsonb;
  v_items     jsonb := '[]'::jsonb;
  v_n         integer := 0;
  v_qty       integer;
  v_price     integer;
  v_iname     text;
  v_subtotal  integer := 0;
  v_delivery  integer := 0;
  v_discount  integer := 0;
  v_total     integer;
  v_method    text := coalesce(payload ->> 'deliveryMethod', 'vadodara_local');
  v_pay       text := coalesce(payload #>> '{payment,method}', 'upi');
  v_paystatus text := coalesce(payload #>> '{payment,status}', 'paid');
  v_provider  text := public.clean_text(payload #>> '{payment,provider}', 30);
  v_status    text := coalesce(payload ->> 'status', 'delivered');
  v_note      text := public.clean_text(payload ->> 'note', 500);
  v_id        text;
  v_label     text;
  v_order     public.orders;
begin
  if not public.is_admin() then
    raise exception 'Only the maker can add orders by hand' using errcode = '42501';
  end if;

  if v_source not in ('instagram', 'whatsapp', 'in_person', 'other') then
    raise exception 'Choose where the order came from' using errcode = 'P0001';
  end if;
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Please enter the customer''s name' using errcode = 'P0001';
  end if;
  if v_phone_raw is not null then
    v_phone := public.normalize_phone(v_phone_raw);
    if v_phone is null then
      raise exception 'The mobile number should have 10 digits (or leave it empty)' using errcode = 'P0001';
    end if;
  end if;

  v_at := coalesce((payload ->> 'orderedAt')::date::timestamp at time zone 'Asia/Kolkata' + interval '12 hours', now());
  if v_at > now() + interval '1 day' then
    raise exception 'The order date cannot be in the future' using errcode = 'P0001';
  end if;

  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0
     or jsonb_array_length(payload -> 'items') > 30 then
    raise exception 'Add at least one item' using errcode = 'P0001';
  end if;
  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_n := v_n + 1;
    v_iname := public.clean_text(v_item ->> 'name', 120);
    v_qty := (v_item ->> 'quantity')::integer;
    v_price := (v_item ->> 'price')::integer;
    if v_iname is null then
      raise exception 'Item % needs a name', v_n using errcode = 'P0001';
    end if;
    if v_qty is null or v_qty < 1 or v_qty > 500 then
      raise exception 'Item % needs a quantity between 1 and 500', v_n using errcode = 'P0001';
    end if;
    if v_price is null or v_price < 0 or v_price > 10000000 then
      raise exception 'Item % needs a valid price', v_n using errcode = 'P0001';
    end if;
    v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'id', 'manual-' || v_n,
      'productId', coalesce(public.clean_text(v_item ->> 'productId', 60), 'manual'),
      'name', v_iname,
      'image', coalesce(public.clean_text(v_item ->> 'image', 300), '/favicon.svg'),
      'quantity', v_qty,
      'selectedColor', public.clean_text(v_item ->> 'selectedColor', 60),
      'customNote', public.clean_text(v_item ->> 'customNote', 60),
      'priceAtAdd', v_price
    )));
    v_subtotal := v_subtotal + v_qty * v_price;
  end loop;

  v_delivery := greatest(0, coalesce((payload ->> 'deliveryCharge')::integer, 0));
  v_discount := greatest(0, coalesce((payload ->> 'discount')::integer, 0));
  v_total := greatest(0, v_subtotal + v_delivery - v_discount);

  if v_method not in ('vadodara_local', 'college', 'parcel') then
    raise exception 'Unknown delivery method' using errcode = 'P0001';
  end if;
  if v_pay not in ('upi', 'cod') then
    raise exception 'Unknown payment method' using errcode = 'P0001';
  end if;
  if v_paystatus not in ('paid', 'pending') then
    raise exception 'Payment status must be paid or pending' using errcode = 'P0001';
  end if;
  if v_status not in ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Unknown order status' using errcode = 'P0001';
  end if;

  v_label := case v_source
    when 'instagram' then 'Instagram'
    when 'whatsapp' then 'WhatsApp'
    when 'in_person' then 'in person'
    else 'outside the website' end;

  v_id := 'BC-' || to_char(v_at at time zone 'Asia/Kolkata', 'YYYY') || '-'
          || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    id, user_id, customer, customer_phone, items, pricing, delivery, payment,
    status, status_history, source, maker_note, created_at
  ) values (
    v_id,
    null,
    jsonb_build_object('name', v_name, 'phone', coalesce(v_phone, '')),
    v_phone,
    v_items,
    jsonb_build_object('subtotal', v_subtotal, 'delivery', v_delivery, 'giftWrap', 0,
                       'discount', v_discount, 'total', v_total),
    jsonb_build_object('method', v_method, 'details', jsonb_build_object('area', 'Recorded by the maker'), 'charge', v_delivery),
    jsonb_strip_nulls(jsonb_build_object('method', v_pay, 'provider', v_provider, 'status', v_paystatus)),
    v_status,
    jsonb_build_array(jsonb_build_object('status', v_status, 'at', v_at,
      'note', 'Order received on ' || v_label || ' and recorded by the maker')),
    v_source,
    v_note,
    v_at
  )
  returning * into v_order;

  return public.order_to_json(v_order);
exception
  when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format then
    raise exception 'Some details were not valid. Please check the form.' using errcode = 'P0001';
end;
$$;

-- Maker only: remove an order that was added by mistake (only hand-recorded orders can be deleted).
create or replace function public.admin_delete_manual_order(p_order_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only the maker can delete orders' using errcode = '42501';
  end if;
  delete from public.orders where id = p_order_id and source <> 'website';
  if not found then
    raise exception 'Only orders you added by hand can be deleted' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.admin_add_manual_order(jsonb) from public, anon, authenticated;
revoke all on function public.admin_delete_manual_order(text) from public, anon, authenticated;
grant execute on function public.admin_add_manual_order(jsonb) to authenticated;
grant execute on function public.admin_delete_manual_order(text) to authenticated;
