-- Portal de ventas — Fase 6: que el consumo del agente demo sí se registre.
-- Spec: docs/portal-ventas/06-AGENTE-DEMO.md, punto 5
--
-- Descubierto al probarlo: `ai_usage.conversation_id` apunta a
-- `channel_conversations` (los chats de redes y correo), pero las
-- conversaciones del asistente —y por lo tanto las del demo— viven en
-- `assistant_conversations`. Al mandar ese id la llave foránea rechazaba la
-- fila, y como `registrarUso()` nunca tumba la operación que la llamó, el
-- consumo se perdía EN SILENCIO.
--
-- Dos cosas se caían con eso, las dos importantes:
--   · el tope de gasto diario del demo, que se calcula sumando ai_usage, no
--     habría saltado nunca — justo la "factura sorpresa" que quería evitar;
--   · la constancia de qué herramientas usó el demo, que es la forma de
--     demostrar que NO tocó datos de miembro.

alter table ai_usage
  add column assistant_conversation_id uuid
    references assistant_conversations(id) on delete set null;

create index idx_ai_usage_asistente
  on ai_usage(assistant_conversation_id)
  where assistant_conversation_id is not null;

comment on column ai_usage.conversation_id is
  'Conversación de canal (redes, correo). Para las del asistente y el agente demo usa assistant_conversation_id.';
