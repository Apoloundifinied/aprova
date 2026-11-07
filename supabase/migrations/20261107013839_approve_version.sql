alter table public.delivery_versions add column approved_at timestamptz;

create or replace function public.request_adjustment(token_hash text, reviewed_version uuid, feedback text)
returns text language plpgsql set search_path = '' as $$
declare
  target uuid;
  latest uuid;
begin
  select id into target from public.deliveries
  where review_hash = token_hash and revoked_at is null and expires_at > clock_timestamp()
  for update;
  if target is null then return 'invalid_link'; end if;

  select id into latest from public.delivery_versions
  where delivery_id = target order by number desc limit 1;
  if latest is distinct from reviewed_version then return 'stale_version'; end if;

  if exists (select 1 from public.delivery_versions where id = latest and approved_at is not null) then
    return 'already_approved';
  end if;

  insert into public.adjustment_requests (version_id, comment)
  values (reviewed_version, btrim(feedback))
  on conflict (version_id) do nothing;
  if not found then return 'already_requested'; end if;
  return 'requested';
end;
$$;

create function public.approve_version(token_hash text, reviewed_version uuid)
returns text language plpgsql set search_path = '' as $$
declare
  target uuid;
  latest uuid;
begin
  select id into target from public.deliveries
  where review_hash = token_hash and revoked_at is null and expires_at > clock_timestamp()
  for update;
  if target is null then return 'invalid_link'; end if;

  select id into latest from public.delivery_versions
  where delivery_id = target order by number desc limit 1;
  if latest is distinct from reviewed_version then return 'stale_version'; end if;

  if exists (select 1 from public.adjustment_requests where version_id = latest) then
    return 'adjustment_requested';
  end if;

  update public.delivery_versions set approved_at = clock_timestamp()
  where id = latest and approved_at is null;
  return 'approved';
end;
$$;

revoke execute on function public.approve_version(text, uuid) from public, anon, authenticated;
grant execute on function public.approve_version(text, uuid) to service_role;
