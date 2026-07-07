# Plan de Implementacion: Fotos de Sucursales Wellness

## Objetivo
Permitir que los Centros de Bienestar carguen fotos para la sucursal principal y las sucursales adicionales desde la pantalla complementaria de registro, el widget en revision y el perfil aprobado.

## Arquitectura
- Guardar las fotos por ubicacion en `wellness_center_locations.photo_urls` como arreglo de URLs publicas.
- Crear bucket publico `wellness-location-photos` en Supabase Storage.
- Agregar endpoint `/api/upload/wellness-location-photo` para subir fotos asociadas al `memberstack_id` y a un indice temporal de ubicacion.
- Mantener el guardado final de metadatos en `/api/wellness/update` usando `locations`.
- Mostrar fotos en el detalle admin y en el popup del mapa publico.

## Tareas
- Agregar prueba de contrato para fotos de sucursales.
- Crear migracion SQL con columna `photo_urls` y bucket/policies.
- Extender tipos y servicio wellness para persistir/devolver fotos.
- Crear endpoint de upload para fotos de ubicacion.
- Actualizar `WellnessComplementaryForm` para foto principal y fotos por sucursal adicional.
- Actualizar `wellness-center-widget.js` con subida y previsualizacion de fotos por ubicacion.
- Actualizar admin modal y `wellness-map-widget.js` para mostrar fotos.
- Ejecutar pruebas, type-check, lint y build.
