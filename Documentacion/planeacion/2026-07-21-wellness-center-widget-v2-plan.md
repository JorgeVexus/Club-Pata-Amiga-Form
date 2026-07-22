# Wellness Center Widget V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernizar el widget público de Centros de Bienestar con el sistema visual V2 sin cambiar sus contratos, integraciones ni capacidades actuales.

**Architecture:** Se conservarán las funciones de datos, mutaciones y eventos del widget actual. La migración añadirá un shell V2, componentes de presentación reutilizables y renderizadores por estado, manteniendo las mismas API Routes y payloads. Las pruebas de caracterización protegerán primero los flujos existentes y luego validarán la nueva estructura visual.

**Tech Stack:** JavaScript embebible, CSS aislado, Memberstack DOM, Next.js API Routes, Node Test Runner.

---

## Estado de ejecución

Implementación completada el 21 de julio de 2026 sobre `main`, sin commit ni push.

- Contratos funcionales caracterizados y protegidos.
- Configuración API dinámica incorporada con fallback productivo.
- Shell, estados, dashboard, formularios, tablas y modales alineados al sistema V2.
- Preview productivo creado con los cinco estados seleccionables.
- Revisión responsive completada en 1440×900, 768×1024 y 390×844.
- Siete pruebas relacionadas aprobadas.
- TypeScript y build aprobados.
- ESLint de los archivos modificados: 0 errores; 11 advertencias heredadas del widget.
- `git diff --check` aprobado.

---

## Mapa de archivos

- `public/widgets/wellness-center-widget.js`: implementación productiva; conserva datos y acciones, incorpora renderizado y estilos V2.
- `public/widgets/wellness-center-widget-v2-preview.html`: preview local del script productivo con selector de escenarios.
- `tests/wellness-center-widget-v2.test.mjs`: caracterización de contratos, estados, diseño V2, seguridad y responsive.
- `tests/wellness-center-widget-pending.test.mjs`: prueba existente del perfil complementario pendiente; no debe dejar de pasar.
- `tests/wellness-center-locations.test.mjs`: prueba existente de sucursales; no debe dejar de pasar.
- `tests/wellness-location-photos.test.mjs`: prueba existente de fotografías; no debe dejar de pasar.
- `tests/wellness-legal-name-edit.test.mjs`: prueba existente de razón social; no debe dejar de pasar.
- `tests/wellness-bank-details-and-appointments-copy.test.mjs`: prueba existente de datos bancarios y citas; no debe dejar de pasar.

### Task 1: Congelar contratos funcionales

**Files:**
- Create: `tests/wellness-center-widget-v2.test.mjs`
- Read: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Crear una prueba de caracterización que lea el widget**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');

const requiredFunctions = [
  'fetchCenterData',
  'updateAppointmentStatus',
  'cancelAccount',
  'submitAppeal',
  'renderPending',
  'renderRejected',
  'renderAppealed',
  'renderDashboard',
  'showPaymentsModal',
  'showAppointmentsModal',
  'showExitModal',
  'handleLogoUpload',
  'bindEditProfileForm',
  'showEditProfileModal'
];

for (const name of requiredFunctions) {
  assert.match(source, new RegExp(`function ${name}\\(`), `${name} must remain available`);
}
```

- [ ] **Step 2: Proteger endpoints y estados existentes**

```js
for (const endpoint of [
  '/api/wellness/me',
  '/api/wellness/update',
  '/api/wellness/cancel',
  '/api/wellness/appointments/',
  '/api/wellness/appointments/upload-evidence',
  '/api/upload/wellness-logo',
  '/api/upload/wellness-location-photo'
]) {
  assert.ok(source.includes(endpoint), `${endpoint} contract must remain available`);
}

for (const status of ['pending', 'approved', 'rejected', 'appealed', 'cancelled']) {
  assert.ok(source.includes(`'${status}'`), `${status} state must remain supported`);
}
```

- [ ] **Step 3: Proteger el patrón API-first y configuración externa**

```js
assert.ok(source.includes('window.PATA_AMIGA_CONFIG'), 'widget must support dynamic external configuration');
assert.ok(!source.includes('createClient('), 'widget must not initialize Supabase in the browser');
assert.ok(!source.includes('@supabase/supabase-js'), 'widget must not ship the Supabase client');
```

- [ ] **Step 4: Ejecutar la caracterización**

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: FAIL únicamente si la configuración dinámica todavía no está implementada; el resto de contratos debe pasar.

### Task 2: Incorporar tokens y shell V2

**Files:**
- Modify: `tests/wellness-center-widget-v2.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Agregar assertions de tokens y estructura**

```js
for (const token of ['#F8F5EE', '#21BCAF', '#1E5D57', '#E5F5F2', '#FE8F15', '#153F3B', '#4E6865', '#8A9692', '#ECE7DD']) {
  assert.ok(source.toUpperCase().includes(token.toUpperCase()), `V2 token ${token} must be present`);
}

for (const className of ['wc-v2-shell', 'wc-v2-sidebar', 'wc-v2-main', 'wc-v2-mobile-nav']) {
  assert.ok(source.includes(className), `${className} must be rendered`);
}
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo V2**

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: FAIL indicando que faltan tokens o clases `wc-v2-*`.

- [ ] **Step 3: Añadir tokens CSS aislados y helpers de iconos**

Agregar en `STYLES` un bloque `.wc-v2-shell` con las variables aprobadas y selectores exclusivamente prefijados por `wc-v2-`. Añadir SVGs inline con `aria-hidden="true"`; no añadir dependencias externas ni emojis nuevos.

- [ ] **Step 4: Implementar el shell común**

Crear helpers de presentación:

```js
function renderV2Shell({ center, activeView, content, locked = false }) {
  return `
    <div class="wc-v2-shell${locked ? ' is-locked' : ''}">
      ${renderV2Sidebar(center, activeView, locked)}
      <main class="wc-v2-main">${renderV2MobileNav(activeView, locked)}${content}</main>
    </div>`;
}
```

La navegación bloqueada solo mostrará el estado de la solicitud; la aprobada mostrará dashboard, citas, reintegros y perfil.

- [ ] **Step 5: Repetir prueba y sintaxis**

Run: `node --check public/widgets/wellness-center-widget.js`

Expected: sin salida y exit code 0.

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: PASS para tokens, configuración y shell.

### Task 3: Migrar estados pendiente, rechazado, apelado y cancelado

**Files:**
- Modify: `tests/wellness-center-widget-v2.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Probar estructura y acciones de estados**

```js
for (const className of ['wc-v2-state-card', 'wc-v2-status', 'wc-v2-reason', 'wc-v2-appeal-form']) {
  assert.ok(source.includes(className), `${className} must exist`);
}

assert.ok(source.includes('submitAppeal(center.memberstack_id'), 'rejected state must retain appeal submission');
assert.ok(source.includes("status: 'appealed'"), 'appeal must retain status transition');
assert.ok(source.includes('renderEditProfileForm(center'), 'pending state must retain complementary profile editing');
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo de presentación**

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: FAIL por clases V2 de estados ausentes.

- [ ] **Step 3: Migrar los cuatro renderizadores**

Actualizar `renderPending`, `renderRejected`, `renderAppealed` y `renderBlocked` para usar `renderV2Shell`. Mantener los mismos ids utilizados por listeners (`wc-pending-profile-form`, `wc-appeal-text`, `btn-submit-appeal`) y las llamadas actuales a `bindEditProfileForm` y `submitAppeal`.

- [ ] **Step 4: Añadir comunicación de errores inline**

En el flujo de apelación, reemplazar `alert` como única respuesta de error por un elemento `role="alert"` dentro de `.wc-v2-form-feedback`; mantener el botón deshabilitado mientras la petición esté activa.

- [ ] **Step 5: Verificar estados y regresiones existentes**

Run: `node --test tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs`

Expected: todas las pruebas pasan.

### Task 4: Migrar el dashboard aprobado

**Files:**
- Modify: `tests/wellness-center-widget-v2.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Probar los accesos funcionales del dashboard**

```js
for (const id of ['btn-view-appointments', 'btn-view-payments', 'btn-edit-profile', 'wc-btn-exit']) {
  assert.ok(source.includes(`id="${id}"`), `${id} must remain available`);
  assert.ok(source.includes(`querySelector('#${id}')`), `${id} must remain bound`);
}

for (const className of ['wc-v2-kpi-grid', 'wc-v2-dashboard-grid', 'wc-v2-request-list', 'wc-v2-profile-summary']) {
  assert.ok(source.includes(className), `${className} must exist`);
}
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo visual**

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: FAIL por módulos V2 del dashboard ausentes.

- [ ] **Step 3: Migrar `renderDashboard`**

Renderizar encabezado, estado de publicación, KPIs, solicitudes recientes y resumen de perfil dentro del shell. Los botones conservarán los ids y listeners actuales. Los valores se derivarán de `center.appointments`, `center.payments` y datos existentes sin inventar métricas.

- [ ] **Step 4: Mantener bienvenida posterior a aprobación**

Conservar la condición:

```js
if (!center.welcome_shown && center.status === 'approved') {
  showWelcomeModal(center);
}
```

Actualizar únicamente el markup y CSS del modal.

- [ ] **Step 5: Verificar dashboard y sintaxis**

Run: `node --check public/widgets/wellness-center-widget.js`

Expected: exit code 0.

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: PASS.

### Task 5: Migrar modales operativos y formularios

**Files:**
- Modify: `tests/wellness-center-widget-v2.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Proteger ids, campos y payloads de perfil**

```js
for (const marker of [
  'wc-edit-profile-form',
  'btn-get-location',
  'btn-select-logo',
  'btn-add-location',
  'btn-save-profile',
  'bank_name',
  'bank_clabe',
  'locations:',
  'photo_urls'
]) {
  assert.ok(source.includes(marker), `${marker} must remain in profile flow`);
}
```

- [ ] **Step 2: Ejecutar pruebas existentes antes de editar**

Run: `node --test tests/wellness-center-locations.test.mjs tests/wellness-location-photos.test.mjs tests/wellness-legal-name-edit.test.mjs tests/wellness-bank-details-and-appointments-copy.test.mjs`

Expected: PASS.

- [ ] **Step 3: Migrar perfil y sucursales**

Actualizar `renderEditProfileForm`, `renderBranchCard` y `showEditProfileModal` con clases V2, sin cambiar `name`, `id`, `data-*`, serialización, uploads ni binding.

- [ ] **Step 4: Migrar citas y reintegros**

Actualizar `showAppointmentsModal` y `showPaymentsModal`. Conservar tabs, `data-id`, `data-action`, carga de evidencia y llamadas a `updateAppointmentStatus`.

- [ ] **Step 5: Migrar cancelación y bienvenida**

Actualizar `showExitModal` y `showWelcomeModal`. Mantener sus pasos, motivos, confirmación y llamadas actuales.

- [ ] **Step 6: Ejecutar regresión de wellness**

Run: `node --test tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs tests/wellness-center-locations.test.mjs tests/wellness-location-photos.test.mjs tests/wellness-legal-name-edit.test.mjs tests/wellness-bank-details-and-appointments-copy.test.mjs tests/wellness-admin-profile-notifications.test.mjs`

Expected: todas las pruebas pasan.

### Task 6: Configuración dinámica y endurecimiento de seguridad

**Files:**
- Modify: `tests/wellness-center-widget-v2.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Probar resolución segura de configuración**

```js
assert.ok(source.includes('window.PATA_AMIGA_CONFIG'), 'dynamic config must be read');
assert.ok(source.includes("'https://app.pataamiga.mx'"), 'production fallback must remain');
assert.ok(source.includes('escapeHtml'), 'API strings must be escaped before HTML insertion');
```

- [ ] **Step 2: Implementar configuración con respaldo**

```js
const runtimeConfig = window.PATA_AMIGA_CONFIG || {};
const CONFIG = {
  API_BASE_URL: runtimeConfig.API_BASE_URL || runtimeConfig.apiBaseUrl || 'https://app.pataamiga.mx',
  DEBUG: Boolean(runtimeConfig.DEBUG)
};
```

- [ ] **Step 3: Escapar campos provenientes de API**

Usar `escapeHtml` en nombre, dirección, teléfono, servicios, motivo de rechazo, mensajes y valores mostrados en tarjetas o modales. No escapar valores usados para cálculos; escapar únicamente al interpolarlos en HTML.

- [ ] **Step 4: Ejecutar pruebas de seguridad y sintaxis**

Run: `node --test tests/wellness-center-widget-v2.test.mjs`

Expected: PASS.

Run: `node --check public/widgets/wellness-center-widget.js`

Expected: exit code 0.

### Task 7: Preview real y revisión responsive

**Files:**
- Create: `public/widgets/wellness-center-widget-v2-preview.html`
- Modify: `tests/wellness-center-widget-v2.test.mjs`

- [ ] **Step 1: Crear un preview que cargue el script productivo**

El documento debe incluir el contenedor real, `window.PATA_AMIGA_CONFIG`, un mock de Memberstack y respuestas mock para las API Routes. Un selector por query string (`?status=approved`, `pending`, `rejected`, `appealed`, `cancelled`) devolverá el centro de ejemplo correspondiente sin duplicar el markup del widget.

- [ ] **Step 2: Probar que el preview usa el script productivo**

```js
const preview = fs.readFileSync('public/widgets/wellness-center-widget-v2-preview.html', 'utf8');
assert.ok(preview.includes('wellness-center-widget.js'));
assert.ok(preview.includes('PATA_AMIGA_CONFIG'));
for (const status of ['approved', 'pending', 'rejected', 'appealed', 'cancelled']) {
  assert.ok(preview.includes(status));
}
```

- [ ] **Step 3: Revisar escritorio y móvil**

Validar visualmente 1440×900, 768×1024 y 390×844. Confirmar que no existen desbordamientos horizontales, controles cortados, modales fuera del viewport ni navegación inaccesible.

- [ ] **Step 4: Verificar interacción**

Ejercitar edición de perfil, apertura de citas, reintegros, apelación, cambio de tabs, uploads simulados y cancelación sin errores de consola.

### Task 8: QA sistemática y entrega

**Files:**
- Modify: `Documentacion/planeacion/2026-07-21-wellness-center-widget-v2-plan.md`

- [ ] **Step 1: Auditoría de regresiones**

Revisar `git diff` buscando cambios de endpoints, ids, nombres de campos, payloads, estados o listeners. Corregir cualquier divergencia no justificada.

- [ ] **Step 2: Búsqueda activa de errores**

Revisar valores nulos, listas vacías, errores HTTP, doble submit, cierre de modales, falta de Memberstack, fotografías malformadas y datos largos.

- [ ] **Step 3: Ejecutar suite relacionada**

Run: `node --test tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs tests/wellness-center-locations.test.mjs tests/wellness-location-photos.test.mjs tests/wellness-legal-name-edit.test.mjs tests/wellness-bank-details-and-appointments-copy.test.mjs tests/wellness-admin-profile-notifications.test.mjs`

Expected: todas las pruebas pasan.

- [ ] **Step 4: Ejecutar gates obligatorios**

Run: `npm run type-check`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

Run: `npm run lint`

Expected: exit code 0 o deuda preexistente documentada con evidencia.

- [ ] **Step 5: Verificar el diff**

Run: `git diff --check`

Expected: sin errores de whitespace.

- [ ] **Step 6: Marcar tareas completadas y entregar preview**

Actualizar las casillas de este documento, resumir archivos y pruebas, proporcionar la URL local y solicitar autorización antes de cualquier commit o push.
