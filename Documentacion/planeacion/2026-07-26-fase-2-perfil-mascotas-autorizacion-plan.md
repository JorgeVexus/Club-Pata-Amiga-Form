# Fase 2 — Autorización de perfil y mascotas

Fecha: 2026-07-26
Estado: en ejecución

## Objetivo

Eliminar la confianza en identificadores enviados por el navegador en las operaciones de perfil y mascotas, actualizando API y consumidor en el mismo lote para preservar los flujos activos.

## Principios de compatibilidad

1. Memberstack continúa como proveedor de sesión.
2. El servidor deriva la identidad del JWT mediante `requireMemberActor`.
3. Los IDs del body o query solo se aceptan como comprobación de coincidencia, nunca como autenticación.
4. Los magic links siguen funcionando sin sesión, pero únicamente con token firmado, expiración, miembro y mascota vinculados.
5. Cada lote incluye primero pruebas negativas, después API, después widgets y finalmente regresión.

## Inventario inicial

### Sesión normal: migración directa

- `POST /api/user/change-plan`
- `POST /api/user/welcome-shown`
- `POST /api/user/appeal`
- `POST /api/user/add-pet`
- `POST /api/user/update-profile`
- `GET|POST /api/user/preferences`
- `POST /api/user/pets/[petId]/update`
- `POST /api/user/pets/add`
- `POST /api/user/chat/send`
- `POST /api/user/emergency`
- Lecturas relacionadas: `appeal-history`, perfil y datos de mascotas.

### Doble modo: sesión o magic link

- `POST /api/user/update-pet-docs`
- `POST /api/user/fulfill-request`

Estas rutas deben aceptar:

- sesión válida del propietario; o
- token de carga válido, no expirado y vinculado al miembro, `petIndex` y mascota esperados.

## Consumidores identificados

- `user-profile-widget.js`
- `user-settings-widget.js`
- `complete-profile-widget.js`
- `pet-cards-widget.js`
- `unified-membership-widget.js`
- `appeal-widget.js`
- `emergency-button-widget.js`
- `src/app/completar-documentacion/page.tsx`

## Lotes de implementación

### Lote A — Preferencias y bienvenida

Operaciones idempotentes y de impacto reducido. Añadir Bearer en widgets y resolver al actor antes de leer o actualizar.

### Lote B — Perfil y chat/apelación

Proteger datos personales, mensajes y expedientes. Verificar además que `petId` pertenece al usuario autenticado.

### Lote C — Altas y ediciones de mascotas

Proteger cupos, creación, edición y documentos. Mantener las reglas actuales de carencia y estados.

### Lote D — Plan y emergencia

Proteger cambios de Stripe/Memberstack y registros de emergencia. Añadir idempotencia donde exista riesgo de doble clic o reintento.

### Lote E — Magic links y cargas

Separar explícitamente autorización por sesión de autorización temporal. Añadir pruebas de expiración, identidad cruzada y mascota cruzada.

## Pruebas mínimas por ruta

- Sin token: `401`.
- Token inválido: `401`.
- Token válido de otro usuario: `403`.
- Recurso de otra mascota: `403` o `404` sin filtrar datos.
- Propietario válido: conserva el contrato de respuesta vigente.
- Magic link válido: funciona sin sesión únicamente en las rutas permitidas.
- Magic link expirado o cruzado: rechazo antes de Storage o base de datos.

## Compuerta final

- Suite completa.
- `npm run type-check`.
- `npm run lint`.
- `npm run build`.
- Matriz de autorización actualizada.
- Pruebas manuales en staging antes del despliegue productivo.
