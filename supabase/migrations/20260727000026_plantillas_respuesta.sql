-- Portal de ventas — Fase 2c: plantillas de respuesta, adjuntos y ventana de 24 h.
-- Spec: docs/portal-ventas/02-CONVERSACIONES.md, puntos 3.4, 3.5 y 4.4.

-- ------------------------------------------- plantillas de respuesta 1 a 1 --
--
-- POR QUÉ UNA TABLA NUEVA Y NO `email_templates`: son cosas distintas con
-- ciclos distintos. `email_templates` son los correos TRANSACCIONALES y masivos
-- de la plataforma (bienvenida, reintegro aprobado, cumpleaños), que se editan
-- en /admin/comunicados. Estas son respuestas UNO A UNO que escribe ventas, en
-- cualquier canal, y cambian todo el tiempo. Mezclarlas haría que un ejecutivo
-- pudiera editar por accidente el correo de bienvenida de toda la base.
create table message_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  -- Vacío = sirve para cualquier canal
  channels    text[] not null default '{}',
  subject     text,                        -- solo correo
  body        text not null,               -- admite {{variables}}
  assets      jsonb not null default '[]', -- rutas en el bucket channel-attachments
  usos        int not null default 0,      -- para ordenar por las más usadas
  created_by  uuid references profiles(id) on delete set null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_message_templates_activas
  on message_templates(usos desc)
  where archived_at is null;

-- ------------------------------------------- plantillas aprobadas de Meta --
--
-- Fuera de la ventana de 24 h, WhatsApp NO permite texto libre. Hoy eso deja la
-- conversación en un callejón sin salida ("El usuario no ha iniciado ningún
-- mensaje en las últimas 24 horas"); con estas plantillas se puede retomar.
--
-- CONECTAR: los nombres y el estado los aprueba Meta (1–3 semanas). Se registran
-- aquí para que el compositor las ofrezca; el envío real necesita la app de Meta
-- con sus permisos.
create table whatsapp_templates (
  id           uuid primary key default gen_random_uuid(),
  meta_name    text not null unique,
  language     text not null default 'es_MX',
  category     text not null default 'utility'
                 check (category in ('utility','marketing','authentication')),
  body_preview text not null,
  variables    int not null default 0,
  status       text not null default 'pendiente'
                 check (status in ('pendiente','aprobada','rechazada','pausada')),
  synced_at    timestamptz,
  created_at   timestamptz not null default now()
);

comment on table whatsapp_templates is
  'Plantillas aprobadas por Meta para reabrir conversaciones de WhatsApp fuera de la ventana de 24 h.';

-- Semilla de ejemplo, en estado "pendiente" para que quede claro que todavía no
-- las aprobó Meta y no se puedan usar por error.
insert into whatsapp_templates (meta_name, category, body_preview, variables, status) values
  ('seguimiento_membresia', 'utility',
   'Hola {{1}}, seguimos por aquí para ayudarte con tu membresía de Pata Amiga. ¿Te late que retomemos?', 1, 'pendiente'),
  ('recordatorio_carrito', 'utility',
   'Hola {{1}}, dejaste tu registro a medias. Si quieres te ayudo a terminarlo en un par de minutos.', 1, 'pendiente');

-- ------------------------------------------------------------- adjuntos ----

insert into storage.buckets (id, name, public)
values ('channel-attachments', 'channel-attachments', false)
on conflict (id) do nothing;

-- Los adjuntos de la bandeja los ve y sube el portal de ventas.
create policy "ventas lee adjuntos" on storage.objects for select
  using (bucket_id = 'channel-attachments' and public.is_sales());
create policy "ventas sube adjuntos" on storage.objects for insert
  with check (bucket_id = 'channel-attachments' and public.is_sales());
create policy "gerente borra adjuntos" on storage.objects for delete
  using (bucket_id = 'channel-attachments' and public.is_sales_manager());

-- ----------------------------------------------------------------- RLS -----

alter table message_templates   enable row level security;
alter table whatsapp_templates  enable row level security;

-- Usarlas, todo el portal; administrarlas, el gerente (una plantilla mal
-- redactada la manda todo el equipo muchas veces).
create policy "ventas lee plantillas" on message_templates for select
  using (public.is_sales());
create policy "ventas usa plantillas" on message_templates for update
  using (public.is_sales());
create policy "gerente crea plantillas" on message_templates for insert
  with check (public.is_sales_manager());
create policy "gerente borra plantillas" on message_templates for delete
  using (public.is_sales_manager());

create policy "ventas lee plantillas wa" on whatsapp_templates for select
  using (public.is_sales());
create policy "gerente administra plantillas wa" on whatsapp_templates for all
  using (public.is_sales_manager())
  with check (public.is_sales_manager());
