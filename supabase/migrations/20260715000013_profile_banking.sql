-- Datos bancarios del miembro (SPEI para reintegros) en su perfil:
-- se administran desde Mi cuenta y prefillean cada solicitud de reintegro.
alter table profiles
  add column bank_name text,
  add column clabe varchar(18);
