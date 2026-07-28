-- Newsletter subscribers (landing footer). Writes go through the service role.
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
create policy "admin newsletter read" on newsletter_subscribers
  for select using (public.is_admin());

-- Editable image slots for the public site (uploaded from the admin panel so
-- the team can swap photos without a deploy).
create table site_assets (
  slot text primary key,
  url text not null,
  updated_at timestamptz not null default now()
);
alter table site_assets enable row level security;
create policy "site assets public read" on site_assets for select using (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "site assets bucket read" on storage.objects
  for select using (bucket_id = 'site-assets');
