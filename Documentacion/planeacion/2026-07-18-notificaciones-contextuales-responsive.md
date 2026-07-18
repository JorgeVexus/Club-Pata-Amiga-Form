# Notificaciones contextuales y responsive - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el panel móvil de notificaciones y hacer que cada aviso abra la vista funcional correspondiente sin depender de rutas obsoletas.

**Architecture:** El widget conservará el renderizado actual y añadirá un resolvedor puro de acciones basado en `metadata`, con traducción de enlaces históricos y un modal seguro como fallback. Los productores activos guardarán acciones canónicas; las vistas internas existentes de mascotas, chat y reintegros serán reutilizadas.

**Tech Stack:** JavaScript de widget público, Next.js API Routes, TypeScript, Supabase server-side, CSS embebido y pruebas Node `node:test`.

---

### Task 1: Contrato de resolución de acciones

**Files:**
- Create: `public/widgets/notification-action-resolver.js`
- Create: `tests/widgets/notification-action-resolver.test.js`

- [ ] Escribir pruebas fallidas para `open_pet_chat`, `open_pet`, `open_reimbursement`, `show_detail`, traducción de enlaces históricos y bloqueo de destinos inseguros.
- [ ] Ejecutar `node --test tests/widgets/notification-action-resolver.test.js` y confirmar que falla porque el módulo aún no existe.
- [ ] Implementar un resolvedor UMD puro que normalice metadata, IDs y URLs sin acceder al DOM.
- [ ] Repetir la prueba y confirmar que todos los casos pasan.

### Task 2: Panel móvil resistente a estilos de Webflow

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [ ] Añadir assertions fallidas para `height:auto`, `min-height`, `white-space:normal`, `min-width:0`, `overflow-wrap`, ancho móvil y scroll basado en `100dvh`.
- [ ] Ejecutar `node --test tests/widgets/unified-membership-dashboard-v2.test.js` y confirmar el fallo esperado.
- [ ] Ajustar únicamente los estilos del panel, tarjetas, texto y fecha conservando la identidad visual V2.
- [ ] Repetir la prueba y confirmar que pasa.

### Task 3: Acciones internas y modal informativo

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Create: `tests/widgets/member-notification-actions-v2.test.js`

- [ ] Escribir pruebas fallidas que exijan carga del resolvedor, apertura de expediente/chat de mascota, detalle de reintegro y modal informativo.
- [ ] Ejecutar `node --test tests/widgets/member-notification-actions-v2.test.js` y confirmar el fallo esperado.
- [ ] Cargar el resolvedor desde el widget y añadir métodos para ejecutar la acción, enfocar el chat, abrir el reintegro y renderizar un modal escapado.
- [ ] Mantener el marcado como leído independiente; ante cualquier fallo operativo abrir el modal informativo.
- [ ] Repetir las pruebas nuevas y las del dashboard V2.

### Task 4: Metadata canónica en productores activos

**Files:**
- Modify: `src/app/api/admin/members/[id]/request-info/route.ts`
- Modify: `src/app/api/admin/members/[id]/appeal-response/route.ts`
- Modify: `src/app/api/admin/members/[id]/pets/[petId]/status/route.ts`
- Modify: `src/app/api/admin/solidarity/update/route.ts`
- Modify: `src/app/api/solidarity/[requestId]/messages/route.ts` (o productor equivalente localizado por auditoría)
- Modify: `src/app/api/admin/members/[id]/approve/route.ts`
- Modify: `src/app/api/admin/members/[id]/reject/route.ts`
- Create: `tests/widgets/member-notification-producers.test.js`

- [ ] Escribir assertions fallidas para las acciones e identificadores canónicos de cada productor.
- [ ] Ejecutar la prueba y confirmar que falla por metadata faltante o enlaces antiguos.
- [ ] Actualizar los productores sin cambiar su lógica de negocio, permisos ni persistencia.
- [ ] Repetir la prueba y comprobar compatibilidad con los tipos existentes.

### Task 5: Preview funcional y regresión

**Files:**
- Modify: `public/widgets/dashboard-v2-preview.html`
- Modify: `tests/widgets/member-notification-actions-v2.test.js`

- [ ] Añadir al modo preview notificaciones de mascota/chat, reintegro y detalle general con datos representativos.
- [ ] Comprobar manualmente el panel a 375 px y desktop, incluyendo scroll, textos largos y fecha.
- [ ] Verificar que marcar una y todas como leídas sigue funcionando.
- [ ] Ejecutar todas las pruebas específicas de widgets modificados.

### Task 6: Puerta de calidad obligatoria

**Files:**
- Modify: `Documentacion/planeacion/2026-07-18-notificaciones-contextuales-responsive.md`

- [ ] Auditar regresiones en navegación, modal de mascota, chat y reintegros.
- [ ] Buscar caracteres mojibake nuevos y enlaces obsoletos restantes en productores activos.
- [ ] Ejecutar `npm run type-check`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Marcar el plan terminado, enviar notificación Telegram y entregar URL local para revisión antes de solicitar permiso de commit/push.
