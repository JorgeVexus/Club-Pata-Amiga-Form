-- Puente de autenticacion legacy (Memberstack -> Supabase Auth).
-- Ligamos profiles/ambassadors/wellness_centers a su identidad legacy en
-- Memberstack para poder validar su password una sola vez y migrarlos de
-- forma silenciosa a Supabase Auth nativo (ver src/app/iniciar-sesion/actions.ts).

alter table profiles
  add column if not exists memberstack_id text unique,
  add column if not exists legacy_password_migrated boolean not null default false;

alter table ambassadors
  add column if not exists memberstack_id text unique;

alter table wellness_centers
  add column if not exists memberstack_id text unique;

comment on column profiles.memberstack_id is 'ID de Memberstack del miembro legacy migrado desde el proyecto anterior. Null para altas nuevas via Supabase Auth.';
comment on column profiles.legacy_password_migrated is 'true una vez que el usuario legacy inicio sesion exitosamente y su password ya vive nativamente en Supabase Auth (ya no se valida contra Memberstack).';
