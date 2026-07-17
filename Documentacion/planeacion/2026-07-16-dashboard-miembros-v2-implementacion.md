# Dashboard de miembros V2 Implementation Plan

> **For agentic workers:** Implementar en la sesión actual, tarea por tarea, usando TDD y verificando cada punto antes de continuar.

**Goal:** Adaptar el widget unificado y sus tarjetas de mascotas al dashboard visual del repositorio de referencia sin cambiar sus integraciones ni reglas de negocio.

**Architecture:** `UnifiedWidget` conserva sesión, datos y acciones. Se añaden helpers de presentación V2 y un shell responsive aislado con clases `pata-v2-*`; las acciones existentes se enlazan desde las nuevas tarjetas mediante los métodos actuales del controlador.

**Tech Stack:** JavaScript público sin bundler, CSS embebido, Memberstack y API Routes de Next.js.

---

### Task 1: Contrato estático del dashboard V2

**Files:**
- Create: `tests/widgets/unified-membership-dashboard-v2.test.js`
- Modify: `public/widgets/unified-membership-widget.js`

- [ ] Crear pruebas con `node:test` para shell, navegación condicional, KPIs, listado completo y ausencia de cliente Supabase.
- [ ] Ejecutar `node --test tests/widgets/unified-membership-dashboard-v2.test.js` y comprobar que falla antes de implementar.
- [ ] Añadir helpers V2 mínimos al widget.
- [ ] Ejecutar nuevamente la prueba y comprobar que pasa.

### Task 2: Shell y sistema visual

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Test: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [ ] Añadir tokens, layout, sidebar, encabezado, navegación y estados interactivos con prefijo `pata-v2-*`.
- [ ] Implementar puntos de quiebre para escritorio, tablet y 360 px.
- [ ] Verificar sintaxis con `node --check public/widgets/unified-membership-widget.js`.

### Task 3: KPIs, tarjetas y actividad

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Test: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [ ] Renderizar membresía, cantidad real de mascotas y reintegro disponible.
- [ ] Renderizar todas las mascotas con estado, espera, foto y acción de detalle.
- [ ] Generar actividad únicamente desde datos existentes.
- [ ] Conectar cada tarjeta con `setIndex` y el modal de detalle actual.
- [ ] Ejecutar la prueba del widget.

### Task 4: Navegación y sesión

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Test: `tests/widgets/unified-membership-dashboard-v2.test.js`

- [ ] Mostrar Panel de embajador sólo para el rol correspondiente.
- [ ] Mostrar Cerrar sesión sólo con miembro activo y usar Memberstack.
- [ ] Conservar URLs configurables para cuenta, reintegros, veterinario y centros.
- [ ] Verificar que no se agregó inicialización directa de Supabase.

### Task 5: QA local

**Files:**
- Modify only if QA finds a regression.

- [ ] Ejecutar prueba estática y `node --check`.
- [ ] Ejecutar `npm run type-check`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Confirmar que `http://127.0.0.1:3000` responde y entregar la URL de revisión.
