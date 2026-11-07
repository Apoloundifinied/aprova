alter table public.deliveries
  add column review_ciphertext text,
  add column archived_at timestamptz;

drop function public.publish_initial_delivery(uuid, uuid, text, text, text);

create function public.publish_initial_delivery(
  delivery_id uuid, owner uuid, delivery_title text, token_hash text, object_path text,
  token_ciphertext text default null
) returns void language plpgsql set search_path = '' as $$
begin
  insert into public.deliveries (id, owner_id, title, review_hash, review_ciphertext)
  values (delivery_id, owner, delivery_title, token_hash, token_ciphertext);
  insert into public.delivery_versions (delivery_id, number, storage_path)
  values (delivery_id, 1, object_path);
end;
$$;
revoke execute on function public.publish_initial_delivery(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.publish_initial_delivery(uuid, uuid, text, text, text, text) to service_role;
