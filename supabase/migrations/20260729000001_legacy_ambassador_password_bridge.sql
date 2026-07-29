-- Embajadores legacy que nunca fueron miembros tienen su propio password
-- hash (bcrypt), independiente de Memberstack. Preservamos ese hash para
-- que el puente de login (src/lib/legacy-auth-bridge.ts) lo pueda validar
-- directamente sin depender de la API de Memberstack.

alter table profiles
  add column if not exists legacy_ambassador_password_hash text;

comment on column profiles.legacy_ambassador_password_hash is 'bcrypt hash del password legacy de embajadores sin membresia (no via Memberstack). Se limpia despues de la primera migracion silenciosa exitosa.';
