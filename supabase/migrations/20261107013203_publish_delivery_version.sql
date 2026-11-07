create function public.publish_delivery_version(target_delivery uuid, owner uuid, object_path text)
returns integer language plpgsql set search_path = '' as $$
declare
  next_number integer;
begin
  perform 1 from public.deliveries
  where id = target_delivery and owner_id = owner
    and revoked_at is null and expires_at > clock_timestamp()
  for update;
  if not found then return null; end if;

  select coalesce(max(number), 0) + 1 into next_number
  from public.delivery_versions where delivery_id = target_delivery;

  insert into public.delivery_versions (delivery_id, number, storage_path)
  values (target_delivery, next_number, object_path);
  return next_number;
end;
$$;

revoke execute on function public.publish_delivery_version(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.publish_delivery_version(uuid, uuid, text) to service_role;
