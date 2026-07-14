# Auto-aprobacion de miembros por pago

## Objetivo

Separar la aprobacion de membresia de la revision de mascotas. Cuando un usuario confirma el pago, su cuenta debe quedar activa como miembro; el admin solo revisa y aprueba/rechaza mascotas individualmente.

## Alcance

- Registro V2 mantiene el flujo actual: pago en paso 3, perfil en paso 4, mascotas en paso 5 y confirmacion en paso 6.
- El pago confirmado actualiza al miembro como activo/aprobado en Supabase y Memberstack.
- Los recalculos por estado de mascotas ya no degradan `membership_status` ni `approval_status` del usuario.
- El widget unificado deja de mostrar la pantalla global de "membresia en revision" para miembros con mascotas y muestra directamente el estado de sus mascotas.
- El admin conserva las acciones de revision por mascota y deja de promover aprobacion manual de miembro como paso normal.

## Riesgos revisados

- `registerUserInSupabase` podia volver a guardar `membership_status: pending` en pasos posteriores del registro.
- `recalculateMemberStatus` y rutas locales de recalculo podian bajar al miembro a `pending`, `rejected`, `action_required` o `appealed` segun mascotas.
- El widget unificado tenia vistas heredadas para `pending_approval` y `waiting_approval`.
- El panel admin mostraba botones de "Aprobar Solicitud" a nivel miembro si el custom field de Memberstack no estaba aprobado.

## Verificacion esperada

- Tests unitarios de mapeo de estados de mascotas a miembro.
- Test de que `registerUserInSupabase` no fuerza `membership_status` cuando no se envia.
- Test estatico de copy del paso 6 para multiples mascotas.
- Build, type-check y lint completos antes de commit.
