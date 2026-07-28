-- EMERGENCIA: la app vieja en produccion (app.pataamiga.mx /
-- club-pata-amiga-form.vercel.app) sigue viva y consulta la misma base de
-- Supabase. Al mover pets/ambassadors/etc. al schema `legacy` se rompieron
-- sus queries en produccion (esperan estas tablas en `public` con su forma
-- original). Este script revierte: las tablas NUEVAS de pata-amiga
-- (recien migradas) se mueven a `pata_amiga_new` (nada se pierde), y las
-- tablas ORIGINALES de produccion vuelven a `public`.

create schema if not exists pata_amiga_new;

alter table if exists public.ambassador_payouts set schema pata_amiga_new;
alter table if exists public.ambassadors set schema pata_amiga_new;
alter table if exists public.campaign_leads set schema pata_amiga_new;
alter table if exists public.emergency_logs set schema pata_amiga_new;
alter table if exists public.legal_documents set schema pata_amiga_new;
alter table if exists public.newsletter_subscribers set schema pata_amiga_new;
alter table if exists public.notifications set schema pata_amiga_new;
alter table if exists public.pets set schema pata_amiga_new;
alter table if exists public.referrals set schema pata_amiga_new;
alter table if exists public.site_assets set schema pata_amiga_new;
alter table if exists public.site_settings set schema pata_amiga_new;
alter table if exists public.wellness_center_locations set schema pata_amiga_new;
alter table if exists public.wellness_centers set schema pata_amiga_new;

alter table if exists legacy.ambassador_payouts set schema public;
alter table if exists legacy.ambassadors set schema public;
alter table if exists legacy.campaign_leads set schema public;
alter table if exists legacy.emergency_logs set schema public;
alter table if exists legacy.legal_documents set schema public;
alter table if exists legacy.newsletter_subscribers set schema public;
alter table if exists legacy.notifications set schema public;
alter table if exists legacy.pets set schema public;
alter table if exists legacy.referrals set schema public;
alter table if exists legacy.site_assets set schema public;
alter table if exists legacy.site_settings set schema public;
alter table if exists legacy.wellness_center_locations set schema public;
alter table if exists legacy.wellness_centers set schema public;

select pg_notify('pgrst', 'reload schema');
