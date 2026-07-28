-- Nombre del titular de la cuenta del embajador (SPEI del corte mensual) —
-- nota del cliente 16-jul-2026.
alter table ambassadors
  add column bank_holder text;
