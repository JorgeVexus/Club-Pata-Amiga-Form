# Sesiones temporales para Memberstack

## Objetivo

Evitar que las cuentas de miembros, centros de bienestar y embajadores queden abiertas por accidente despues de cerrar el navegador.

## Alcance

- Redirigir las claves de sesion de Memberstack (`_ms-mid`, `_ms-mem`) de `localStorage` a `sessionStorage`.
- Ejecutar el guard antes del script de Memberstack dentro de Next.js.
- Aplicar la misma politica en widgets externos de miembro, centro de bienestar y embajador.
- Alinear el identificador auxiliar del admin para que tambien viva solo en `sessionStorage`.

## Verificacion

- Pruebas source-level para asegurar que el guard corre antes de `getCurrentMember`.
- `npm run type-check`
- `npm run lint`
- `npm run build`
