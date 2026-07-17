# Centros aliados en Dashboard V2 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar el directorio real de Centros del Bienestar como una vista interna del Dashboard V2 con el diseno de `/app/centros`.

**Architecture:** El widget unificado ampliara su estado de vistas con `centers`, cargara datos mediante `GET /api/wellness/locations` y renderizara busqueda, filtros y tarjetas sin acceder directamente a Supabase. Los eventos se conectaran despues de cada render para mantener el patron existente del widget.

**Tech Stack:** JavaScript embebible, CSS del Dashboard V2, API Routes de Next.js, Node Test Runner.

---

### Task 1: Contrato y navegacion interna

**Files:**
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`
- Modify: `public/widgets/unified-membership-widget.js`

- [x] Agregar pruebas que exijan `showCentersV2`, vista `centers`, navegacion interna y `GET /api/wellness/locations`.
- [x] Ejecutar `node --test tests/widgets/unified-membership-dashboard-v2.test.js` y confirmar fallo por metodos ausentes.
- [x] Agregar estado `centers`, carga API-first y cambios de vista desde sidebar y CTA del inicio.
- [x] Repetir la prueba y confirmar que pasa.

### Task 2: Directorio visual y estados

**Files:**
- Modify: `tests/widgets/unified-membership-dashboard-v2.test.js`
- Modify: `public/widgets/unified-membership-widget.js`

- [x] Agregar pruebas para buscador, filtros de servicios, tarjetas, estados de carga/error/vacio y CTA exacto `https://www.pataamiga.mx/#wellness-partner-form-anchor`.
- [x] Ejecutar la prueba y confirmar el fallo esperado.
- [x] Implementar `renderV2CentersView` con normalizacion segura de la API, imagen, nombre, categoria, direccion, telefono y promocion.
- [x] Agregar CSS responsive aislado bajo clases `pata-v2-center-*`.
- [x] Implementar eventos de busqueda, filtro, reintento y telefono.
- [x] Repetir la prueba y confirmar que pasa.

### Task 3: Preview y verificacion

**Files:**
- Modify: `public/widgets/dashboard-v2-preview.html` si el selector de query existente no reconoce `section=centers`.
- Modify: `Documentacion/planeacion/2026-07-17-centros-aliados-dashboard-v2-plan.md`

- [x] Confirmar que `dashboard-v2-preview.html?section=centers` abre directamente el directorio.
- [x] Ejecutar `node --check public/widgets/unified-membership-widget.js`.
- [x] Ejecutar las pruebas de widgets relacionadas.
- [x] Ejecutar `npm run type-check`, `npm run build` y `npm run lint`.
- [x] Revisar `git diff --check` y documentar cualquier deuda preexistente separada del cambio.
- [x] Entregar la URL local y solicitar autorizacion antes de commit o push.
