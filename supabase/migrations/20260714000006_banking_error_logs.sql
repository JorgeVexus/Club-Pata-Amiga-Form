-- Datos de pago del embajador (SPEI para el corte mensual de comisiones).
-- Se capturan desde el dashboard del embajador una vez aprobado.
alter table ambassadors
  add column bank_name text,
  add column clabe varchar(18);

-- Bitácora de errores del sistema — alimenta las alertas del equipo
-- (site_settings.notify_errors) y la tarjeta de errores del admin.
create table error_logs (
  id uuid primary key default gen_random_uuid(),
  context text not null, -- ej. "stripe-webhook", "vet-chat"
  message text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table error_logs enable row level security;
create policy "admin error logs read" on error_logs
  for select using (public.is_admin());
