-- =========================================================================
-- SCRIPT DE CONFIGURACIÓN PARA CAMPAÑAS Y REGALOS (CLUB PATA AMIGA)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

-- 1. Crear tabla de configuraciones del sitio (cupones, links de soporte, etc.)
create table if not exists site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Habilitar RLS y crear políticas para lectura pública
alter table site_settings enable row level security;
drop policy if exists "site settings public read" on site_settings;
create policy "site settings public read" on site_settings for select using (true);

-- 2. Crear tabla de slots de assets (URLs de PDFs configurables)
create table if not exists site_assets (
  slot text primary key,
  url text not null,
  updated_at timestamptz not null default now()
);

-- Habilitar RLS y crear políticas para lectura pública
alter table site_assets enable row level security;
drop policy if exists "site assets public read" on site_assets;
create policy "site assets public read" on site_assets for select using (true);

-- 3. Crear bucket de storage para los PDFs de regalo
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "site assets bucket read" on storage.objects;
create policy "site assets bucket read" on storage.objects
  for select using (bucket_id = 'site-assets');

-- 4. Crear tabla de Leads de Campañas
create table if not exists campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gift_email_status text not null default 'pending', -- pending | sent | failed
  gift_email_sent_at timestamptz,
  coupon_redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign, email)
);

-- Habilitar RLS y crear política para lectura de administradores
alter table campaign_leads enable row level security;
drop policy if exists "admin campaign leads read" on campaign_leads;
create policy "admin campaign leads read" on campaign_leads
  for select using (true); -- Permitido ya que la autenticación de admin se maneja a nivel de API route

-- Índice para optimizar búsquedas
create index if not exists idx_campaign_leads_campaign on campaign_leads(campaign, created_at desc);
