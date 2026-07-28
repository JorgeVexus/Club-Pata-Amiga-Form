-- Leads de landings de campaña (ads / patrocinadores). Cada landing vive en
-- /landings/<campaña> y guarda aquí sus registros; el CRM está en
-- /admin/landings. Escrituras vía service role.
create table campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  -- atribución del anuncio
  utm_source text,
  utm_medium text,
  utm_campaign text,
  -- correo "obtén tu regalo"
  gift_email_status text not null default 'pending', -- pending | sent | failed
  gift_email_sent_at timestamptz,
  -- para activar/rastrear el cupón más adelante
  coupon_redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign, email)
);

alter table campaign_leads enable row level security;
create policy "admin campaign leads read" on campaign_leads
  for select using (public.is_admin());

create index idx_campaign_leads_campaign on campaign_leads(campaign, created_at desc);
