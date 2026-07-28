-- Portal de ventas — Fase 1a: CRM (contactos, identidades, pipelines).
-- Spec: docs/portal-ventas/01-CONTACTOS-Y-PIPELINES.md
--
-- Idea central: UNA fila por persona en `contacts`, y las formas de alcanzarla
-- (correo, teléfono, Instagram, WhatsApp) como filas en `contact_identities`
-- con `unique (kind, value)`. Ese unique es lo que hace estructuralmente
-- imposible el duplicado, en lugar de confiar en una limpieza posterior.
--
-- El relleno inicial desde las 5 fuentes actuales NO va aquí: vive en
-- POST /api/admin/crm/backfill, que reutiliza la misma lógica de resolución que
-- usan los webhooks y la importación de CSV (src/lib/crm/). Tener la lógica dos
-- veces —una en SQL y otra en TypeScript— es lo que produce contactos distintos
-- según por dónde entró la persona.

-- ---------------------------------------------------------------- contactos --

create table contacts (
  id               uuid primary key default gen_random_uuid(),
  first_name       text,
  last_name        text,
  birth_date       date,
  city             text,
  state            text,
  -- "Fuente de contacto": instagram, landing-regalo, referido, registro…
  source           text,
  contact_type     text not null default 'lead'
                     check (contact_type in ('lead','miembro','embajador','centro','otro')),

  -- Vínculos con la plataforma (todos opcionales; se llenan al convertirse)
  profile_id       uuid references profiles(id) on delete set null,
  campaign_lead_id uuid references campaign_leads(id) on delete set null,
  ambassador_id    uuid references ambassadors(id) on delete set null,
  center_id        uuid references wellness_centers(id) on delete set null,

  owner_id         uuid references profiles(id) on delete set null,
  custom_fields    jsonb not null default '{}',
  -- No molestar POR CANAL: {"email":true,"whatsapp":false,…}. Alguien puede no
  -- querer correos y sí aceptar WhatsApp.
  dnd              jsonb not null default '{}',

  notes_count      int not null default 0,
  tasks_open_count int not null default 0,
  last_activity_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_contacts_owner on contacts(owner_id);
create index idx_contacts_profile on contacts(profile_id);
create index idx_contacts_type on contacts(contact_type);
create index idx_contacts_activity on contacts(last_activity_at desc nulls last);
create index idx_contacts_custom_fields on contacts using gin (custom_fields);
-- Búsqueda por nombre sin acentos ni mayúsculas
create index idx_contacts_name on contacts (
  lower(coalesce(first_name,'') || ' ' || coalesce(last_name,''))
);

comment on table contacts is
  'Una fila por persona. Se enlaza a profiles/ambassadors/wellness_centers/campaign_leads cuando corresponde, en lugar de duplicar a la persona.';

create table contact_identities (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  kind       text not null check (kind in
               ('email','phone','instagram','messenger','whatsapp','portal')),
  -- Normalizado ANTES de guardar: correo en minúsculas, teléfono en E.164.
  value      text not null,
  is_primary boolean not null default false,
  verified   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (kind, value)
);

create index idx_contact_identities_contact on contact_identities(contact_id);

comment on constraint contact_identities_kind_value_key on contact_identities is
  'La garantía estructural contra duplicados: dos contactos no pueden compartir un correo, un teléfono ni un id de canal.';

-- ------------------------------------------------- etiquetas y campos ------

create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text not null default 'teal',
  created_at timestamptz not null default now()
);

create table contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  added_by   uuid references profiles(id) on delete set null,
  added_at   timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create index idx_contact_tags_tag on contact_tags(tag_id);

-- Etiquetas para ESTADOS y hechos binarios; campos personalizados para
-- ATRIBUTOS con valor. Mezclarlos produce el "sprawl" de etiquetas del que se
-- queja la comunidad de GoHighLevel y filtros en los que ya no se puede confiar.
create table custom_field_defs (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  field_group text,                       -- carpeta, para el buscador de campos
  type        text not null check (type in
                ('texto','numero','fecha','seleccion','booleano')),
  options     jsonb not null default '[]', -- para 'seleccion'
  -- Un campo NO puede cambiar de contacto a oportunidad después de creado
  -- (restricción heredada de GoHighLevel: cambiarla corrompe el histórico).
  applies_to  text not null check (applies_to in ('contact','opportunity')),
  position    int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------- línea de tiempo y trabajo ---

-- Sumidero ÚNICO de emitirEvento(): mensajes, cambios de etapa, notas, pagos,
-- altas de mascota, reintegros. Sirve a la vez para la ficha del contacto, para
-- los eventos intercalados en el hilo de conversación, y para el día que se
-- quiera un motor de automatizaciones (se suscribe aquí, sin tocar pantallas).
create table contact_activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  kind        text not null,
  actor_id    uuid references profiles(id) on delete set null,
  actor_label text,                        -- 'PATiTA (IA)', 'Sistema'
  summary     text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index idx_contact_activities_contact
  on contact_activities(contact_id, created_at desc);
create index idx_contact_activities_kind on contact_activities(kind);

create table contact_followers (
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (contact_id, user_id)
);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid references contacts(id) on delete cascade,
  title        text not null,
  notes        text,
  due_at       timestamptz,
  assigned_to  uuid references profiles(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references profiles(id) on delete set null,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index idx_tasks_assigned on tasks(assigned_to, completed_at, due_at);
create index idx_tasks_contact on tasks(contact_id);

-- ---------------------------------------------- pipelines y oportunidades --

create table pipelines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_default  boolean not null default false,
  position    int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines(id) on delete cascade,
  key         text not null,               -- estable, para las automatizaciones
  name        text not null,
  color       text not null default 'teal',
  position    int not null,
  -- Si la plataforma llena esta etapa sola, aquí queda con qué evento.
  auto_event  text,
  -- Umbral de "estancada" en días (null = no se vigila)
  stale_days  int,
  is_won      boolean not null default false,
  is_lost     boolean not null default false,
  unique (pipeline_id, key)
);

create table lost_reasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  position   int not null default 0,
  archived_at timestamptz
);

create table opportunities (
  id               uuid primary key default gen_random_uuid(),
  contact_id       uuid not null references contacts(id) on delete cascade,
  pipeline_id      uuid not null references pipelines(id) on delete restrict,
  stage_id         uuid not null references pipeline_stages(id) on delete restrict,
  title            text not null,
  value_cents      int not null default 0,
  -- El valor se calcula del plan al que apunta la oportunidad. Hoy 989 tarjetas
  -- en LynSales dicen MX$0.00 porque nadie lo captura a mano.
  value_is_estimate boolean not null default true,
  currency         text not null default 'MXN',
  owner_id         uuid references profiles(id) on delete set null,
  status           text not null default 'abierta'
                     check (status in ('abierta','ganada','perdida')),
  lost_reason_id   uuid references lost_reasons(id) on delete set null,
  source           text,
  custom_fields    jsonb not null default '{}',
  stage_entered_at timestamptz not null default now(),
  -- REGLA DE ORO: una automatización nunca revierte lo que hizo una persona.
  -- Si alguien mueve la tarjeta a mano, queda su nombre aquí y los eventos
  -- dejan de moverla (solo registran actividad).
  stage_locked_by  uuid references profiles(id) on delete set null,
  stage_locked_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_opportunities_stage on opportunities(stage_id, created_at desc);
create index idx_opportunities_contact on opportunities(contact_id);
create index idx_opportunities_owner on opportunities(owner_id);
create index idx_opportunities_stale on opportunities(stage_entered_at);

comment on column opportunities.stage_locked_by is
  'Quién movió la tarjeta a mano. Mientras no sea null, los eventos de plataforma no cambian su etapa.';

-- ------------------------------------------------------- vistas guardadas --

-- Como las Smart Lists de GoHighLevel: SON filtros guardados, no copias de
-- contactos. No duplican datos ni cuentan aparte.
create table saved_views (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contactos','oportunidades')),
  name       text not null,
  filters    jsonb not null default '{}',
  sort       jsonb not null default '{}',
  owner_id   uuid references profiles(id) on delete cascade, -- null = del equipo
  position   int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- semilla --

insert into pipelines (name, is_default, position)
values ('Pata Amiga', true, 0);

-- Las etapas que el equipo ya usa en LynSales, más `registro_iniciado`
-- separado de `carrito_abandonado`: hoy no se puede saber si la persona alcanzó
-- a crear cuenta o se cayó antes.
insert into pipeline_stages (pipeline_id, key, name, color, position, auto_event, stale_days, is_won, is_lost)
select p.id, v.key, v.name, v.color, v.position, v.auto_event, v.stale_days, v.is_won, v.is_lost
from pipelines p,
(values
  ('nuevo_prospecto',    'Nuevo prospecto',            'teal',          1, 'primer_mensaje',        7,    false, false),
  ('solicitud_llamada',  'Solicitud de llamada',       'orange',        2, 'pidio_llamada',         2,    false, false),
  ('registro_iniciado',  'Registro iniciado',          'ink-tertiary',  3, 'cuenta_creada',         3,    false, false),
  ('carrito_abandonado', 'Carrito abandonado',         'ink-title',     4, 'checkout_abandonado',   14,   false, false),
  ('pago_procesado',     'Pago procesado / En revisión','teal-deep',    5, 'pago_confirmado',       3,    false, false),
  ('miembro_activo',     'Miembro activo',             'lime',          6, 'membresia_activa',      null, true,  false),
  ('miembro_inactivo',   'Miembro inactivo',           'orange',        7, 'membresia_inactiva',    30,   false, false),
  ('perdido',            'Perdido',                    'pink',          8, null,                    null, false, true)
) as v(key, name, color, position, auto_event, stale_days, is_won, is_lost)
where p.is_default;

insert into lost_reasons (name, position) values
  ('Precio', 1),
  ('Ya tiene otro servicio', 2),
  ('No respondió', 3),
  ('No es quien decide', 4),
  ('Desconfianza / dudas', 5),
  ('Fuera de México', 6),
  ('Otro', 7);

-- Etiquetas que el equipo ya usa hoy
insert into tags (name, color) values
  ('miembro activo', 'lime'),
  ('pidió llamada', 'orange'),
  ('no contactar', 'pink');

-- --------------------------------------------------------------------- RLS --

alter table contacts            enable row level security;
alter table contact_identities  enable row level security;
alter table tags                enable row level security;
alter table contact_tags        enable row level security;
alter table custom_field_defs   enable row level security;
alter table contact_activities  enable row level security;
alter table contact_followers   enable row level security;
alter table tasks               enable row level security;
alter table pipelines           enable row level security;
alter table pipeline_stages     enable row level security;
alter table lost_reasons        enable row level security;
alter table opportunities       enable row level security;
alter table saved_views         enable row level security;

-- Leer y escribir: cualquier rol del portal de ventas (incluye administración).
-- Borrar: solo quien puede aprobar (gerente y arriba).
--
-- OJO: is_sales() NO da acceso a datos sensibles del miembro. `documents`,
-- `reimbursements`, `appeals` y las columnas bancarias/fiscales de `profiles`
-- siguen pidiendo is_admin() / is_super_admin(); esta migración no las toca.
do $$
declare t text;
begin
  foreach t in array array[
    'contacts','contact_identities','tags','contact_tags','custom_field_defs',
    'contact_activities','contact_followers','tasks','pipelines',
    'pipeline_stages','lost_reasons','opportunities'
  ]
  loop
    execute format('create policy "ventas lee %1$s" on %1$I for select using (public.is_sales());', t);
    execute format('create policy "ventas crea %1$s" on %1$I for insert with check (public.is_sales());', t);
    execute format('create policy "ventas edita %1$s" on %1$I for update using (public.is_sales());', t);
    execute format('create policy "gerente borra %1$s" on %1$I for delete using (public.is_sales_manager());', t);
  end loop;
end $$;

-- Vistas guardadas: las propias son de cada quien; las del equipo (owner null)
-- las ve y usa todo el portal.
create policy "ventas lee vistas" on saved_views for select
  using (public.is_sales() and (owner_id is null or owner_id = auth.uid()));
create policy "ventas crea vistas" on saved_views for insert
  with check (public.is_sales());
create policy "ventas edita sus vistas" on saved_views for update
  using (public.is_sales() and (owner_id = auth.uid() or public.is_sales_manager()));
create policy "ventas borra sus vistas" on saved_views for delete
  using (public.is_sales() and (owner_id = auth.uid() or public.is_sales_manager()));
