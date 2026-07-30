-- Portal de ventas — Fase 3a: planes versionados y beneficios con snapshot.
-- Spec: docs/portal-ventas/03-MEMBRESIAS-Y-BENEFICIOS.md
--
-- EL DÍA DEL DESPLIEGUE NO CAMBIA NADA. La migración crea el plan que ya
-- existe, con sus precios actuales y `benefits = {}` (o sea: exactamente las
-- reglas de hoy), y le pone a cada suscripción vigente la foto de esos mismos
-- valores. El día del despliegue es el peor momento para estrenar reglas.

create table membership_plans (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  is_public   boolean not null default true,
  position    int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table plan_versions (
  id                 uuid primary key default gen_random_uuid(),
  plan_id            uuid not null references membership_plans(id) on delete cascade,
  version            int not null,
  interval           text not null check (interval in ('month','year')),
  price_cents        int not null,
  currency           text not null default 'MXN',
  -- SOLO lo que difiere del catálogo. Así, al agregar un beneficio nuevo, las
  -- versiones viejas lo heredan con su valor por omisión en lugar de quedar
  -- con un hueco.
  benefits           jsonb not null default '{}',
  status             text not null default 'borrador'
                       check (status in ('borrador','publicada','retirada')),
  -- Stripe: los precios son inmutables, así que cada versión crea el suyo. El
  -- diseño coincide con la herramienta en lugar de pelear con ella.
  stripe_product_id  text,
  stripe_price_id    text,
  -- Compuerta legal: cambiar un beneficio vinculante exige el reglamento que
  -- ya lo refleje y la confirmación de un super admin.
  legal_document_id  uuid references legal_documents(id),
  legal_confirmed_by uuid references profiles(id),
  legal_confirmed_at timestamptz,
  notes              text,
  created_by         uuid references profiles(id),
  published_by       uuid references profiles(id),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  unique (plan_id, version, interval)
);

create index idx_plan_versions_publicadas
  on plan_versions(plan_id, interval)
  where status = 'publicada';

alter table subscriptions
  add column plan_version_id      uuid references plan_versions(id),
  add column benefits_snapshot    jsonb,
  add column benefits_snapshot_at timestamptz;

comment on column subscriptions.benefits_snapshot is
  'Los beneficios que rigen a ESTE miembro, copiados al contratar. Publicar una versión nueva del plan no lo toca: la persona aceptó un reglamento concreto.';

-- ------------------------------------------------------------- semilla -----

insert into membership_plans (slug, name, description, is_public, position)
values ('membresia', 'Membresía Pata Amiga',
        'La membresía de salud para tus peludos, en todo México.', true, 0);

-- Versión 1 con los precios de hoy y benefits vacío = las reglas de hoy.
insert into plan_versions (plan_id, version, interval, price_cents, benefits, status, published_at, notes)
select p.id, 1, v.interval, v.precio, '{}'::jsonb, 'publicada', now(),
       'Versión inicial creada por la migración: son las reglas que ya estaban vigentes.'
from membership_plans p,
(values ('month', 15900), ('year', 169900)) as v(interval, precio)
where p.slug = 'membresia';

-- ------------------------------------------------------------- backfill ----
-- Cada suscripción existente queda ligada a su versión y con la foto de los
-- valores por omisión (los mismos que ya la regían).

update subscriptions s
set plan_version_id = pv.id
from plan_versions pv
join membership_plans p on p.id = pv.plan_id
where p.slug = 'membresia'
  and pv.version = 1
  and pv.interval = case when s.plan = 'annual' then 'year' else 'month' end
  and s.plan_version_id is null;

-- El snapshot se escribe con los mismos números que hoy están en constants.ts.
-- Si algún día cambian ahí, estas filas conservan lo que la persona contrató.
update subscriptions
set benefits_snapshot = jsonb_build_object(
      'espera_contratante_dias', 90,
      'espera_mascota_estandar_dias', 180,
      'espera_mascota_adoptada_raza_dias', 150,
      'espera_mascota_adoptada_mestizo_dias', 120,
      'espera_mascota_con_embajador_dias', 90,
      'espera_mascota_reemplazo_dias', 180,
      'tope_gastos_veterinarios_mxn', 3000,
      'tope_fallecimiento_mxn', 2000,
      'tope_vacunas_mxn', 300,
      'horas_compromiso_reintegro', 72,
      'apelaciones_max', 2,
      'mascotas_activas_max', 3,
      'edad_senior_anios', 10,
      'orientacion_vet_24_7', true,
      'comision_embajador_mensual_mxn', 16,
      'comision_embajador_anual_mxn', 170
    ),
    benefits_snapshot_at = now()
where benefits_snapshot is null;

-- ----------------------------------------------------------------- RLS -----

alter table membership_plans enable row level security;
alter table plan_versions    enable row level security;

-- Los planes públicos los lee cualquiera (la landing muestra precios).
create policy "planes publicos" on membership_plans for select
  using (is_public = true and archived_at is null);
create policy "ventas lee planes" on membership_plans for select
  using (public.is_sales());
create policy "super administra planes" on membership_plans for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "versiones publicadas" on plan_versions for select
  using (status = 'publicada');
create policy "ventas lee versiones" on plan_versions for select
  using (public.is_sales());
-- Crear borradores: el gerente. Publicar y tocar beneficios vinculantes pasa
-- además por la compuerta legal, que se aplica en la server action.
create policy "gerente crea versiones" on plan_versions for insert
  with check (public.is_sales_manager());
create policy "gerente edita borradores" on plan_versions for update
  using (public.is_sales_manager() and status = 'borrador');
create policy "super edita versiones" on plan_versions for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
