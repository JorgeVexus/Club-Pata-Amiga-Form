-- Asistente IA de soporte (widget en /app) y agente de ventas en canales
-- sociales (Messenger / Instagram / WhatsApp) con bandeja en /admin.
-- Los conectores externos (Anthropic, Meta) se configuran por variables de
-- entorno — ver docs/AGENTES-IA.md (marcadores CONECTAR:).

-- ===== Asistente de soporte (miembros autenticados en /app) =====

create table assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_assistant_messages_conv on assistant_messages(conversation_id, created_at);
create index idx_assistant_conversations_user on assistant_conversations(user_id);

alter table assistant_conversations enable row level security;
alter table assistant_messages enable row level security;

-- Mismo patrón que vet_conversations: cada quien lo suyo; admins leen para supervisar
create policy "own assistant conversations" on assistant_conversations
  for select using (auth.uid() = user_id or public.is_admin());
create policy "own assistant conversations insert" on assistant_conversations
  for insert with check (auth.uid() = user_id);
create policy "own assistant messages" on assistant_messages
  for select using (
    exists (select 1 from assistant_conversations c where c.id = conversation_id and (c.user_id = auth.uid() or public.is_admin()))
  );
create policy "own assistant messages insert" on assistant_messages
  for insert with check (
    exists (select 1 from assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create trigger set_updated_at before update on assistant_conversations
  for each row execute function public.set_updated_at();

-- ===== Conversaciones de canales sociales (agente de ventas) =====
-- Los mensajes entran por el webhook de Meta (service role, sin RLS) y los
-- admins los leen/gestionan desde /admin/conversaciones.

create table channel_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('facebook', 'instagram', 'whatsapp')),
  external_user_id text not null, -- PSID (Messenger) / IGSID (Instagram) / número (WhatsApp)
  display_name text,
  profile_id uuid references profiles(id) on delete set null, -- ligado a cuenta si se identifica por correo/teléfono
  human_takeover boolean not null default false, -- true = la IA se pausa y responde el equipo
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  last_admin_read_at timestamptz, -- para el badge de no leídos en la bandeja
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_user_id)
);

create table channel_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references channel_conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  sender text not null check (sender in ('contact', 'ai', 'admin')),
  content text not null,
  external_message_id text, -- id del mensaje en Meta, para deduplicar reintentos del webhook
  created_at timestamptz not null default now()
);

create index idx_channel_messages_conv on channel_messages(conversation_id, created_at);
create unique index idx_channel_messages_external on channel_messages(external_message_id)
  where external_message_id is not null;
create index idx_channel_conversations_last on channel_conversations(last_message_at desc);

alter table channel_conversations enable row level security;
alter table channel_messages enable row level security;

-- Solo admins desde la app; el webhook escribe con service role (omite RLS)
create policy "admin channel conversations" on channel_conversations
  for all using (public.is_admin());
create policy "admin channel messages" on channel_messages
  for all using (public.is_admin());

create trigger set_updated_at before update on channel_conversations
  for each row execute function public.set_updated_at();

-- Realtime para la bandeja de admin (mensajes nuevos sin recargar)
alter publication supabase_realtime add table channel_conversations, channel_messages;
