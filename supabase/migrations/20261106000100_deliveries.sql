create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  review_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.delivery_versions (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  number integer not null check (number > 0),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  unique (delivery_id, number)
);

alter table public.deliveries enable row level security;
alter table public.delivery_versions enable row level security;

create policy "Owner reads own deliveries" on public.deliveries
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owner reads own versions" on public.delivery_versions
  for select to authenticated using (exists (
    select 1 from public.deliveries d
    where d.id = delivery_id and d.owner_id = (select auth.uid())
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-files', 'review-files', false, 3145728, array['image/png','image/jpeg','image/webp']);

create function public.publish_initial_delivery(
  delivery_id uuid, owner uuid, delivery_title text, token_hash text, object_path text
) returns void language plpgsql set search_path = '' as $$
begin
  insert into public.deliveries (id, owner_id, title, review_hash)
  values (delivery_id, owner, delivery_title, token_hash);
  insert into public.delivery_versions (delivery_id, number, storage_path)
  values (delivery_id, 1, object_path);
end;
$$;
revoke execute on function public.publish_initial_delivery(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.publish_initial_delivery(uuid, uuid, text, text, text) to service_role;
