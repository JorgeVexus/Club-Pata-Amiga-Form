-- Portal de ventas — Fase 1a: la conversación apunta a su contacto.
--
-- La bandeja ya sabía a qué miembro pertenecía un hilo (`profile_id`), pero no
-- a qué persona del CRM. Con esto, un DM de Instagram y un correo de la misma
-- persona se ven en una sola ficha, que es el punto de la sección 1.
--
-- El resto de columnas de la bandeja (asignación, posponer, leído por persona)
-- llegan en la fase 2; aquí solo el vínculo, porque el relleno inicial ya lo
-- necesita.
alter table channel_conversations
  add column contact_id uuid references contacts(id) on delete set null;

create index idx_channel_conversations_contact
  on channel_conversations(contact_id);
