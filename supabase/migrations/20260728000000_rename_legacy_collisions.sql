-- Migracion a pata-amiga: el esquema nuevo reutiliza varios nombres de
-- tabla (y por lo tanto de indices/constraints) que ya existen en produccion
-- con una forma distinta (legacy). En vez de renombrar tabla por tabla (los
-- indices y constraints no se renombran solos y seguirian chocando),
-- movemos las tablas en conflicto a un schema separado "legacy": los
-- indices/constraints/sequences son unicos por schema en Postgres, asi que
-- esto resuelve todas las colisiones de una vez. Solo ALTER ... SET SCHEMA -
-- ningun DROP, ninguna perdida de datos.

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
