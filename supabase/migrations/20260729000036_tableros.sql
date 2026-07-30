-- Portal de ventas — Fase 7a: lo que el tablero necesita por debajo.
-- Spec: docs/portal-ventas/07-TABLEROS.md, puntos 4 y 5.3
--
-- Tres cosas: índices para que las consultas del embudo y de tiempos de
-- respuesta no se arrastren, un agregado diario para las tendencias, y el
-- registro de exportaciones que la spec pide y que hasta hoy era deuda
-- consciente en el HANDOFF.

-- ------------------------------------------------------------- índices ----
-- Las consultas del embudo y de tiempos pasan sobre miles de filas. Se crean
-- si no existen para poder correr esta migración sobre bases que ya los
-- tengan por otro camino.

create index if not exists idx_opportunities_etapa_fecha
  on opportunities(stage_id, created_at desc);
create index if not exists idx_channel_messages_conv_fecha
  on channel_messages(conversation_id, created_at);
create index if not exists idx_contact_activities_contacto_fecha
  on contact_activities(contact_id, created_at desc);

-- --------------------------------------------------- agregado diario ------
-- Las gráficas de tendencia leen de aquí; las tarjetas del período en curso se
-- calculan al vuelo. Así el tablero abre rápido aunque el histórico crezca.
--
-- El diseño es a propósito genérico (fecha, métrica, dimensión, valor):
-- agregar una métrica nueva no cambia el esquema, y la spec deja fuera los
-- tableros a la medida justamente para que esto no se convierta en un motor
-- de fórmulas.

create table sales_daily_metrics (
  fecha     date not null,
  metrica   text not null,
  -- Corte opcional: canal, etapa, origen, id de la persona… Cadena vacía
  -- cuando la métrica no se corta por nada (así la llave primaria funciona:
  -- en Postgres un null no es igual a otro null).
  dimension text not null default '',
  valor     numeric not null default 0,
  calculado_en timestamptz not null default now(),
  primary key (fecha, metrica, dimension)
);

create index idx_sales_metrics_metrica on sales_daily_metrics(metrica, fecha desc);

comment on table sales_daily_metrics is
  'Agregado nocturno para las gráficas de tendencia del tablero de ventas. Si falta un día, la gráfica lo dice en lugar de mostrar un hueco silencioso.';

-- ------------------------------------------- registro de exportaciones ----
-- Un CSV con datos de clientes debe dejar rastro de quién lo bajó. Estaba
-- anotado como deuda desde la sección 1 y aquí se salda.

create table export_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete set null,
  rol        text,
  recurso    text not null,           -- 'embudo', 'contactos', 'oportunidades'…
  filtros    jsonb not null default '{}',
  filas      int not null default 0,
  -- Qué columnas se llevó: es lo que permite responder "¿salió algo sensible?"
  columnas   text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_export_log_fecha on export_log(created_at desc);

comment on table export_log is
  'Quién exportó qué y cuándo, con las columnas que se llevó. Un CSV con datos de clientes debe dejar rastro.';

-- ----------------------------------------------------------------- RLS ----

alter table sales_daily_metrics enable row level security;
alter table export_log          enable row level security;

create policy "ventas lee metricas" on sales_daily_metrics for select
  using (public.is_sales());

-- El registro de exportaciones lo lee quien audita, no quien exporta.
create policy "admin lee exportaciones" on export_log for select
  using (public.is_admin());
