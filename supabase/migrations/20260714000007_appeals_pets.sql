-- Apelaciones también para mascotas rechazadas (el sistema anterior las
-- manejaba así; el handoff las pide para reintegros). Un appeal apunta a
-- exactamente un sujeto: reintegro O mascota. Máximo 2 apelaciones por
-- sujeto (regla del sistema anterior, validada en código).
alter table appeals
  alter column reimbursement_id drop not null;
alter table appeals
  add column pet_id uuid references pets(id) on delete cascade;
alter table appeals
  add constraint appeals_one_subject check (
    (reimbursement_id is not null)::int + (pet_id is not null)::int = 1
  );
create index idx_appeals_pet on appeals(pet_id);
create index idx_appeals_status on appeals(status);
