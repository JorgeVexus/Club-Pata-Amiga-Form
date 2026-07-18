# Centros aliados: estado Próximamente

## Objetivo

Ocultar temporalmente el directorio y los centros de prueba del dashboard de miembros antes de producción, manteniendo visible el acceso “Centros aliados”.

## Diseño aprobado

- Añadir una bandera reversible `CENTERS_DIRECTORY_ENABLED` con valor inicial `false`.
- Mantener los accesos lateral y móvil.
- Cuando la bandera esté desactivada, mostrar una pantalla “Próximamente” con el estándar visual V2.
- No consultar `/api/wellness/locations` mientras el directorio esté desactivado.
- No mostrar buscador, filtros, tarjetas ni CTA del directorio.
- Conservar intacta la implementación actual para reactivarla cambiando la bandera a `true`.

## Verificación

- Prueba de regresión para la bandera, el estado visual y el bloqueo de carga.
- Pruebas existentes del dashboard unificado.
- Type-check, lint y build antes de commit o push.
