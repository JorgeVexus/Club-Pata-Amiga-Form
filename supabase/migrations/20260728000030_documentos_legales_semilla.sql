-- Portal de ventas — Fase 3c (2 de 3): que la compuerta legal tenga a qué apuntar.
-- Spec: docs/portal-ventas/03-MEMBRESIAS-Y-BENEFICIOS.md, puntos 4.1 y 5
--
-- Descubierto al probar la migración de cohortes: `legal_documents` estaba
-- VACÍA. La tabla existe desde el esquema inicial, pero nadie la había
-- poblado — las páginas de /legales renderizan los textos desde el código
-- (src/data/legal-texts.ts), así que nada dependía de ella.
--
-- El efecto era que la compuerta legal no se podía satisfacer NUNCA: ni al
-- publicar una versión con un beneficio del reglamento, ni al migrar una
-- cohorte a peor. El selector salía vacío y la acción quedaba bloqueada para
-- siempre. Una compuerta que nadie puede cruzar no protege: solo estorba.
--
-- Cada fila es la IDENTIDAD y la VERSIÓN de un documento, no su texto. El
-- texto sigue viviendo en el código y se lee en /legales/<slug>; duplicarlo
-- aquí crearía dos verdades que se contradirían al primer cambio de redacción.
-- Cuando el equipo publique una redacción nueva, se agrega una fila con
-- version + 1 y la anterior se marca is_active = false.

insert into legal_documents (slug, title, version, file_url, is_active)
values
  ('terminos-y-condiciones',   'Términos y Condiciones',        1, '/legales/terminos-y-condiciones',   true),
  ('reglamento-de-reintegros', 'Reglamento de reintegros',      1, '/legales/reglamento-de-reintegros', true),
  ('reglamento-de-integridad', 'Reglamento de Integridad',      1, '/legales/reglamento-de-integridad', true),
  ('aviso-de-privacidad',      'Aviso de privacidad Integral',  1, '/legales/aviso-de-privacidad',      true),
  ('politica-de-cookies',      'Política de Cookies',           1, '/legales/politica-de-cookies',      true)
on conflict (slug, version) do nothing;

-- Falta a propósito 'convenio-asociado': su redacción es uno de los insumos
-- que el equipo legal todavía no entrega (docs/ESTADO-DEL-PROYECTO.md). Se
-- agrega cuando exista el texto, no antes: una fila sin documento detrás
-- sería justo la promesa falsa que esta compuerta busca evitar.

comment on table legal_documents is
  'Identidad y versión de cada documento legal. El TEXTO vive en src/data/legal-texts.ts y se muestra en /legales/<slug>. Es lo que señala la compuerta legal al publicar una versión de plan o migrar una cohorte.';
