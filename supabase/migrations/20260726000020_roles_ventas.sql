-- Portal de ventas — Fase 0: roles nuevos.
--
-- Van SOLOS en esta migración a propósito: en PostgreSQL un valor agregado con
-- `alter type ... add value` no se puede usar en la misma transacción que lo
-- creó. Las funciones y políticas que los usan viven en la migración 21.
--
-- ventas          → ejecutivo de ventas / atención a clientes (portal /ventas)
-- gerente_ventas  → aprueba contenido y boletín, ve tableros del equipo
--
-- Ninguno de los dos obtiene acceso a datos de miembros por el solo hecho de
-- existir: las políticas actuales piden `is_admin()` / `is_super_admin()`, que
-- estos roles NO cumplen.
alter type user_role add value if not exists 'ventas';
alter type user_role add value if not exists 'gerente_ventas';
