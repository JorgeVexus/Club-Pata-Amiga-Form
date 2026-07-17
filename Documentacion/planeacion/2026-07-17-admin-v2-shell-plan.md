# Admin V2 Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. This repository requires direct work on `main`; do not create a branch or worktree. Do not commit or push without explicit user authorization.

**Goal:** Revestir el dashboard administrativo actual con el diseño de `/admin` del repositorio clonado y añadir un resumen basado únicamente en métricas reales, sin alterar sus contratos funcionales.

**Architecture:** `AdminDashboard` continúa orquestando sesión, permisos, datos, rutas profundas y modales. Los nuevos componentes son presentacionales y reciben métricas, contadores y callbacks existentes. Las pantallas internas actuales se montan dentro del nuevo shell sin reescribir su lógica.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Memberstack, Supabase server-side, Node test runner.

---

## Mapa de archivos

- Crear `src/components/Admin/V2/AdminOverview.tsx`: resumen y accesos a colas.
- Crear `src/components/Admin/V2/AdminOverview.module.css`: layout y estados del resumen.
- Crear `src/components/Admin/V2/AdminLoadingShell.tsx`: skeleton durante autenticación.
- Crear `src/components/Admin/V2/AdminLoadingShell.module.css`: skeleton responsive.
- Crear `public/admin-v2-preview.html`: preview aislado, sin mutaciones ni APIs.
- Crear `tests/admin/admin-v2-shell.test.js`: pruebas de contratos visuales y funcionales.
- Modificar `src/components/Admin/AdminDashboard.tsx`: integrar shell y overview.
- Modificar `src/components/Admin/AdminDashboard.module.css`: layout crema y contenido.
- Modificar `src/components/Admin/Sidebar.tsx` y `.module.css`: nuevo aspecto sin cambiar IDs.
- Modificar `src/components/Admin/Navbar.tsx` y `.module.css`: header del nuevo estándar.
- Modificar `src/components/Admin/MetricCards.tsx` y `.module.css`: métricas reales y estados.
- Modificar `src/app/api/admin/metrics/route.ts`: sustituir el fondo simulado por suma real.
- Modificar `src/types/admin.types.ts`: documentar el contrato real de métricas.

### Task 1: Congelar contratos críticos con pruebas

**Files:**
- Create: `tests/admin/admin-v2-shell.test.js`
- Read: `src/components/Admin/AdminDashboard.tsx`
- Read: `src/components/Admin/Sidebar.tsx`

- [ ] **Step 1: Escribir pruebas que exijan preservación de contratos**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const dashboard = fs.readFileSync('src/components/Admin/AdminDashboard.tsx', 'utf8');
const sidebar = fs.readFileSync('src/components/Admin/Sidebar.tsx', 'utf8');

test('admin V2 preserves deep-link parameters', () => {
  for (const key of ['tab', 'member', 'requestId', 'ambassadorId', 'wellnessCenterId']) {
    assert.match(dashboard, new RegExp(`searchParams\\.get\\('${key}'\\)`));
  }
});

test('admin V2 preserves role restrictions and current module IDs', () => {
  assert.match(dashboard, /isAdminSuper/);
  for (const id of ['member', 'ambassador', 'wellness-center', 'solidarity-fund', 'communications', 'reports-interactive']) {
    assert.match(sidebar, new RegExp(`id: '${id}'`));
  }
});
```

- [ ] **Step 2: Ejecutar la prueba base**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: PASS para contratos existentes.

- [ ] **Step 3: Agregar aserciones RED para `AdminOverview`, skeleton y preview**

```js
test('admin V2 mounts the new overview and loading shell', () => {
  assert.match(dashboard, /AdminOverview/);
  assert.match(dashboard, /AdminLoadingShell/);
});
```

- [ ] **Step 4: Confirmar RED**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: FAIL porque los componentes aún no existen.

### Task 2: Eliminar la métrica simulada

**Files:**
- Modify: `src/app/api/admin/metrics/route.ts`
- Modify: `src/types/admin.types.ts`
- Test: `tests/admin/admin-v2-shell.test.js`

- [ ] **Step 1: Añadir una prueba que prohíba el cálculo simulado**

```js
const metricsRoute = fs.readFileSync('src/app/api/admin/metrics/route.ts', 'utf8');
assert.doesNotMatch(metricsRoute, /totalMembers \* 50/);
assert.match(metricsRoute, /solidarity_requests/);
assert.match(metricsRoute, /approved_amount/);
```

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: FAIL por `totalMembers * 50`.

- [ ] **Step 3: Consultar el monto aprobado real en servidor**

Usar Supabase exclusivamente dentro de la API:

```ts
const { data: approvedRequests, error: refundsError } = await supabase
  .from('solidarity_requests')
  .select('approved_amount')
  .in('status', ['approved', 'paid', 'scheduled', 'completed']);

if (refundsError) throw refundsError;

const totalRefunds = (approvedRequests ?? []).reduce(
  (sum, request) => sum + (Number(request.approved_amount) || 0),
  0,
);
```

Mantener el nombre `totalRefunds` para no romper consumidores actuales.

- [ ] **Step 4: Ejecutar prueba y TypeScript**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Run: `npm run type-check`

Expected: PASS.

### Task 3: Crear el resumen presentacional

**Files:**
- Create: `src/components/Admin/V2/AdminOverview.tsx`
- Create: `src/components/Admin/V2/AdminOverview.module.css`
- Test: `tests/admin/admin-v2-shell.test.js`

- [ ] **Step 1: Definir props sin acceso directo a datos**

```ts
interface AdminOverviewProps {
  metrics: DashboardMetrics;
  pendingCounts: Record<string, number>;
  recentActivityLogs: ActivityLog[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  onNavigate: (filter: string | { id: string; subStatus: string }) => void;
}
```

- [ ] **Step 2: Construir tarjetas reales y colas navegables**

Las tarjetas serán `Miembros activos`, `Reintegros aprobados`, `Embajadores` y `Centros aliados`. Las colas usarán `member`, `{ id: 'solidarity-fund', subStatus: 'new' }`, `ambassador`, `wellness-center` y `appeals` si es superadmin.

- [ ] **Step 3: Implementar estados accesibles**

Mostrar skeleton cuando `isLoading`, `Sin actividad reciente` cuando la lista esté vacía y botones reales para cada cola. No usar `alert`, datos ficticios ni enlaces `#`.

- [ ] **Step 4: Añadir CSS inspirado en el repo nuevo**

Usar fondo crema, tarjetas blancas, verde petróleo, turquesa y naranja. Aplicar `font-variant-numeric: tabular-nums`, foco visible y grid responsive `4 → 2 → 1`.

- [ ] **Step 5: Ejecutar pruebas**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: las aserciones del overview pasan.

### Task 4: Rediseñar navegación y encabezado sin cambiar comportamiento

**Files:**
- Modify: `src/components/Admin/Sidebar.tsx`
- Modify: `src/components/Admin/Sidebar.module.css`
- Modify: `src/components/Admin/Navbar.tsx`
- Modify: `src/components/Admin/Navbar.module.css`

- [ ] **Step 1: Mantener intacto el arreglo `sections` y callbacks**

No renombrar IDs, `subStatus`, badges, `onFilterChange`, `onClose` ni `isSuperAdmin`.

- [ ] **Step 2: Aplicar el sidebar del repo nuevo**

Fondo `#1e5b57`, texto blanco, activo con blanco translúcido, contadores con color operativo y tarjeta del admin al pie. Mantener grupos colapsables para alojar todos los módulos actuales.

- [ ] **Step 3: Adaptar móvil**

Conservar drawer lateral, overlay, cierre y ancho máximo `min(88vw, 320px)`. Añadir `aria-expanded` al botón del menú y foco visible.

- [ ] **Step 4: Adaptar Navbar**

Mantener recarga, `AdminNotifications`, logout y callback de notificaciones. Cambiar solo composición, espaciado y estilos.

- [ ] **Step 5: Ejecutar prueba de contratos**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: PASS; ningún ID ni callback desaparece.

### Task 5: Integrar el shell en `AdminDashboard`

**Files:**
- Modify: `src/components/Admin/AdminDashboard.tsx`
- Modify: `src/components/Admin/AdminDashboard.module.css`
- Create: `src/components/Admin/V2/AdminLoadingShell.tsx`
- Create: `src/components/Admin/V2/AdminLoadingShell.module.css`

- [ ] **Step 1: Sustituir el spinner inline por skeleton**

`AdminLoadingShell` imitará sidebar, encabezado y tarjetas mediante bloques CSS, respetando `prefers-reduced-motion`.

- [ ] **Step 2: Montar `AdminOverview` solamente en `activeFilter === 'all'`**

```tsx
{activeFilter === 'all' ? (
  <AdminOverview
    metrics={metrics}
    pendingCounts={pendingCounts}
    recentActivityLogs={recentActivityLogs}
    isSuperAdmin={isAdminSuper}
    isLoading={false}
    onNavigate={handleFilterChange}
  />
) : (
  <>{activeFilter !== 'admins' && <MetricCards metrics={metrics} activeFilter={activeFilter} />}{renderContent()}</>
)}
```

- [ ] **Step 3: Conservar modales fuera del área intercambiable**

`MemberDetailModal`, `RejectionModal`, `AmbassadorDetailModal`, `SolidarityRequestDetail` y `WellnessCenterDetailModal` deben permanecer montados en el mismo nivel actual.

- [ ] **Step 4: Verificar rutas profundas**

Ejecutar pruebas y revisar que los cinco parámetros sigan seleccionando y abriendo el registro correspondiente.

### Task 6: Construir preview local aislado

**Files:**
- Create: `public/admin-v2-preview.html`
- Test: `tests/admin/admin-v2-shell.test.js`

- [ ] **Step 1: Crear una maqueta estática fiel al nuevo shell**

Debe incluir sidebar completo resumido, encabezado, cuatro métricas, colas y actividad. Los botones solo alternarán estados visuales locales; no harán `fetch` ni mutaciones.

- [ ] **Step 2: Añadir responsive**

Desktop: sidebar fija. Móvil: botón y drawer. Confirmar ausencia de scroll horizontal a 320 px.

- [ ] **Step 3: Probar URL local**

Run: `curl.exe -I http://127.0.0.1:3000/admin-v2-preview.html`

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 4: Entregar preview al usuario y esperar aprobación visual**

URL: `http://127.0.0.1:3000/admin-v2-preview.html?v=1`

No continuar a commit hasta recibir revisión.

### Task 7: Verificación integral

**Files:** todos los modificados en las tareas anteriores.

- [ ] **Step 1: Ejecutar pruebas del admin**

Run: `node --test tests/admin/admin-v2-shell.test.js`

Expected: PASS.

- [ ] **Step 2: Ejecutar comprobaciones obligatorias**

Run: `npm run type-check`

Run: `npm run build`

Run: `npm run lint`

Expected: TypeScript y build pasan. Documentar separadamente cualquier error preexistente del repo clonado `temp-pata-amiga`.

- [ ] **Step 3: Auditoría manual sin mutaciones**

Revisar resumen, cada entrada del sidebar, drawer móvil, roles, notificaciones y apertura de modales. No aprobar, rechazar, pagar ni eliminar registros durante esta auditoría.

- [ ] **Step 4: Revisar Git**

Run: `git diff --check`

Run: `git status --short`

Expected: solo archivos previstos y sin errores de whitespace.

- [ ] **Step 5: Solicitar autorización de commit y push**

Presentar resumen, URL local y resultados de QA. Ejecutar Git únicamente después de autorización explícita del usuario.
