-- Portal de ventas — Fase 5a: el boletín, empezando por sus compuertas.
-- Spec: docs/portal-ventas/05-NEWSLETTER.md
--
-- Igual que en el calendario (sección 4): primero lo que protege el dato.
-- Aquí son TRES compuertas antes de poder programar un envío, y las tres
-- viven en la base:
--
--   1. Aprobación de un gerente.
--   2. Prueba enviada — alguien tuvo que verlo en una bandeja real.
--   3. Revisión veterinaria, si el tema toca salud animal.
--
-- CORRECCIÓN A LA SPEC: la tercera estaba escrita como un CHECK con una
-- subconsulta a newsletter_topics. Postgres NO permite subconsultas en un
-- CHECK (no puede garantizar que sigan siendo ciertas después). La garantía se
-- consigue igual copiando la marca de salud a la edición (`topic_is_health`) y
-- manteniéndola al día con un disparador desde el tema. La compuerta sigue
-- siendo de base de datos, que es lo que importaba.

-- --------------------------------------------------- calendario editorial ---

create table newsletter_schedule (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cadence     text not null check (cadence in ('diaria','semanal','mensual')),
  weekday     int check (weekday between 1 and 7),      -- 1 = lunes
  month_day   int check (month_day between 1 and 28),   -- 28 para que exista en febrero
  send_time   time not null default '09:00',
  timezone    text not null default 'America/Mexico_City',
  is_active   boolean not null default true,
  starts_on   date not null,
  ends_on     date,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Una cadencia semanal sin día de la semana no sabe cuándo enviar.
  constraint cadencia_con_dia check (
    (cadence <> 'semanal' or weekday is not null)
    and (cadence <> 'mensual' or month_day is not null)
  )
);

create table newsletter_topics (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid references newsletter_schedule(id) on delete set null,
  planned_for  date not null,
  title        text not null default 'Sin título',
  -- EL INSUMO HUMANO. Sin esto el investigador no corre: tener a una persona
  -- al final es corrección; tenerla al principio es dirección.
  brief        text,
  must_include text,
  must_avoid   text,
  sources      jsonb not null default '[]',
  is_health    boolean not null default false,
  status       text not null default 'planeado'
                 check (status in ('planeado','listo_para_investigar','en_proceso',
                                   'con_edicion','omitido')),
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  -- Un hueco por fecha y programación: la tarea que los genera se puede correr
  -- dos veces sin duplicar el año.
  unique (schedule_id, planned_for)
);

create index idx_newsletter_topics_fecha on newsletter_topics(planned_for);

-- ------------------------------------------------- plantillas de marca -----
-- Son DATOS, no código: es la forma de "alimentarle las plantillas de marca al
-- agente" sin desplegar. El agente NO escribe HTML — llena bloques tipados y
-- la plataforma los renderiza con este layout, así el correo no se rompe en un
-- cliente de correo raro.

create table newsletter_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  layout      text not null,
  block_types jsonb not null default '[]',
  sample      text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------- ediciones -----

create table newsletter_editions (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references newsletter_topics(id) on delete cascade,
  subject        text,
  preheader      text,
  blocks         jsonb not null default '[]',
  html           text,
  template_id    uuid references newsletter_templates(id) on delete set null,
  status         text not null default 'borrador'
                   check (status in ('borrador','investigada','redactada','revision',
                                     'aprobada','programada','enviada','fallida')),
  -- Copia de newsletter_topics.is_health, mantenida por disparador. Existe
  -- para que la compuerta veterinaria pueda ser un CHECK de verdad.
  topic_is_health boolean not null default false,
  vet_reviewed_by uuid references profiles(id) on delete set null,
  vet_reviewed_at timestamptz,
  approved_by    uuid references profiles(id) on delete set null,
  approved_at    timestamptz,
  review_note    text,
  test_sent_at   timestamptz,
  scheduled_for  timestamptz,
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Compuerta 1: nadie programa ni envía sin aprobación.
  constraint aprobacion_obligatoria check (
    status not in ('programada','enviada') or approved_by is not null
  ),
  -- Compuerta 2: aprobar algo que nadie vio en su bandeja es aprobar a ciegas.
  constraint prueba_obligatoria check (
    status not in ('programada','enviada') or test_sent_at is not null
  ),
  -- Compuerta 3: si el tema toca salud, hay revisión veterinaria antes de
  -- aprobar. El mismo criterio que ya rige al bot: acompañamiento, no
  -- diagnóstico.
  constraint revision_vet_si_aplica check (
    status not in ('aprobada','programada','enviada')
      or topic_is_health = false
      or vet_reviewed_at is not null
  ),
  constraint programada_con_fecha check (
    status <> 'programada' or scheduled_for is not null
  )
);

create index idx_newsletter_editions_agenda
  on newsletter_editions(scheduled_for)
  where status = 'programada';
create index idx_newsletter_editions_tema on newsletter_editions(topic_id);

-- ------------------------------------------------ corridas de los agentes --
-- Qué se le pidió, qué devolvió, cuánto costó. Permite rehacer, comparar y
-- entender de dónde salió una frase.

create table newsletter_runs (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references newsletter_editions(id) on delete cascade,
  kind         text not null check (kind in ('investigacion','redaccion')),
  model        text not null,
  input        jsonb not null default '{}',
  output       jsonb,
  sources      jsonb not null default '[]',
  tokens_in    int not null default 0,
  tokens_out   int not null default 0,
  cost_cents   int not null default 0,
  duration_ms  int,
  error        text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index idx_newsletter_runs_edicion on newsletter_runs(edition_id, created_at desc);

-- ---------------------------------------------------------- los envíos -----

create table newsletter_sends (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid not null references newsletter_editions(id) on delete cascade,
  subscriber_id  uuid references newsletter_subscribers(id) on delete set null,
  email          text not null,
  resend_id      text,
  status         text not null default 'encolado'
                   check (status in ('encolado','enviado','entregado','abierto',
                                     'rebotado','fallido','baja')),
  error          text,
  sent_at        timestamptz,
  updated_at     timestamptz not null default now(),
  -- La garantía de que un reintento no manda dos veces la misma edición a la
  -- misma persona. El duplicado es el error más visible de un boletín.
  unique (edition_id, email)
);

create index idx_newsletter_sends_resend on newsletter_sends(resend_id)
  where resend_id is not null;

-- ------------------------------------------- suscriptores: baja y rebotes --
-- La tabla existía con lo mínimo (correo y origen). El envío necesita saber a
-- quién ya no escribirle.

alter table newsletter_subscribers
  add column status text not null default 'activo'
    check (status in ('activo','baja','rebote_duro')),
  -- Token propio por persona: darse de baja es un clic, sin sesión.
  add column unsubscribe_token uuid not null default gen_random_uuid(),
  add column unsubscribed_at timestamptz,
  add column bounced_at timestamptz;

create unique index idx_newsletter_subs_token
  on newsletter_subscribers(unsubscribe_token);

comment on column newsletter_subscribers.status is
  'activo | baja (se dio de baja) | rebote_duro (el correo no existe). Los dos últimos quedan fuera de todo envío.';

-- ------------------------------------- disparadores: la marca y la edición --

/* La marca de salud del tema se copia a la edición y se mantiene al día. Sin
   esto la compuerta veterinaria no podría ser un CHECK. */
create or replace function public.boletin_marca_salud()
returns trigger
language plpgsql
as $$
begin
  select coalesce(t.is_health, false) into new.topic_is_health
    from newsletter_topics t where t.id = new.topic_id;
  return new;
end;
$$;

create trigger trg_boletin_marca_salud
  before insert or update of topic_id on newsletter_editions
  for each row execute function public.boletin_marca_salud();

/* Si un tema pasa a ser de salud DESPUÉS de que existe su edición, la edición
   tiene que enterarse — si no, se colaría por la compuerta con la copia vieja.

   OJO, esto salió al probarlo: propagar la marca a secas hacía que la
   compuerta veterinaria rechazara la fila, y como el rechazo ocurre dentro del
   disparador, se revertía el guardado ENTERO del tema. Es decir: marcar un
   tema como de salud fallaba en silencio.

   Lo correcto es lo mismo que hace el resto de la sección cuando cambia algo
   ya aprobado: la edición vuelve a revisión y tendrá que pasar por la revisión
   veterinaria antes de volver a aprobarse. La prueba enviada NO se borra: el
   contenido no cambió, así que lo que se probó sigue siendo esto. */
create or replace function public.boletin_propaga_salud()
returns trigger
language plpgsql
as $$
begin
  if new.is_health is not distinct from old.is_health then
    return new;
  end if;

  -- Las que no chocan con la compuerta reciben la marca sin más.
  update newsletter_editions
     set topic_is_health = new.is_health
   where topic_id = new.id
     and (new.is_health = false
          or vet_reviewed_at is not null
          or status not in ('aprobada','programada'));

  -- Las que sí chocan (aprobadas o programadas, sin revisión veterinaria)
  -- regresan a revisión en lugar de tumbar el guardado.
  if new.is_health then
    update newsletter_editions
       set topic_is_health = true,
           status          = 'revision',
           approved_by     = null,
           approved_at     = null,
           scheduled_for   = null,
           review_note     = 'El tema pasó a ser de salud: necesita revisión veterinaria antes de volver a aprobarse.'
     where topic_id = new.id
       and status in ('aprobada','programada')
       and vet_reviewed_at is null;
  end if;

  return new;
end;
$$;

create trigger trg_boletin_propaga_salud
  after update of is_health on newsletter_topics
  for each row execute function public.boletin_propaga_salud();

/* Editar el contenido después de aprobado borra la aprobación, igual que en el
   calendario. Aprobar una cosa y enviar otra es el accidente a evitar — y en un
   boletín no hay forma de recogerlo. */
create or replace function public.boletin_desaprobar_si_cambia()
returns trigger
language plpgsql
as $$
begin
  if new.approved_by is not null
     and (new.subject   is distinct from old.subject
       or new.preheader is distinct from old.preheader
       or new.blocks    is distinct from old.blocks
       or new.template_id is distinct from old.template_id)
     and new.approved_at is not distinct from old.approved_at
  then
    new.status      := 'revision';
    new.approved_by := null;
    new.approved_at := null;
    -- La prueba también deja de valer: lo que se probó ya no es esto.
    new.test_sent_at := null;
    new.review_note := 'La edición cambió después de aprobarse: vuelve a revisión y hay que mandar una prueba nueva.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_boletin_desaprobar_si_cambia
  before update on newsletter_editions
  for each row execute function public.boletin_desaprobar_si_cambia();

-- ----------------------------------------------------------------- RLS -----

alter table newsletter_schedule  enable row level security;
alter table newsletter_topics    enable row level security;
alter table newsletter_templates enable row level security;
alter table newsletter_editions  enable row level security;
alter table newsletter_runs      enable row level security;
alter table newsletter_sends     enable row level security;

create policy "ventas lee programacion" on newsletter_schedule for select
  using (public.is_sales());
create policy "gerente administra programacion" on newsletter_schedule for all
  using (public.is_sales_manager()) with check (public.is_sales_manager());

-- Escribir el brief es trabajo de todo el equipo (matriz de la sección 5.7).
create policy "ventas administra temas" on newsletter_topics for all
  using (public.is_sales()) with check (public.is_sales());

create policy "ventas lee plantillas" on newsletter_templates for select
  using (public.is_sales());
create policy "gerente administra plantillas" on newsletter_templates for all
  using (public.is_sales_manager()) with check (public.is_sales_manager());

-- Aprobar, programar y confirmar la revisión veterinaria pasan por server
-- actions que vuelven a preguntar por el rol; aquí se abre la puerta al equipo
-- y las compuertas de arriba hacen el resto.
create policy "ventas administra ediciones" on newsletter_editions for all
  using (public.is_sales()) with check (public.is_sales());

create policy "ventas lee corridas" on newsletter_runs for select
  using (public.is_sales());
create policy "ventas escribe corridas" on newsletter_runs for insert
  with check (public.is_sales());

create policy "ventas lee envios" on newsletter_sends for select
  using (public.is_sales());

-- Ventas necesita ver la lista para saber a cuánta gente le llega.
create policy "ventas lee suscriptores" on newsletter_subscribers for select
  using (public.is_sales());
