-- Promociones y material rotativo de los agentes IA (asistente del portal y
-- agente de ventas). Se administran en /admin/conversaciones y se inyectan en
-- el prompt de cada agente SOLO mientras están vigentes (activas + en fechas),
-- así el material "rota" solo, sin deploys ni limpieza manual.

create table agent_promos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  -- support = asistente del portal · sales = agente de ventas en redes · both = ambos
  audience text not null default 'both' check (audience in ('both', 'support', 'sales')),
  starts_on date not null default current_date,
  ends_on date, -- null = sin fecha de fin
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_promos_active on agent_promos(active, starts_on, ends_on);

alter table agent_promos enable row level security;

-- Solo admins desde la app; los agentes leen con service role al armar el prompt
create policy "admin agent promos" on agent_promos for all using (public.is_admin());

create trigger set_updated_at before update on agent_promos
  for each row execute function public.set_updated_at();
