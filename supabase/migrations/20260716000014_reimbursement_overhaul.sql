-- Reintegros al nivel del sitio vivo (notas del cliente 16-jul-2026):
-- 1. Documentos tipados por motivo (evidencia / informe / comprobante /
--    certificado senior) en vez de una lista plana de facturas.
-- 2. Monto solicitado elegible por el usuario + cuánto pagó en total.
-- 3. Nombre del titular de la cuenta (debe coincidir con la membresía).
-- 4. Datos de la clínica/veterinario que atendió (emergencias).
-- 5. Hilo de mensajes con el comité POR SOLICITUD (como el de mascotas):
--    conversaciones separadas por área.
-- Los topes anuales por categoría se calculan en src/lib/reimbursement-balance.ts
-- (usado = solicitado/aprobado del año calendario; se renuevan cada enero).

alter table reimbursements
  add column total_paid_amount numeric(10,2),
  add column bank_holder text,
  add column clinic_name text,
  add column vet_name text,
  add column vet_license text,
  -- [{type: evidence_photo|prescription|receipt|senior_certificate, path, name}]
  add column documents jsonb not null default '[]'::jsonb;

create table reimbursement_messages (
  id uuid primary key default gen_random_uuid(),
  reimbursement_id uuid not null references reimbursements(id) on delete cascade,
  sender text not null check (sender in ('admin', 'member')),
  author_id uuid references profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

alter table reimbursement_messages enable row level security;
create policy "reimbursement messages read" on reimbursement_messages for select using (
  public.is_admin()
  or exists (select 1 from reimbursements r where r.id = reimbursement_id and r.user_id = auth.uid())
);
create policy "reimbursement messages member insert" on reimbursement_messages for insert with check (
  sender = 'member'
  and exists (select 1 from reimbursements r where r.id = reimbursement_id and r.user_id = auth.uid())
);

create index idx_reimbursement_messages on reimbursement_messages(reimbursement_id, created_at);
