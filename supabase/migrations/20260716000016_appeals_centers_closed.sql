-- Apelaciones (notas del cliente 16-jul-2026):
-- 1. Los centros aliados rechazados también pueden apelar (además de los
--    miembros por mascotas y reintegros) → appeals.center_id.
-- 2. El super admin puede "cerrar el caso" sin reabrir nada → estado 'closed'.
--    Resolver apelaciones es EXCLUSIVO del super admin (validado en código).

alter type appeal_status add value if not exists 'closed';

alter table appeals
  add column center_id uuid references wellness_centers(id) on delete cascade;

alter table appeals drop constraint appeals_one_subject;
alter table appeals
  add constraint appeals_one_subject check (
    (reimbursement_id is not null)::int
      + (pet_id is not null)::int
      + (center_id is not null)::int = 1
  );

create index idx_appeals_center on appeals(center_id);
