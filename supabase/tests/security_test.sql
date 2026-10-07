-- Security & business-rule tests for the BloomCraft schema. Run with tests/run-local.sh.
-- Every check raises an exception on failure, so psql -v ON_ERROR_STOP=1 exits non-zero.
\set ON_ERROR_STOP 1

-- helpers ---------------------------------------------------------------------
create schema test_helpers;
create function test_helpers.expect_error(stmt text, fragment text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if position(lower(fragment) in lower(sqlerrm)) = 0 then
      raise exception 'expected error containing "%", got "%" for: %', fragment, sqlerrm, stmt;
    end if;
    raise notice 'ok - refused: %', fragment;
    return;
  end;
  raise exception 'expected failure containing "%" but it succeeded: %', fragment, stmt;
end $$;

create function test_helpers.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

grant usage on schema test_helpers to anon, authenticated;
grant execute on all functions in schema test_helpers to anon, authenticated;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'vidhiisingh2403@gmail.com', now(), '{"full_name":"Vidhi Singh"}'),
  ('00000000-0000-0000-0000-00000000000b', 'cust@example.com', now(), '{"name":"Cust One"}'),
  ('00000000-0000-0000-0000-00000000000c', 'other@example.com', now(), '{}');

select test_helpers.check((select count(*) from public.profiles) = 3, 'a profile is created for every sign-up');
select test_helpers.check((select count(*) from public.orders where payment ->> 'provider' = 'Google Pay') = 18, 'the 18 past sales are imported');

-- guest -----------------------------------------------------------------------
set role anon;

create temp table if not exists results (k text primary key, v jsonb);

select test_helpers.check(
  public.place_order('{"customer":{"name":"Guest Girl","phone":"+91 98765 43211"},
    "items":[{"productId":"kc-tulip-pink-duo","quantity":5,"selectedColor":"Lavender Duo","customNote":"  Riya "},
             {"productId":"kc-tulip-white-duo","quantity":5,"selectedColor":"Not a colour"}],
    "delivery":{"method":"parcel","details":{"house":"12 A","city":"Vadodara","state":"Gujarat","pincode":"390007","evil":"x"}},
    "payment":{"method":"upi","upiTxnRef":"123456789099"},"giftWrapRequested":true,"giftMessage":"hbd",
    "couponCode":"bloom10","expectedTotal":94000,"clientRef":"11111111-1111-1111-1111-111111111111"}'::jsonb)
  -> 'pricing' = '{"subtotal":100000,"delivery":0,"giftWrap":4000,"discount":10000,"total":94000}'::jsonb,
  'server recomputes subtotal, free parcel, gift wrap and coupon');

select test_helpers.check(
  public.place_order('{"customer":{"name":"Guest Girl","phone":"9876543211"},
    "items":[{"productId":"kc-tulip-pink-duo","quantity":5}],
    "delivery":{"method":"parcel","details":{"house":"12 A","city":"Vadodara","state":"Gujarat","pincode":"390007"}},
    "payment":{"method":"upi","upiTxnRef":"123456789099"},"giftWrapRequested":true,
    "couponCode":"bloom10","expectedTotal":94000,"clientRef":"11111111-1111-1111-1111-111111111111"}'::jsonb)
  ->> 'id' = 'BC-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019',
  'a retried submit with the same clientRef returns the original order');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"cod"},"expectedTotal":1}'::jsonb)$q$, 'Prices were updated');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"upi","upiTxnRef":"123456789099"}}'::jsonb)$q$, 'already been used');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":50}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"cod"}}'::jsonb)$q$, 'You can order 1 to');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":"lots"}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"cod"}}'::jsonb)$q$, 'not valid');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"12345"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],"delivery":{"method":"college","details":{}},
  "payment":{"method":"cod"}}'::jsonb)$q$, '10-digit');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"no-such-product","quantity":1}],"delivery":{"method":"college","details":{}},
  "payment":{"method":"cod"}}'::jsonb)$q$, 'no longer available');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"upi","upiTxnRef":"12ab"}}'::jsonb)$q$, '12-digit');

select test_helpers.expect_error($q$select public.place_order('{"customer":{"name":"Guest","phone":"9876543210"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],
  "delivery":{"method":"vadodara_local","details":{"area":"Gotri","preferredDate":"2026-10-10","preferredTimeSlot":"Morning"}},
  "payment":{"method":"cod"},"couponCode":"BLOOM10"}'::jsonb)$q$, 'minimum order');

select test_helpers.check(public.track_order('bc-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019', '09876543211') is not null,
  'guest can track with order number + phone');
select test_helpers.check(public.track_order('BC-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019', '9999999999') is null,
  'tracking with the wrong phone reveals nothing');

select test_helpers.check(public.check_coupon(' bloom10 ') ->> 'code' = 'BLOOM10', 'a single coupon can be checked');
select test_helpers.check(public.check_coupon('NOPE') is null, 'unknown coupon returns nothing');
select test_helpers.check(public.is_admin() is false, 'guest is not admin');
select test_helpers.check((select count(*) from public.products) = 32, 'guest can read the catalogue');

select test_helpers.expect_error('select * from public.orders', 'permission denied');
select test_helpers.expect_error('select * from public.coupons', 'permission denied');
select test_helpers.expect_error('select * from public.admin_emails', 'permission denied');
select test_helpers.expect_error('select * from public.profiles', 'permission denied');
select test_helpers.expect_error($q$insert into public.orders (id, customer, customer_phone, items, pricing, delivery, payment)
  values ('X', '{}', '9876543210', '[]', '{}', '{}', '{}')$q$, 'permission denied');
select test_helpers.expect_error('truncate public.orders', 'permission denied');
select test_helpers.expect_error('truncate public.products', 'permission denied');
select test_helpers.expect_error($q$select setval('public.order_number_seq', 1)$q$, 'permission denied');
select test_helpers.expect_error($q$select public.admin_set_payment_status('BC-2026-00001', 'paid')$q$, 'permission denied');
select test_helpers.expect_error($q$select public.request_ip_hash()$q$, 'permission denied');

update public.products set price = 1 where id = 'kc-tulip-pink-duo';
reset role;
select test_helpers.check((select price from public.products where id = 'kc-tulip-pink-duo') = 10000,
  'guest cannot change prices');

set role anon;
select test_helpers.check(public.submit_custom_request('{"customer":{"name":"Neha","phone":"9123456789"},
  "description":"Bouquet of 5 lilies","colors":["white","pink"],"itemType":"Custom Bouquet"}'::jsonb) ->> 'id' = 'CUSTOM-BC-001',
  'guest can send a custom request');
select test_helpers.expect_error($q$select public.submit_custom_request('{"customer":{"name":"Neha","phone":"9123456789"},
  "description":"hi"}'::jsonb)$q$, 'describe your idea');
reset role;

-- customer --------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

select test_helpers.check(public.place_order('{"customer":{"name":"Cust One","phone":"9000000001","email":"Cust@Example.com"},
  "items":[{"productId":"kc-tulip-pink-duo","quantity":1}],
  "delivery":{"method":"college","details":{"collegeName":"MSU","deliveryPoint":"Gate","preferredDate":"2026-10-11"}},
  "payment":{"method":"cod"},"expectedTotal":10000}'::jsonb) -> 'payment' ->> 'status' = 'pending',
  'signed-in customer can order pay-on-handover');
select test_helpers.check((select count(*) from public.orders) = 1, 'customer sees only their own order');
select test_helpers.check((select count(*) from public.custom_requests) = 0, 'customer cannot see other people''s requests');
select test_helpers.check(public.is_admin() is false, 'customer is not admin');
select test_helpers.expect_error($q$select public.admin_update_order_status('BC-2026-00001', 'confirmed')$q$, 'Only the maker');
select test_helpers.expect_error($q$update public.profiles set email = 'x@y.z'$q$, 'permission denied');
update public.profiles set full_name = 'Cust Renamed';
update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000a';
update public.custom_requests set status = 'declined';
select test_helpers.expect_error($q$update public.orders set status = 'delivered'$q$, 'permission denied');
reset role;

select test_helpers.check((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'Cust Renamed',
  'customer can rename themselves');
select test_helpers.check((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Vidhi Singh',
  'customer cannot rename others');
select test_helpers.check((select status from public.custom_requests limit 1) = 'received', 'customer cannot change requests');
select test_helpers.check((select status from public.orders where customer_phone = '9000000001') = 'placed', 'customer cannot change orders');

-- another customer --------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select test_helpers.check((select count(*) from public.orders) = 0, 'other customers see no orders');
reset role;

-- unconfirmed look-alike of the admin e-mail --------------------------------------
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000d', 'other-vidhi@example.com', null);
insert into public.admin_emails values ('other-vidhi@example.com');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select test_helpers.check(public.is_admin() is false, 'an unconfirmed e-mail never gets admin');
reset role;
delete from public.admin_emails where email = 'other-vidhi@example.com';

-- maker -----------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select test_helpers.check(public.is_admin(), 'maker is admin');
select test_helpers.check((select count(*) from public.orders) = 20, 'maker sees every order, including the 18 past sales');
select test_helpers.check((select count(*) from public.custom_requests) = 1, 'maker sees every request');
select test_helpers.check(public.admin_set_payment_status('BC-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019', 'paid')
  -> 'payment' ->> 'status' = 'paid', 'maker confirms a UPI payment');
select test_helpers.check(jsonb_array_length(public.admin_update_order_status(
  'BC-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019', 'preparing', 'Started crocheting') -> 'statusHistory') = 3,
  'status changes are appended to the history');
select test_helpers.expect_error($q$select public.admin_update_order_status('BC-2026-00001', 'teleported')$q$, 'Unknown order status');
update public.products set price = 11000 where id = 'kc-tulip-pink-duo';
update public.custom_requests set status = 'quoted', quoted_price = 500;
select test_helpers.check((select price from public.products where id = 'kc-tulip-pink-duo') = 11000, 'maker can change prices');
select test_helpers.check((select status from public.custom_requests limit 1) = 'quoted', 'maker can quote requests');
select test_helpers.expect_error('truncate public.orders', 'permission denied');
reset role;

-- saved addresses ---------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.addresses (label, full_name, phone, house, city, state, pincode, is_default)
  values ('Home', 'Cust One', '9000000001', '12 A', 'Vadodara', 'Gujarat', '390007', true);
insert into public.addresses (label, full_name, phone, house, city, state, pincode, is_default)
  values ('Hostel', 'Cust One', '9000000001', 'Room 4', 'Vadodara', 'Gujarat', '390002', true);
select test_helpers.check((select count(*) from public.addresses) = 2, 'customer saves addresses');
select test_helpers.check((select label from public.addresses where is_default) = 'Hostel', 'a new default replaces the old one');
select test_helpers.expect_error($q$insert into public.addresses (full_name, phone, house, city, state, pincode)
  values ('X', '123', 'a', 'Vadodara', 'Gujarat', '390007')$q$, 'check constraint');
select test_helpers.expect_error($q$insert into public.addresses (user_id, full_name, phone, house, city, state, pincode)
  values ('00000000-0000-0000-0000-00000000000c', 'Evil', '9000000002', 'a', 'Vadodara', 'Gujarat', '390007')$q$, 'row-level security');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select test_helpers.check((select count(*) from public.addresses) = 0, 'other customers cannot see saved addresses');
update public.addresses set house = 'hacked';
delete from public.addresses;
reset role;
select test_helpers.check((select count(*) from public.addresses where house = 'hacked') = 0
  and (select count(*) from public.addresses) = 2, 'other customers cannot change or delete saved addresses');

set role anon;
select test_helpers.expect_error('select * from public.addresses', 'permission denied');
reset role;

-- verified phone is copied to the profile ---------------------------------------
update auth.users set phone = '919000000001', phone_confirmed_at = now()
 where id = '00000000-0000-0000-0000-00000000000b';
select test_helpers.check((select phone = '9000000001' and phone_verified from public.profiles
  where id = '00000000-0000-0000-0000-00000000000b'), 'a confirmed phone is saved on the profile');

-- manual orders ----------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select test_helpers.expect_error($q$select public.admin_add_manual_order('{"source":"instagram","customer":{"name":"X"},"items":[{"name":"Rose","quantity":1,"price":10000}]}'::jsonb)$q$, 'Only the maker');
reset role;
set role anon;
select test_helpers.expect_error($q$select public.admin_add_manual_order('{}'::jsonb)$q$, 'permission denied');
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
create temp table manual_result as
select public.admin_add_manual_order('{"source":"instagram","orderedAt":"2026-09-20","customer":{"name":"Insta Buyer","phone":"+91 98250 12345"},
  "items":[{"name":"Rose keychain","quantity":2,"price":10000},{"name":"Custom bouquet","quantity":1,"price":45000,"customNote":"red & white"}],
  "deliveryCharge":6000,"discount":1000,"deliveryMethod":"parcel","payment":{"method":"upi","provider":"Google Pay","status":"paid"},
  "status":"delivered","note":"DM order"}'::jsonb) as o;
select test_helpers.check((select (o -> 'pricing' ->> 'total')::int = 70000 and o ->> 'source' = 'instagram'
  and o -> 'payment' ->> 'status' = 'paid' and o -> 'customer' ->> 'phone' = '9825012345'
  and (o ->> 'createdAt')::date = '2026-09-20' from manual_result), 'maker records an Instagram order with the right total and date');
select test_helpers.expect_error($q$select public.admin_add_manual_order('{"source":"whatsapp","customer":{"name":"No Items"},"items":[]}'::jsonb)$q$, 'at least one item');
select test_helpers.expect_error($q$select public.admin_add_manual_order('{"source":"whatsapp","customer":{"name":"Bad Phone","phone":"123"},"items":[{"name":"x","quantity":1,"price":100}]}'::jsonb)$q$, '10 digits');
select test_helpers.expect_error($q$select public.admin_add_manual_order('{"source":"website","customer":{"name":"Fake"},"items":[{"name":"x","quantity":1,"price":100}]}'::jsonb)$q$, 'where the order came from');
select test_helpers.expect_error($q$select public.admin_delete_manual_order('BC-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-00019')$q$, 'added by hand');
select public.admin_delete_manual_order((select o ->> 'id' from manual_result));
select test_helpers.check(not exists (select 1 from public.orders where id = (select o ->> 'id' from manual_result)), 'maker can delete a hand-recorded order');
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select test_helpers.expect_error($q$select public.admin_delete_manual_order('BC-2026-00001')$q$, 'Only the maker');
reset role;

\echo 'All security tests passed.'
