-- Campos fiscales faltantes para CFDI (el BillingModal del sistema anterior
-- pedía RFC, razón social, régimen fiscal y uso CFDI; agregamos CP fiscal).
alter table profiles
  add column regimen_fiscal text,
  add column cp_fiscal varchar(5);
