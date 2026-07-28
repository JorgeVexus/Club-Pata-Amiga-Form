-- Editable site settings (social links, contact email) managed from the
-- admin panel. Public read: the landing renders them.
create table site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
create policy "site settings public read" on site_settings for select using (true);

-- Overrides for transactional email templates. When a row exists for a key,
-- it replaces the default subject/body defined in code (src/lib/email).
create table email_templates (
  key text primary key,
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);
alter table email_templates enable row level security;
create policy "admin email templates read" on email_templates
  for select using (public.is_admin());
