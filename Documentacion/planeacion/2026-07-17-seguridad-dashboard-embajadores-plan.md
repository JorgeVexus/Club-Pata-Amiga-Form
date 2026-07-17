# Seguridad del Dashboard de Embajadores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger todas las operaciones del dashboard de embajadores y limitar los referidos a datos enmascarados.

**Architecture:** El widget entrega el JWT de Memberstack; un helper server-side lo verifica con Memberstack Admin REST y resuelve el embajador propietario. Una API autenticada sirve el dashboard y actualiza exclusivamente campos permitidos; las rutas de acciones reutilizan el helper.

**Tech Stack:** Next.js Route Handlers, TypeScript, Memberstack Admin REST, Supabase Admin, JavaScript embebible, Node test runner.

---

### Task 1: Contratos de privacidad y autorización

**Files:**
- Create: `tests/widgets/ambassador-dashboard-security.test.js`
- Create: `src/lib/ambassador-auth.ts`

- [ ] Escribir pruebas que exijan JWT, verificación Memberstack y comparación con `linked_memberstack_id`.
- [ ] Ejecutar `node --test tests/widgets/ambassador-dashboard-security.test.js` y confirmar fallo por implementación ausente.
- [ ] Implementar `verifyMemberstackRequest` y `getOwnedAmbassador` con respuestas 401/403.
- [ ] Repetir la prueba hasta obtener PASS.

### Task 2: API autenticada del dashboard y referidos mínimos

**Files:**
- Create: `src/app/api/ambassadors/dashboard/route.ts`
- Modify: `src/app/api/ambassadors/by-memberstack/route.ts`
- Test: `tests/widgets/ambassador-dashboard-security.test.js`

- [ ] Agregar prueba RED para la proyección `{ id, masked_name, plan, commission_amount, commission_status, created_at }`.
- [ ] Implementar GET autenticado, conteos y `maskReferredName` con formato `M***** G*****`.
- [ ] Implementar PATCH limitado a perfil, redes, banco, CLABE y foto.
- [ ] Eliminar el spread de referidos en `by-memberstack` y repetir pruebas.

### Task 3: Proteger acciones conectadas a administración

**Files:**
- Modify: `src/app/api/ambassadors/[id]/request-code-change/route.ts`
- Modify: `src/app/api/ambassadors/[id]/cancel/route.ts`
- Modify: `src/app/api/ambassadors/[id]/payouts/route.ts`
- Modify: `src/app/api/ambassadors/[id]/messages/route.ts`
- Test: `tests/widgets/ambassador-dashboard-security.test.js`

- [ ] Agregar pruebas RED que exijan propiedad en cada ruta.
- [ ] Reutilizar `getOwnedAmbassador` antes de leer o mutar.
- [ ] En cambio de código, crear notificación administrativa si falta permiso y enviar correo si existe.
- [ ] Mantener autenticación administrativa del chat para mensajes `senderRole=admin`.

### Task 4: Migrar el widget al contrato autenticado

**Files:**
- Modify: `public/widgets/ambassador-widget.js`
- Modify: `public/widgets/ambassador-widget-v2-preview.html`
- Test: `tests/widgets/ambassador-dashboard-v2.test.js`

- [ ] Agregar pruebas RED para `getMemberCookie`, header Bearer, endpoint dashboard y nombres enmascarados.
- [ ] Crear `ambassadorApiFetch`, migrar carga, perfil, banco, código, cancelación, pagos y chat.
- [ ] Corregir historial para usar `/api/ambassadors/[id]/payouts`.
- [ ] Actualizar mocks del preview y verificar navegación/acciones sin llamadas externas.

### Task 5: QA y entrega local

**Files:**
- Verify: all files above

- [ ] Ejecutar `node --check public/widgets/ambassador-widget.js`.
- [ ] Ejecutar las pruebas de widgets.
- [ ] Ejecutar `npm run type-check`, `npm run build` y `npm run lint`.
- [ ] Confirmar HTTP 200 del preview local y revisar que no exista `supabase.createClient` en el widget.
- [ ] Presentar resumen y solicitar autorización separada antes de commit/push.
