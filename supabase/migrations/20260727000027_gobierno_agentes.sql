-- Portal de ventas — Fase 2d: gobierno humano sobre los agentes IA.
-- Spec: docs/portal-ventas/02-CONVERSACIONES.md, punto 6.
--
-- Los agentes ya existían; lo que faltaba era el control: por qué se escaló,
-- a quién le toca, cuánto se está gastando y qué opina el equipo de las
-- respuestas.

alter table channel_conversations
  -- Por qué se marcó para atención. Hoy se marca pero no se sabe el motivo,
  -- así que quien abre el hilo tiene que adivinar.
  add column attention_reason       text,
  add column attention_at           timestamptz,
  -- Para el recordatorio: escalar sin que nadie llegue solo mueve el problema.
  add column attention_notified_at  timestamptz;

create index idx_channel_conversations_atencion
  on channel_conversations(attention_at)
  where needs_attention = true;

-- ------------------------------------------------------- consumo de la IA --

create table ai_usage (
  id              uuid primary key default gen_random_uuid(),
  agent           text not null,           -- ventas | soporte | vet | demo
  channel         text,
  conversation_id uuid references channel_conversations(id) on delete set null,
  message_id      uuid references channel_messages(id) on delete set null,
  model           text not null,
  tokens_in       int not null default 0,
  tokens_out      int not null default 0,
  cost_cents      int not null default 0,
  tools           jsonb not null default '[]',
  error           text,
  created_at      timestamptz not null default now()
);

create index idx_ai_usage_dia on ai_usage(created_at desc);
create index idx_ai_usage_agente on ai_usage(agent, created_at desc);

comment on table ai_usage is
  'Cada respuesta de la IA con su modelo, herramientas y costo. Sirve para auditar qué contestó el agente y para los topes de gasto: una superficie con IA sin tope es una factura sorpresa.';

alter table ai_usage enable row level security;

create policy "ventas lee consumo" on ai_usage for select
  using (public.is_sales());
