-- Portal de ventas — Fase 2b: correo dentro de la bandeja.
-- Spec: docs/portal-ventas/02-CONVERSACIONES.md, punto 5.
--
-- El enganche de hilos se hace por los ENCABEZADOS del propio correo
-- (Message-ID / In-Reply-To / References), que es como funciona el correo de
-- verdad. GoHighLevel engancha solo si el primer mensaje salió del CRM, y por
-- eso pierde el caso más común —que el cliente escriba primero—; es la queja
-- recurrente de sus usuarios y no la vamos a heredar.

alter table channel_messages
  -- Identificador del propio correo. Único cuando existe: si el proveedor
  -- reintenta la entrega, el mensaje no se duplica.
  add column message_id       text,
  add column in_reply_to      text,
  add column email_references text[] not null default '{}',
  -- De quién a quién (un hilo de correo puede tener varios destinatarios)
  add column from_address      text,
  add column to_addresses       text[] not null default '{}';

create unique index idx_channel_messages_message_id
  on channel_messages(message_id)
  where message_id is not null;
create index idx_channel_messages_in_reply_to
  on channel_messages(in_reply_to)
  where in_reply_to is not null;
create index idx_channel_messages_references
  on channel_messages using gin (email_references);

comment on column channel_messages.message_id is
  'Message-ID del correo. Lo generamos nosotros al enviar para que las respuestas del cliente enganchen con su hilo.';

-- ------------------------------------------------- buzones conectados ------

create table email_accounts (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('dominio','gmail','outlook')),
  address       text not null unique,
  display_name  text,
  -- null = buzón compartido del equipo; con dueño = buzón personal, y entonces
  -- SOLO su dueño y administración lo ven (decisión de privacidad del equipo).
  owner_id      uuid references profiles(id) on delete cascade,
  -- OAuth de buzones personales. Cifrado en reposo por Supabase; nunca sale al
  -- navegador: solo lo leen las rutas de servidor con la llave de servicio.
  oauth_tokens  jsonb,
  oauth_expires timestamptz,
  -- historyId de Gmail / deltaLink de Graph
  sync_cursor   text,
  is_active     boolean not null default true,
  last_sync_at  timestamptz,
  last_error    text,
  created_at    timestamptz not null default now()
);

comment on table email_accounts is
  'Buzones que alimentan la bandeja. El de dominio entra por webhook; los personales por OAuth. Solo se traen correos de contactos conocidos o dirigidos al buzón compartido: el buzón personal de nadie se copia completo.';

alter table email_accounts enable row level security;

-- El buzón compartido lo ve todo el portal; el personal, solo su dueño.
create policy "ventas lee buzones" on email_accounts for select
  using (public.is_sales() and (owner_id is null or owner_id = auth.uid()));
create policy "gerente administra buzones" on email_accounts for all
  using (public.is_sales_manager())
  with check (public.is_sales_manager());
create policy "cada quien su buzon" on email_accounts for update
  using (public.is_sales() and owner_id = auth.uid());
