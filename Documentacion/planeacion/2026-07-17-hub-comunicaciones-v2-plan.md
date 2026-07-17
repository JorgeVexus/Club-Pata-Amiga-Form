# Hub de Comunicaciones V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar las cuatro vistas del Hub de Comunicaciones al lenguaje del Admin V2 sin cambiar lógica, props, permisos ni endpoints.

**Architecture:** Se conserva `CommunicationsHub` como orquestador de pestañas y los cuatro componentes funcionales actuales. La adaptación se realiza mediante markup semántico mínimo y CSS Modules propios, con pruebas estáticas que protegen los contratos y bloquean el regreso de estilos brutalistas o texto corrupto.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Node test runner.

---

### Task 1: Protección de contratos y diseño

**Files:**
- Create: `tests/admin/communications-hub-v2.test.js`
- Modify: `src/components/Admin/Communications/CommunicationsHub.tsx`

- [ ] **Step 1: Write the failing tests**

Comprobar que las pestañas continúan montando `MessageSender`, `TemplateManager`, `CommHistory` y `AmbassadorMaterialsManager`; que se conservan `audience`, `prefill`, `adminName` e `isSuperAdmin`; y que no quedan secuencias mojibake en el encabezado.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: FAIL por falta de marcadores V2 e iconos seguros.

- [ ] **Step 3: Implement the V2 hub shell**

Agregar descripción contextual, navegación con `role="tablist"`, estados `aria-selected`, iconos CSS seguros y panel de contenido etiquetado, sin alterar la máquina de estado `activeTab`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: PASS.

### Task 2: Shell, encabezado y tabs

**Files:**
- Modify: `src/components/Admin/Communications/CommunicationsHub.module.css`

- [ ] **Step 1: Add V2 visual assertions**

Verificar uso de Outfit/Fraiche, borde cálido de un píxel, tabs segmentados, foco visible y breakpoint móvil.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: FAIL en selectores visuales.

- [ ] **Step 3: Implement styles**

Aplicar encabezado sin tarjeta adicional, etiqueta de audiencia, superficie segmentada para tabs, contenido fluido y adaptación móvil.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: PASS.

### Task 3: Enviar mensaje y vista previa

**Files:**
- Modify: `src/components/Admin/Communications/MessageSender.module.css`

- [ ] **Step 1: Add failing visual assertions**

Proteger cuadrícula de formulario/vista previa, superficies suaves, controles de 40 píxeles, botones sin bordes negros y responsive de una columna.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement scoped CSS**

Reutilizar las clases existentes del componente para no modificar búsquedas, plantillas, contenido, correo ni WhatsApp.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: PASS.

### Task 4: Plantillas, historial y materiales

**Files:**
- Modify: `src/components/Admin/Communications/TemplateManager.module.css`
- Modify: `src/components/Admin/Communications/CommHistory.module.css`
- Inspect and style through existing selectors: `src/components/Admin/Communications/AmbassadorMaterialsManager.tsx`

- [ ] **Step 1: Add failing assertions for all internal views**

Verificar superficies, tablas, filtros, acciones, estados vacíos y ausencia de bordes/sombras brutalistas.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement component-level styles**

Actualizar exclusivamente los estilos y, si Materiales usa estilos inline, reemplazarlos por clases sin cambiar handlers ni llamadas API.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `node --test tests/admin/communications-hub-v2.test.js`
Expected: PASS.

### Task 5: Regression and production gate

**Files:**
- Test: `tests/admin/communications-hub-v2.test.js`
- Test: `tests/admin/admin-v2-shell.test.js`

- [ ] **Step 1: Run both test suites**

Run: `node --test tests/admin/communications-hub-v2.test.js tests/admin/admin-v2-shell.test.js`
Expected: all tests PASS.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: exit 0.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors; historical warnings allowed.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: optimized build completes and `/admin/dashboard` is generated.

- [ ] **Step 5: Present local review URL**

Use: `http://127.0.0.1:3000/admin/dashboard`
No commit or push until explicit user authorization.
