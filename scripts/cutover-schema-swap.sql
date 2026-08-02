-- CUTOVER REAL: mueve las tablas viejas de produccion (que colisionan de
-- nombre con el esquema nuevo de pata-amiga) a un schema `legacy`, dejando
-- `public` libre para las 36+ migraciones nuevas. Solo ALTER ... SET SCHEMA -
-- ningun DROP, ninguna perdida de datos. Mismo patron ya usado y revertido
-- una vez durante la migracion (ver incidente 2026-07-28).

create schema if not exists legacy;

alter table if exists ambassador_payouts set schema legacy;
alter table if exists ambassadors set schema legacy;
alter table if exists campaign_leads set schema legacy;
alter table if exists emergency_logs set schema legacy;
alter table if exists legal_documents set schema legacy;
alter table if exists newsletter_subscribers set schema legacy;
alter table if exists notifications set schema legacy;
alter table if exists pets set schema legacy;
alter table if exists referrals set schema legacy;
alter table if exists site_assets set schema legacy;
alter table if exists site_settings set schema legacy;
alter table if exists wellness_center_locations set schema legacy;
alter table if exists wellness_centers set schema legacy;

-- profiles ya existe en public con datos parciales/viejos del primer
-- intento de migracion (antes del incidente) - se aparta tambien para que
-- las migraciones creen una version limpia y el backfill fresco la llene
-- de cero con los 455 usuarios actuales.
alter table if exists profiles set schema legacy;
alter table if exists legacy.profiles rename to profiles_backfill_parcial_20260728;

