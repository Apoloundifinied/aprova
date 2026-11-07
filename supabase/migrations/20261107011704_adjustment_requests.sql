create table public.adjustment_requests (
  version_id uuid primary key references public.delivery_versions(id) on delete cascade,
  comment text not null check (char_length(btrim(comment)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.adjustment_requests enable row level security;
create policy "Owner reads own adjustment requests"
  on public.adjustment_requests for select to authenticated
  using (exists (
    select 1 from public.delivery_versions v
    join public.deliveries d on d.id = v.delivery_id
    where v.id = version_id and d.owner_id = (select auth.uid())
  ));

create function public.request_adjustment(token_hash text, reviewed_version uuid, feedback text)
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

  insert into public.adjustment_requests (version_id, comment)
  values (reviewed_version, btrim(feedback))
  on conflict (version_id) do nothing;
  if not found then return 'already_requested'; end if;
  return 'requested';
end;
$$;

revoke execute on function public.request_adjustment(text, uuid, text) from public, anon, authenticated;
grant execute on function public.request_adjustment(text, uuid, text) to service_role;
