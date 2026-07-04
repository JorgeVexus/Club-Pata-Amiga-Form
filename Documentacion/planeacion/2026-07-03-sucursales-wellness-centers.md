# Plan de Implementacion: Sucursales para Centros de Bienestar

## Objetivo
Permitir que un Centro de Bienestar registre una o varias sucursales desde el widget, tanto en estado pendiente como aprobado, y que el admin pueda revisarlas desde el dashboard.

## Arquitectura
- Mantener `wellness_centers.address`, `lat` y `lng` como ubicacion principal por compatibilidad.
- Crear `wellness_center_locations` como tabla hija para soportar cantidad ilimitada de sucursales.
- Sincronizar sucursales desde `/api/wellness/update` mediante reemplazo transaccional simple por `wellness_center_id`.
- Devolver `locations` en `/api/wellness/me` y en `/api/admin/wellness`.
- Ajustar `/api/wellness/locations` para exponer cada sucursal aprobada al mapa publico, con fallback a la ubicacion principal si no hay sucursales.

## Tareas
- Escribir pruebas que fallen para widget, APIs y admin.
- Crear migracion SQL con tabla, indices, trigger y RLS.
- Ampliar tipos `WellnessCenterLocation` y `locations`.
- Ampliar `wellness.service.ts` con obtencion/sincronizacion de ubicaciones.
- Actualizar rutas `/api/wellness/me`, `/api/wellness/update`, `/api/wellness/locations` y `/api/admin/wellness`.
- Actualizar `public/widgets/wellness-center-widget.js` para agregar pregunta de multiples sucursales, boton `+ Agregar sucursal`, geolocalizacion/autocomplete por sucursal y envio de `locations`.
- Actualizar `WellnessCenterDetailModal` para mostrar sucursales al admin.
- Verificar con pruebas, type-check, lint y build.
