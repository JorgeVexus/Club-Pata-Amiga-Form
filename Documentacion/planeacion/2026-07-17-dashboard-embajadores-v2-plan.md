# Dashboard independiente de Embajadores V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el widget independiente de Embajadores con el estándar visual de `/embajador`, conservando todos sus contratos de datos, acciones y comunicación administrativa.

**Architecture:** `ambassador-widget.js` conservará su inicialización y capa de servicios existente, pero incorporará un estado de vista y renderizadores V2 para Resumen, Métricas, Materiales y Mi cuenta. El preview seguirá cargando el mismo widget con datos simulados y las pruebas estáticas fijarán endpoints, acciones y separación de roles para evitar regresiones.

**Tech Stack:** JavaScript ES2020, Memberstack DOM, Next.js API Routes, Supabase Realtime existente, CSS aislado, Node Test Runner.

---

### Task 1: Fijar contratos del dashboard V2

**Files:**
- Create: `tests/widgets/ambassador-dashboard-v2.test.js`
- Modify: `public/widgets/ambassador-widget.js`

- [ ] **Step 1: Escribir pruebas fallidas de navegación y shell**

Exigir los selectores `amb-v2-shell`, `amb-v2-tabs`, `amb-v2-code-card`, `amb-v2-kpis`, `amb-v2-referrals`, las cuatro vistas internas y `setAmbassadorV2View`.

- [ ] **Step 2: Escribir pruebas fallidas de contratos funcionales**

Exigir que permanezcan las rutas de perfil, payouts, messages, materials, upload, code change y cancelación. Exigir también el enlace externo actual del dashboard de embajadores y ausencia de un nuevo cliente Supabase.

- [ ] **Step 3: Confirmar RED**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Expected: FAIL porque el shell y la navegación V2 aún no existen.

### Task 2: Shell, navegación y Resumen

**Files:**
- Modify: `public/widgets/ambassador-widget.js`
- Modify: `public/widgets/ambassador-widget-preview.html`
- Test: `tests/widgets/ambassador-dashboard-v2.test.js`

- [ ] **Step 1: Añadir estado de vista idempotente**

Crear `ambassadorV2View = 'summary'`, `setAmbassadorV2View(view)` y una lista cerrada de valores `summary`, `metrics`, `materials`, `account`.

- [ ] **Step 2: Crear el shell V2 aprobado**

Renderizar header, navegación por pills, fondo crema y contenedor central. Mantener el widget independiente y el mismo punto de montaje.

- [ ] **Step 3: Crear el Resumen**

Renderizar banner condicional de membresía, tarjeta de código, KPIs y referidos recientes usando los datos ya normalizados por `renderApproved`.

- [ ] **Step 4: Conservar acciones del código**

Reutilizar copiar, compartir, personalizar, solicitar cambio y estados de error existentes; no duplicar llamadas de red.

- [ ] **Step 5: Confirmar GREEN parcial**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Expected: PASS para shell, navegación, resumen y contratos.

### Task 3: Métricas y Materiales

**Files:**
- Modify: `public/widgets/ambassador-widget.js`
- Test: `tests/widgets/ambassador-dashboard-v2.test.js`

- [ ] **Step 1: Escribir pruebas fallidas de vistas secundarias**

Exigir renderizadores `renderAmbassadorV2Metrics` y `renderAmbassadorV2Materials`, filtros por estado y por tipo de recurso.

- [ ] **Step 2: Implementar Métricas**

Presentar métricas completas, filtros y lista de referidos con nombre, correo, fecha, comisión y estado usando `recent_referrals` y contadores existentes.

- [ ] **Step 3: Implementar Materiales**

Presentar filtros y recursos existentes de `/api/ambassador-materials`, incluyendo newsletters, imágenes, PDFs, videos y otros.

- [ ] **Step 4: Ejecutar pruebas**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Expected: PASS.

### Task 4: Mi cuenta y datos bancarios

**Files:**
- Modify: `public/widgets/ambassador-widget.js`
- Test: `tests/widgets/ambassador-dashboard-v2.test.js`

- [ ] **Step 1: Escribir pruebas fallidas de cuenta**

Exigir `renderAmbassadorV2Account`, inputs de perfil, foto, banco, CLABE, controles de código y cancelación.

- [ ] **Step 2: Reorganizar formularios existentes**

Mantener los IDs y funciones globales actuales para editar perfil, subir foto, guardar banco/CLABE, cambiar código y cancelar; cambiar solamente contenedores y clases.

- [ ] **Step 3: Mantener validación bancaria**

Conservar CLABE de 18 dígitos, detección existente y selección manual del banco.

- [ ] **Step 4: Ejecutar pruebas**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Expected: PASS.

### Task 5: Estados y chat administrativo

**Files:**
- Modify: `public/widgets/ambassador-widget.js`
- Test: `tests/widgets/ambassador-dashboard-v2.test.js`

- [ ] **Step 1: Escribir pruebas fallidas de estados**

Exigir representaciones V2 para no embajador, pendiente, rechazado, cancelado y aprobado sin código.

- [ ] **Step 2: Rediseñar estados sin alterar acciones**

Mantener registro, reenvío, reintento y enlaces existentes; aplicar tarjetas, tipografía y mensajes actuales.

- [ ] **Step 3: Rediseñar chat**

Mantener los endpoints, `senderRole: 'ambassador'`, marcado de lectura, contador y suscripción realtime; cambiar solamente burbuja, modal, lista e input.

- [ ] **Step 4: Ejecutar pruebas**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Expected: PASS.

### Task 6: Preview responsive y verificación

**Files:**
- Modify: `public/widgets/ambassador-widget-preview.html`
- Modify: `Documentacion/planeacion/2026-07-17-dashboard-embajadores-v2-plan.md`

- [ ] **Step 1: Actualizar escenarios del preview**

Permitir revisar aprobado, pendiente, rechazado, sin código, sin banco, sin referidos, con referidos y materiales.

- [ ] **Step 2: Auditar responsive y accesibilidad**

Verificar desktop, móvil, pills desplazables, foco visible, teclado, reduced motion y ausencia de scroll horizontal.

- [ ] **Step 3: Buscar regresiones y caracteres dañados**

Run: `node --check public/widgets/ambassador-widget.js`

Run: `rg -n "Ã|Â|â|ðŸ" tests/widgets/ambassador-dashboard-v2.test.js Documentacion/planeacion/2026-07-17-dashboard-embajadores-v2-*.md`

Expected: sintaxis válida y ninguna cadena nueva visible dañada.

- [ ] **Step 4: Ejecutar controles obligatorios**

Run: `node --test tests/widgets/ambassador-dashboard-v2.test.js`

Run: `npm run type-check`

Run: `npm run build`

Run: `npm run lint`

Expected: pruebas, type-check y build con exit 0; lint sin errores nuevos atribuibles al widget.

- [ ] **Step 5: Entregar preview local**

URL: `http://127.0.0.1:3000/widgets/ambassador-widget-preview.html?v=dashboard-v2`

Esperar revisión y autorización explícita antes de commit o push.
