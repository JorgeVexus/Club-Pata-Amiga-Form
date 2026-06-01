# Filtro y Magic Link para Mascotas por Recuperar

## Objetivo

Permitir que el admin encuentre rapidamente miembros pagados con mascotas faltantes y les envie desde "Ver detalles" un link seguro para completar exclusivamente la informacion de mascotas en el flujo V2.

## Alcance

- Agregar filtro extra `Mascotas por recuperar` en la tabla de solicitudes admin.
- Agregar endpoint admin para generar magic token con intent `complete_pet_info` y enviar email al cliente.
- Agregar boton en `MemberDetailModal` para disparar ese envio cuando el miembro tenga `registrationIssue`.
- Ajustar Registro V2 para que `reason=complete_pet_info` aterrice en paso 2 si no hay mascota basica, y en paso 5 si ya hay mascota basica pero falta completar ficha.
- Mantener el flujo de pago intacto: estos links no deben mandar al usuario a checkout.

## Verificacion

- `node --test tests/registration-completeness.test.mjs`
- `npm run type-check`
- `npm run lint`
- `npm run build`

## Riesgos

- El magic token existente no inicia sesion por si solo; si Memberstack no tiene sesion activa, el usuario debera autenticarse con el email prellenado y el intent quedara guardado.
- No se crean mascotas automaticamente; el usuario debe completar los pasos del flujo V2.

## Implementado - 2026-06-01

- Filtro extra `Mascotas por recuperar` agregado a la tabla admin.
- Endpoint `/api/admin/members/[id]/pet-recovery-link` agregado para generar magic token `complete_pet_info` y enviar email.
- `MemberDetailModal` muestra panel y boton de envio cuando el miembro tiene `registrationIssue` de recuperacion.
- Registro V2 respeta `complete_pet_info`: paso 2 si no hay mascota basica, paso 5 si ya hay evidencia de mascota.
- QA ejecutado: tests unitarios, type-check, lint y build.
