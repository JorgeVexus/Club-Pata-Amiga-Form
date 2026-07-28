-- Notas de revisión del cliente (15-jul-2026):
-- 1. Dar de baja mascotas con motivo; la tarjeta queda como recuerdo (gris)
--    y no cuenta contra el límite de 3 activas.
-- 2. Popup de bienvenida del miembro: solo la primera vez (bandera en BD,
--    no localStorage — antes reaparecía en cada dispositivo/navegador).
-- 3. Botón de emergencia para miembros: registra el evento y avisa al equipo.

alter table pets
  add column deactivation_reason text,
  add column deactivated_at timestamptz;

alter table profiles
  add column welcome_shown boolean not null default false;

-- Miembros existentes ya vieron su bienvenida — no se las repetimos
update profiles set welcome_shown = true where member_since is not null;

create table emergency_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  phone text,
  created_at timestamptz not null default now()
);

create index idx_emergency_logs_user on emergency_logs(user_id);

alter table emergency_logs enable row level security;
create policy "own emergency insert" on emergency_logs
  for insert with check (auth.uid() = user_id);
create policy "admin emergency read" on emergency_logs
  for select using (public.is_admin());
