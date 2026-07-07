# Plan - Edicion de razon social en wellness center

## Objetivo
Permitir que los Centros de Bienestar editen el campo `name`, mostrado como "Razon Social / Nombre", desde los puntos donde capturan o actualizan datos complementarios.

## Alcance
- Formulario complementario posterior al registro inicial.
- Widget externo en solicitud en revision.
- Widget externo en perfil aprobado, al editar detalles.
- API de actualizacion wellness, para marcar `name` como campo notificable al admin.

## Verificacion
- Prueba especifica `tests/wellness-legal-name-edit.test.mjs`.
- Pruebas relacionadas del widget wellness.
- `npm run type-check`, `npm run lint`, `npm run build` antes de commit/push.
