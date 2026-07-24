# Correccion de cache para zona horaria del widget

## Objetivo

Evitar que el dashboard cargue durante horas una version anterior del widget y muestre timestamps UTC como si fueran hora local.

## Plan

1. Verificar el timestamp crudo en Supabase y su conversion a `America/Mexico_City`.
2. Agregar una prueba de regresion para exigir revalidacion inmediata de los widgets publicos.
3. Configurar los encabezados HTTP de `/widgets/*` sin cache prolongado.
4. Ejecutar pruebas, type-check, lint y build.

## Evidencia

El registro de Felipe se almaceno como `2026-07-24T03:17:42.205+00:00`, equivalente a `23 jul 2026, 9:17 p.m.` en Ciudad de Mexico. Produccion entregaba el archivo con `Cache-Control: public, max-age=14400, must-revalidate`.
