# Modal de bienvenida para miembros

## Objetivo

Mostrar un modal de bienvenida a miembros la primera vez que entran al widget unificado despues de tener una membresia activa. El modal debe mostrarse una sola vez por miembro, igual que en embajadores y centros de bienestar.

## Diseno

- Agregar `welcome_shown boolean default false` en `public.users`.
- Incluir `welcome_shown` en la respuesta de `/api/user/pets`.
- Crear una API para marcar el modal como visto por `memberstackId`.
- En `public/widgets/unified-membership-widget.js`, mostrar el modal cuando:
  - el usuario tiene estado de miembro activo/aprobado o tiene mascotas cargadas;
  - `welcome_shown` es falso;
  - no esta en estados de pago pendiente, pago procesando o membresia cancelada.
- Al cerrar el modal, llamar a la API para guardar `welcome_shown: true`.

## Pruebas

- Test estatico para confirmar que `/api/user/pets` expone `welcome_shown`.
- Test estatico para confirmar que el widget muestra y persiste el modal con API, no con `localStorage`.
- Verificacion completa: tests puntuales, `npm run type-check`, `npm run build`, `npm run lint`.
