# Navbar principal “Mi manada” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el navbar de Perfil y Ajustes en navegación principal reutilizable, con acceso “Mi manada” exclusivo para miembros y una campana consistente con el dashboard unificado.

**Architecture:** `member-account-navbar.js` continuará como widget público API-first. Consultará `/api/auth/check-role` después de obtener el miembro de Memberstack, aplicará cierre seguro y renderizará el enlace condicionalmente. El componente conservará sus consumidores actuales y expondrá destinos configurables mediante `window.PATA_AMIGA_CONFIG`.

**Tech Stack:** JavaScript ES2020, Memberstack DOM, Next.js API Routes, CSS embebido, Node test runner.

---

### Task 1: Contrato de rol y navegación

**Files:**
- Modify: `tests/widgets/member-account-navbar-v2.test.js`
- Modify: `public/widgets/member-account-navbar.js`

- [ ] **Step 1: Escribir pruebas fallidas**

Agregar aserciones que exijan `myPackUrl`, consulta `POST /api/auth/check-role`, visibilidad restringida a `role === 'member'`, cierre seguro y ausencia del texto anterior.

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/widgets/member-account-navbar-v2.test.js`

Expected: FAIL porque todavía existen `dashboardUrl` y “Volver al dashboard”.

- [ ] **Step 3: Implementar detección API-first**

Añadir `this.role = null` y el método:

```js
async loadRole() {
    if (!this.member?.id) return null;
    try {
        const response = await fetch(`${CONFIG.apiUrl}/api/auth/check-role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberstackId: this.member.id })
        });
        const data = await response.json();
        this.role = response.ok && data.success ? data.role : null;
    } catch {
        this.role = null;
    }
    return this.role;
}
```

Invocarlo antes de `render()` y generar el enlace únicamente cuando `this.role === 'member'`.

- [ ] **Step 4: Sustituir destino y copy**

Definir:

```js
myPackUrl: window.PATA_AMIGA_CONFIG?.myPackUrl || 'https://www.pataamiga.mx/pets/pet-waiting-period'
```

Renderizar “Mi manada” y eliminar “Volver al dashboard”.

- [ ] **Step 5: Confirmar GREEN**

Run: `node --test tests/widgets/member-account-navbar-v2.test.js`

Expected: todas las pruebas PASS.

### Task 2: Consistencia visual de la campana

**Files:**
- Modify: `tests/widgets/member-account-navbar-v2.test.js`
- Modify: `public/widgets/member-account-navbar.js`

- [ ] **Step 1: Escribir prueba fallida del icono**

Exigir el mismo glifo visible `🔔`, la clase del botón de notificaciones y el badge rojo `9+` usados por el dashboard unificado.

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/widgets/member-account-navbar-v2.test.js`

Expected: FAIL porque el navbar usa actualmente un SVG delineado.

- [ ] **Step 3: Implementar estilo consistente**

Usar `🔔` dentro de `.pata-account-notification-button`, mantener el botón circular claro y conservar el badge existente.

- [ ] **Step 4: Confirmar GREEN**

Run: `node --test tests/widgets/member-account-navbar-v2.test.js`

Expected: todas las pruebas PASS.

### Task 3: Previews y regresión

**Files:**
- Modify: `public/widgets/profile-widget-preview.html`
- Modify: `public/widgets/settings-preview.html`

- [ ] **Step 1: Simular rol miembro en previews**

Extender el mock de `fetch` para que `/api/auth/check-role` responda:

```js
{ success: true, role: 'member' }
```

- [ ] **Step 2: Actualizar cachebusters**

Actualizar las URLs de los scripts de Perfil y Ajustes para forzar la carga del navbar nuevo.

- [ ] **Step 3: Ejecutar regresión completa de widgets**

Run: `node --test tests/widgets/emergency-dashboard-integration-v2.test.js tests/widgets/member-account-navbar-v2.test.js tests/widgets/member-account-navigation-v2.test.js tests/widgets/unified-membership-dashboard-v2.test.js`

Expected: todas las pruebas PASS.

- [ ] **Step 4: Ejecutar gate del proyecto**

Run: `npm run type-check`

Run: `npm run lint`

Run: `npm run build`

Expected: exit code 0 en los tres comandos; lint puede conservar advertencias preexistentes, pero no errores.

- [ ] **Step 5: Verificar previews**

Confirmar HTTP 200 en Perfil y Ajustes y revisar que “Mi manada” aparezca en los mocks de rol miembro.
