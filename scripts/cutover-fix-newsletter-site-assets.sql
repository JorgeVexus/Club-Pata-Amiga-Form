create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
drop policy if exists "admin newsletter read" on newsletter_subscribers;
create policy "admin newsletter read" on newsletter_subscribers
  for select using (public.is_admin());

create table if not exists site_assets (
  slot text primary key,
  url text not null,
  updated_at timestamptz not null default now()
);
alter table site_assets enable row level security;
drop policy if exists "site assets public read" on site_assets;
create policy "site assets public read" on site_assets for select using (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;
