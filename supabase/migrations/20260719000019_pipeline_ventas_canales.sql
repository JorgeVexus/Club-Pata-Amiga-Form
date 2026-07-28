-- Pipeline de ventas en la bandeja de canales: etapa por conversación
-- (la clasifica el agente IA o el equipo a mano) + bandera de atención urgente.
alter table channel_conversations
  add column pipeline_stage text not null default 'nuevo'
    check (pipeline_stage in ('nuevo', 'interesado', 'convertido', 'descartado', 'soporte')),
  add column needs_attention boolean not null default false;

create index idx_channel_conversations_stage on channel_conversations(pipeline_stage);
