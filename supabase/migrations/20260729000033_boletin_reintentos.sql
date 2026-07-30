-- Portal de ventas — Fase 5d: cuántas veces se intentó cada correo.
-- Spec: docs/portal-ventas/05-NEWSLETTER.md, punto 5
--
-- Descubierto al correr el envío de verdad: sin llevar la cuenta de intentos,
-- el reintento de los que fallan no tiene freno (cada pasada del cron los
-- vuelve a tomar, para siempre) y no se puede distinguir "todavía no sale" de
-- "ya no va a salir".
--
-- Con esto, una edición donde TODO falló queda 'fallida' en lugar de
-- 'enviada'. Marcar como enviada una edición que no le llegó a nadie es la
-- peor mentira que puede contar esta pantalla.

alter table newsletter_sends
  add column attempts int not null default 0;

comment on column newsletter_sends.attempts is
  'Intentos de envío. Al llegar al tope se deja de reintentar y la edición puede cerrarse como fallida.';
