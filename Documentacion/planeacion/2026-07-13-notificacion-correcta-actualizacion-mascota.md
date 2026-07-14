# Notificacion correcta al actualizar informacion de mascota

## Objetivo

Corregir la notificacion administrativa generada por `/api/user/pets/[petId]/update` para que describa la informacion que realmente actualizo el miembro.

## Causa identificada

La ruta siempre inserta el mensaje `actualizo las fotos de {mascota}` aunque el payload haya actualizado cumpleanos, genero, colores, raza, adopcion o certificado veterinario.

## Alcance

- Crear un helper pequeno y testeable para construir el resumen de campos actualizados.
- Usar ese helper en la notificacion admin y en metadata de logs/notificaciones.
- Cubrir con prueba automatizada los casos de cumpleanos, informacion complementaria, fotos y certificado.
- Mantener el endpoint y la estructura de notificaciones existentes.

## Archivos

- `src/utils/pet-update-notification.js`: helper para detectar campos actualizados y construir el mensaje.
- `src/utils/pet-update-notification.d.ts`: tipos para consumo desde TypeScript.
- `src/app/api/user/pets/[petId]/update/route.ts`: uso del helper en logs y notificaciones.
- `tests/pet-update-notification.test.mjs`: prueba del resumen correcto.

## Verificacion

- `node tests/pet-update-notification.test.mjs`
- `npm run build`
- `npm run type-check`
- `npm run lint`
