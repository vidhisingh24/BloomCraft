-- Maker only: delete any order (test orders, duplicates, mistakes). Cannot be undone.
create or replace function public.admin_delete_order(p_order_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only the maker can delete orders' using errcode = '42501';
  end if;
  delete from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order % not found', p_order_id using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.admin_delete_order(text) from public, anon, authenticated;
grant execute on function public.admin_delete_order(text) to authenticated;
