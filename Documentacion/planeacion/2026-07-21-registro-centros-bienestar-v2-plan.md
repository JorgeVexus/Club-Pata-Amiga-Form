# Registro V2 de Centros de Bienestar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar visualmente `/bienestar/registro` al estándar V2 de Pata Amiga sin alterar contratos, validaciones, persistencia ni integraciones.

**Architecture:** La ruta conserva `WellnessForm` como controlador del flujo y `WellnessComplementaryForm` como responsable de la captura ampliada. Los cambios se limitan a estructura presentacional en React y CSS Modules; una prueba de caracterización protege la funcionalidad y los contratos existentes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Node test runner.

---

## Mapa de archivos

- Crear `tests/wellness-registration-v2.test.mjs`: contratos visuales y funcionales del registro.
- Modificar `src/app/bienestar/registro/page.tsx`: shell, navbar, encabezado y semántica de la ruta.
- Modificar `src/app/bienestar/registro/page.module.css`: fondo crema, navbar, contenedor y responsive.
- Modificar `src/components/WellnessForm/WellnessForm.tsx`: progreso y jerarquía visual de las cuatro vistas, sin cambiar handlers.
- Modificar `src/components/WellnessForm/WellnessForm.module.css`: controles, servicios, estados, formulario complementario y responsive V2.
- Crear `public/wellness-registration-v2-preview.html`: acceso local documentado al preview real.

### Task 1: Proteger los contratos existentes

**Files:**
- Create: `tests/wellness-registration-v2.test.mjs`
- Inspect: `src/components/WellnessForm/WellnessForm.tsx`
- Inspect: `src/components/WellnessForm/WellnessComplementaryForm.tsx`

- [x] **Step 1: Escribir la prueba de caracterización**

La prueba debe leer los archivos fuente y comprobar, como mínimo:

```js
assert.ok(form.includes("fetch('/api/wellness'"));
assert.ok(form.includes('checkWellnessEmailAvailability'));
assert.ok(form.includes('<TermsModalEnhanced'));
assert.ok(form.includes('<WellnessComplementaryForm'));
assert.ok(form.includes("'form' | 'success' | 'complementary' | 'complementary-success'"));
assert.ok(complementary.includes('/api/upload/wellness-logo'));
assert.ok(complementary.includes('/api/wellness/update'));
```

- [x] **Step 2: Ejecutar la prueba y confirmar el estado base**

Run: `node --test tests/wellness-registration-v2.test.mjs`

Expected: PASS para contratos existentes y FAIL para los nuevos contratos visuales V2 todavía ausentes.

- [x] **Step 3: Agregar contratos visuales esperados**

Comprobar las clases `registrationNav`, `progressTrack`, `stageCard`, `serviceBadge`, `successContainer` y el fondo `#FAF7F1`.

### Task 2: Construir el shell V2 de la ruta

**Files:**
- Modify: `src/app/bienestar/registro/page.tsx`
- Modify: `src/app/bienestar/registro/page.module.css`
- Test: `tests/wellness-registration-v2.test.mjs`

- [x] **Step 1: Sustituir el encabezado aislado por una navbar semántica**

Usar `<header className={styles.registrationNav}>`, conservar `BrandLogo` y agregar un enlace de inicio de sesión a `https://www.pataamiga.mx/user/inicio-de-sesion`.

- [x] **Step 2: Crear el encabezado contextual**

Mantener los copys actuales dentro de un bloque `heroCopy` sobre la tarjeta del formulario.

- [x] **Step 3: Aplicar tokens V2**

Definir fondo `#FAF7F1`, superficie blanca, borde `#E4DFD3`, texto `#1E5350`, acento `#1CBCAD`, radio `20px` y sombra `0 2px 12px rgba(30,83,80,.06)`.

- [x] **Step 4: Ejecutar la prueba enfocada**

Run: `node --test tests/wellness-registration-v2.test.mjs`

Expected: PASS para shell, navbar y tokens.

### Task 3: Unificar progreso y vistas del formulario

**Files:**
- Modify: `src/components/WellnessForm/WellnessForm.tsx`
- Modify: `src/components/WellnessForm/WellnessForm.module.css`
- Test: `tests/wellness-registration-v2.test.mjs`

- [x] **Step 1: Incorporar progreso derivado de `view`**

Mapear `form` a etapa 1, `success` y `complementary` a etapa 2, y `complementary-success` a etapa 3. Renderizar las etiquetas `Solicitud`, `Información del centro` y `Revisión` con `aria-current="step"` en la etapa activa.

- [x] **Step 2: Envolver cada vista en `stageCard`**

Mantener exactamente las transiciones `setView('success')`, `setView('complementary')` y `setView('complementary-success')`; cambiar solamente la jerarquía presentacional.

- [x] **Step 3: Normalizar confirmaciones**

Aplicar el mismo encabezado, icono de estado, texto y CTA turquesa en `success` y `complementary-success`, conservando sus copys y destino de inicio de sesión.

- [x] **Step 4: Ejecutar la prueba enfocada**

Run: `node --test tests/wellness-registration-v2.test.mjs`

Expected: PASS para progreso y cuatro vistas; los contratos de API permanecen verdes.

### Task 4: Adaptar controles y formulario complementario

**Files:**
- Modify: `src/components/WellnessForm/WellnessForm.module.css`
- Inspect: `src/components/WellnessForm/WellnessComplementaryForm.tsx`
- Test: `tests/wellness-registration-v2.test.mjs`

- [x] **Step 1: Estilizar campos y selectores**

Usar altura mínima de `48px`, radio `12px`, borde `1.5px solid #E4DFD3`, foco turquesa visible y labels Outfit semibold.

- [x] **Step 2: Estilizar servicios como selección múltiple**

Conservar botones y `toggleService`; diferenciar claramente normal, hover, focus, pressed y seleccionado sin depender solo del color.

- [x] **Step 3: Integrar secciones complementarias**

Homologar textarea, logo, mapa, sucursales, fotografías, redes y mensajes. No cambiar nombres de clase consumidos por `WellnessComplementaryForm`.

- [x] **Step 4: Completar responsive**

A `640px` o menos, usar progreso segmentado, una columna, padding `20px`, mapas con altura controlada y botones de ancho completo.

- [x] **Step 5: Ejecutar pruebas relacionadas**

Run: `node --test tests/wellness-registration-v2.test.mjs tests/wellness-center-*.test.mjs`

Expected: todas las pruebas PASS.

### Task 5: Preview y verificación final

**Files:**
- Create: `public/wellness-registration-v2-preview.html`
- Modify: `Documentacion/planeacion/2026-07-21-registro-centros-bienestar-v2-plan.md`

- [x] **Step 1: Crear acceso al preview**

El archivo debe documentar y redirigir a `http://127.0.0.1:3000/bienestar/registro`, usando la ruta real de Next.js para ejercer toda la funcionalidad.

- [x] **Step 2: Revisar escritorio y móvil**

Comprobar navbar, progreso, formulario inicial, errores inline, selector de servicios y ausencia de overflow. Los estados posteriores se verificarán mediante pruebas de estructura sin enviar datos reales.

- [x] **Step 3: Ejecutar QA obligatorio**

Run: `npm run type-check`

Expected: exit code 0.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

- [x] **Step 4: Auditar el diff**

Run: `git diff --check`

Expected: sin errores de whitespace ni cambios funcionales fuera de alcance.

- [ ] **Step 5: Solicitar autorización de commit**

Presentar al usuario el preview, resumen, archivos y QA. No ejecutar `git commit` ni `git push` sin autorización explícita.
