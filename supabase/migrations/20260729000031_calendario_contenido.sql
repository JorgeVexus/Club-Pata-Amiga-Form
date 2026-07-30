-- Portal de ventas — Fase 4a: calendario de contenido, la compuerta primero.
-- Spec: docs/portal-ventas/04-CALENDARIO-DE-CONTENIDO.md
--
-- LA REGLA QUE MANDA: si un contenido no está aprobado por un gerente, no se
-- publica. Y eso no es una convención de interfaz — es una restricción de la
-- base. Un botón se puede saltar por un error de código; una restricción no.
--
-- Por eso esta migración va antes que cualquier pantalla: lo que protege el
-- dato tiene que existir antes que lo que lo edita.

-- ------------------------------------------------------ cuentas de redes ---

create table content_channels (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null check (platform in
                 ('facebook','instagram','instagram_stories','tiktok','linkedin','x')),
  handle       text not null,
  display_name text,
  -- 'automatico' = lo publica la plataforma por API.
  -- 'asistido'   = a la hora programada se le avisa a una persona con el copy
  --                y el archivo listos. Es la diferencia honesta entre "no lo
  --                tenemos" y "lo tenemos con una persona en medio".
  mode         text not null default 'asistido'
                 check (mode in ('automatico','asistido')),
  -- Tokens de la cuenta del CLIENTE. Nunca viajan al navegador: solo los lee
  -- el publicador, del lado del servidor.
  credentials  jsonb,
  expires_at   timestamptz,
  -- A quién avisar cuando el canal es asistido.
  assignee_id  uuid references profiles(id) on delete set null,
  is_active    boolean not null default true,
  last_error   text,
  created_at   timestamptz not null default now(),
  unique (platform, handle)
);

comment on column content_channels.credentials is
  'Tokens de la cuenta del cliente. Solo los lee el publicador en el servidor; ninguna consulta del portal los selecciona.';

-- ---------------------------------------------------------- las entradas ---

create table content_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  -- Rutas en Storage (biblioteca site_assets o subida nueva).
  assets        jsonb not null default '[]',
  scheduled_for timestamptz,
  status        text not null default 'borrador'
                  check (status in ('borrador','revision','aprobado',
                                    'programado','publicado','fallido','cancelado')),
  approved_by   uuid references profiles(id) on delete set null,
  approved_at   timestamptz,
  -- Comentario obligatorio al devolver algo a borrador.
  review_note   text,
  campaign      text,
  -- Aviso previo: se marca cuando ya se avisó, para no insistir cada 5 min.
  prenotified_at timestamptz,
  -- Constancia de que un super admin pasó por encima de una validación
  -- saltable. Las que no son saltables no dejan rastro porque no ocurren.
  overrides     jsonb not null default '{}',
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Compuerta 1: no se programa ni se publica sin aprobación.
  constraint aprobacion_obligatoria check (
    status not in ('programado','publicado') or approved_by is not null
  ),
  -- Compuerta 2: programado exige fecha.
  constraint programado_con_fecha check (
    status <> 'programado' or scheduled_for is not null
  )
);

create index idx_content_posts_agenda
  on content_posts(scheduled_for)
  where status = 'programado';
create index idx_content_posts_estado on content_posts(status, created_at desc);

-- ------------------------------------------- un resultado POR CANAL ---------
-- Publicar en tres canales puede salir bien en dos y fallar en uno. Con un
-- solo campo global habría que reintentar todo, incluido lo que ya salió (y
-- duplicarlo).

create table content_post_targets (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references content_posts(id) on delete cascade,
  channel_id    uuid not null references content_channels(id) on delete cascade,
  status        text not null default 'pendiente'
                  check (status in ('pendiente','publicado','fallido','asistido')),
  external_id   text,
  external_url  text,
  error         text,
  attempts      int not null default 0,
  -- Espera creciente entre reintentos: no se toca antes de esta hora.
  next_attempt_at timestamptz,
  notified_at   timestamptz,        -- aviso al responsable, en modo asistido
  published_at  timestamptz,
  unique (post_id, channel_id)
);

create index idx_content_targets_post on content_post_targets(post_id);

-- ------------------------------------------------------------- bitácora ----
-- Quién lo escribió, quién lo devolvió y por qué, quién lo aprobó, qué pasó al
-- publicar. Un solo lugar, en orden.

create table content_post_events (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references content_posts(id) on delete cascade,
  kind        text not null,
  summary     text not null,
  actor_id    uuid references profiles(id) on delete set null,
  actor_label text,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index idx_content_events_post on content_post_events(post_id, created_at desc);

-- ------------------------------- editar borra la aprobación ---------------
-- Aprobar una cosa y publicar otra es EXACTAMENTE el accidente que hay que
-- hacer imposible. Si el copy, los activos o los canales cambian después de
-- aprobado, el registro vuelve a revisión solo.
--
-- Ojo: el disparador ignora los cambios de estado y de fecha. Programar algo
-- ya aprobado no debe desaprobarlo, y publicarlo tampoco.

create or replace function public.content_desaprobar_si_cambia()
returns trigger
language plpgsql
as $$
begin
  if new.approved_by is not null
     and (new.title  is distinct from old.title
       or new.body   is distinct from old.body
       or new.assets is distinct from old.assets)
     -- Solo si el cambio NO viene acompañado de una aprobación nueva (el
     -- gerente puede corregir una errata y volver a aprobar en un paso).
     and new.approved_at is not distinct from old.approved_at
  then
    new.status      := 'revision';
    new.approved_by := null;
    new.approved_at := null;
    new.review_note := 'El contenido cambió después de aprobarse: vuelve a revisión.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_content_desaprobar_si_cambia
  before update on content_posts
  for each row execute function public.content_desaprobar_si_cambia();

comment on function public.content_desaprobar_si_cambia() is
  'Si el copy, los activos o el título cambian después de aprobarse, el post vuelve a revisión. Aprobar una cosa y publicar otra es el accidente a evitar.';

-- ----------------------------------------------------------------- RLS -----

alter table content_channels     enable row level security;
alter table content_posts        enable row level security;
alter table content_post_targets enable row level security;
alter table content_post_events  enable row level security;

-- Ventas ve el calendario completo: coordinar contenido es trabajo de equipo.
create policy "ventas lee canales" on content_channels for select
  using (public.is_sales());
create policy "gerente administra canales" on content_channels for all
  using (public.is_sales_manager())
  with check (public.is_sales_manager());

create policy "ventas lee posts" on content_posts for select
  using (public.is_sales());
-- Redactar y editar pasa por server actions, que son las que saben si el post
-- es propio y en qué estado está. Aquí solo se abre la puerta al equipo.
create policy "ventas escribe posts" on content_posts for insert
  with check (public.is_sales());
create policy "ventas edita posts" on content_posts for update
  using (public.is_sales())
  with check (public.is_sales());

create policy "ventas lee destinos" on content_post_targets for select
  using (public.is_sales());
create policy "ventas escribe destinos" on content_post_targets for all
  using (public.is_sales())
  with check (public.is_sales());

create policy "ventas lee bitacora" on content_post_events for select
  using (public.is_sales());
create policy "ventas escribe bitacora" on content_post_events for insert
  with check (public.is_sales());
