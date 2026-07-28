-- Portal de ventas — Fase 2a: triaje de la bandeja unificada.
-- Spec: docs/portal-ventas/02-CONVERSACIONES.md
--
-- El problema a resolver son las 366 conversaciones sin leer del sistema vivo.
-- Lo que baja ese número es saber qué es MÍO, y para eso el "leído" tiene que
-- ser por persona: que yo lea algo no se lo puede esconder a nadie más.
--
-- Se AMPLÍA la bandeja que ya existe; no se duplica. Dos columnas que ya
-- estaban se reutilizan a propósito en lugar de crear equivalentes:
--   · `human_takeover` ya es el interruptor de la IA por conversación
--     (true = la IA no responde). No se agrega `ai_enabled`.
--   · `last_message_at` ya ordena la lista. No se agrega `last_activity_at`.

-- Canales nuevos: correo (fase 2b) y las superficies de supervisión que ya
-- existen en el producto (asistente del portal y bot vet).
alter table channel_conversations
  drop constraint channel_conversations_channel_check;
alter table channel_conversations
  add constraint channel_conversations_channel_check
  check (channel in ('facebook','instagram','whatsapp','email','portal','vet'));

alter table channel_conversations
  -- Triaje
  add column assigned_to    uuid references profiles(id) on delete set null,
  add column snoozed_until  timestamptz,
  -- Destacados POR PERSONA (la estrella de cada quien, no una global)
  add column starred_by     uuid[] not null default '{}',
  -- Asunto: lo necesita el correo, y a los demás canales no les estorba
  add column subject        text;

create index idx_channel_conversations_assigned
  on channel_conversations(assigned_to, last_message_at desc);
create index idx_channel_conversations_snoozed
  on channel_conversations(snoozed_until)
  where snoozed_until is not null;
create index idx_channel_conversations_starred
  on channel_conversations using gin (starred_by);

comment on column channel_conversations.starred_by is
  'Quiénes destacaron esta conversación. Es por persona: la estrella de alguien no aparece en la lista de los demás.';
comment on column channel_conversations.human_takeover is
  'true = la IA no responde en este hilo. Es el interruptor por conversación; se enciende al tomarla y se apaga al devolverla.';

-- Notas internas, adjuntos y envío programado
alter table channel_messages
  add column internal      boolean not null default false,
  add column attachments   jsonb not null default '[]',
  add column scheduled_for timestamptz,
  add column sent_at       timestamptz,
  add column send_error    text,
  -- Quién lo escribió, cuando fue una persona del equipo
  add column author_id     uuid references profiles(id) on delete set null;

create index idx_channel_messages_programados
  on channel_messages(scheduled_for)
  where scheduled_for is not null and sent_at is null;

comment on column channel_messages.internal is
  'Nota interna: vive en el mismo hilo y en orden cronológico, pero NUNCA se envía al cliente.';

-- ------------------------------------------------- leído por persona -------

create table conversation_reads (
  conversation_id uuid not null references channel_conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index idx_conversation_reads_user on conversation_reads(user_id);

comment on table conversation_reads is
  'Estado de leído POR PERSONA. Sin esto una bandeja compartida entre varios es inservible: el contador de "no leído" tiene que ser el de cada quien.';

-- ------------------------------------- retroalimentación de la IA ----------

create table message_feedback (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references channel_messages(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  note       text,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index idx_message_feedback_message on message_feedback(message_id);

comment on table message_feedback is
  'Los pulgares que el equipo ya presiona hoy sobre las respuestas de la IA. Se acumulan para revisarlos con criterio humano; NO reentrenan nada solos: la voz de marca y los límites legales no se ajustan por votación.';

-- ----------------------------------------------------------------- RLS -----

alter table conversation_reads enable row level security;
alter table message_feedback   enable row level security;

-- Cada quien administra su propio "leído"
create policy "propio leido" on conversation_reads for all
  using (public.is_sales() and user_id = auth.uid())
  with check (public.is_sales() and user_id = auth.uid());

-- El voto es de quien lo emite; leerlos los puede leer todo el portal (la
-- pantalla de revisión los agrupa por tema)
create policy "ventas lee votos" on message_feedback for select
  using (public.is_sales());
create policy "propio voto" on message_feedback for insert
  with check (public.is_sales() and user_id = auth.uid());
create policy "edita su voto" on message_feedback for update
  using (public.is_sales() and user_id = auth.uid());
create policy "borra su voto" on message_feedback for delete
  using (public.is_sales() and user_id = auth.uid());

-- La bandeja: los roles de ventas leen y escriben; borrar sigue siendo de
-- administración (una conversación borrada no se recupera).
create policy "ventas lee bandeja" on channel_conversations for select
  using (public.is_sales());
create policy "ventas edita bandeja" on channel_conversations for update
  using (public.is_sales());
create policy "ventas lee mensajes" on channel_messages for select
  using (public.is_sales());
create policy "ventas escribe mensajes" on channel_messages for insert
  with check (public.is_sales());
create policy "ventas edita mensajes" on channel_messages for update
  using (public.is_sales());
