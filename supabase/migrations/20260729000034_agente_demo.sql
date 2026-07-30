-- Portal de ventas — Fase 6: agente demo para registrados sin membresía.
-- Spec: docs/portal-ventas/06-AGENTE-DEMO.md
--
-- No hay tabla nueva a propósito. Una conversación demo es una conversación
-- del asistente con otra etiqueta: separar las tablas obligaría a duplicar la
-- bandeja, la supervisión y el historial para ganar nada.

alter table assistant_conversations
  add column mode text not null default 'miembro'
    check (mode in ('miembro','demo')),
  -- Cuando el interesado pide hablar con una persona, el hilo deja de ser de
  -- solo lectura. Es el momento de mayor intención de compra del embudo y no
  -- se puede perder en una bandeja que nadie atiende.
  add column wants_human boolean not null default false,
  add column wants_human_at timestamptz;

create index idx_assistant_conversations_demo
  on assistant_conversations(mode, updated_at desc)
  where mode = 'demo';

comment on column assistant_conversations.mode is
  'miembro = asistente real con datos del miembro. demo = versión de demostración para cuentas sin membresía: otro prompt y otras herramientas, no las mismas con menos permisos.';
