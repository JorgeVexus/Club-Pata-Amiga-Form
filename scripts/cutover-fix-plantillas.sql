create table if not exists message_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  channels    text[] not null default '{}',
  subject     text,
  body        text not null,
  assets      jsonb not null default '[]',
  usos        int not null default 0,
  created_by  uuid references profiles(id) on delete set null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_message_templates_activas
  on message_templates(usos desc)
  where archived_at is null;

create table if not exists whatsapp_templates (
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

insert into whatsapp_templates (meta_name, category, body_preview, variables, status) values
  ('seguimiento_membresia', 'utility',
   'Hola {{1}}, seguimos por aquí para ayudarte con tu membresía de Pata Amiga. ¿Te late que retomemos?', 1, 'pendiente'),
  ('recordatorio_carrito', 'utility',
   'Hola {{1}}, dejaste tu registro a medias. Si quieres te ayudo a terminarlo en un par de minutos.', 1, 'pendiente')
on conflict (meta_name) do nothing;

insert into storage.buckets (id, name, public)
values ('channel-attachments', 'channel-attachments', false)
on conflict (id) do nothing;

drop policy if exists "ventas lee adjuntos" on storage.objects;
create policy "ventas lee adjuntos" on storage.objects for select
  using (bucket_id = 'channel-attachments' and public.is_sales());
drop policy if exists "ventas sube adjuntos" on storage.objects;
create policy "ventas sube adjuntos" on storage.objects for insert
  with check (bucket_id = 'channel-attachments' and public.is_sales());
drop policy if exists "gerente borra adjuntos" on storage.objects;
create policy "gerente borra adjuntos" on storage.objects for delete
  using (bucket_id = 'channel-attachments' and public.is_sales_manager());

alter table message_templates   enable row level security;
alter table whatsapp_templates  enable row level security;

drop policy if exists "ventas lee plantillas" on message_templates;
create policy "ventas lee plantillas" on message_templates for select
  using (public.is_sales());
drop policy if exists "ventas usa plantillas" on message_templates;
create policy "ventas usa plantillas" on message_templates for update
  using (public.is_sales());
drop policy if exists "gerente crea plantillas" on message_templates;
create policy "gerente crea plantillas" on message_templates for insert
  with check (public.is_sales_manager());
drop policy if exists "gerente borra plantillas" on message_templates;
create policy "gerente borra plantillas" on message_templates for delete
  using (public.is_sales_manager());

drop policy if exists "ventas lee plantillas wa" on whatsapp_templates;
create policy "ventas lee plantillas wa" on whatsapp_templates for select
  using (public.is_sales());
drop policy if exists "gerente administra plantillas wa" on whatsapp_templates;
create policy "gerente administra plantillas wa" on whatsapp_templates for all
  using (public.is_sales_manager())
  with check (public.is_sales_manager());
