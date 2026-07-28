# UI V2 de sucursales Wellness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el mojibake y presentar la configuración por sucursal con componentes visuales consistentes con Wellness V2.

**Architecture:** La estructura funcional existente se conservará. El widget Webflow recibirá clases V2 específicas y el formulario React reutilizará clases equivalentes de su CSS Module; una prueba transversal verificará textos y contrato visual.

**Tech Stack:** JavaScript, React 19, TypeScript, CSS embebido, CSS Modules y `node:test`.

---

### Task 1: Prueba de regresión visual y de codificación

**Files:**
- Create: `tests/wellness-branch-ui-v2.test.mjs`
- Test: `public/widgets/wellness-center-widget.js`
- Test: `src/components/WellnessForm/WellnessComplementaryForm.tsx`
- Test: `src/components/WellnessForm/WellnessForm.module.css`

- [ ] **Step 1: Escribir la prueba fallida**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const widget = fs.readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const reactForm = fs.readFileSync('src/components/WellnessForm/WellnessComplementaryForm.tsx', 'utf8');
const reactCss = fs.readFileSync('src/components/WellnessForm/WellnessForm.module.css', 'utf8');

for (const brokenText of ['Â¿Esta sucursal', 'SÃ­', 'ClÃ­nica veterinaria']) {
  assert.ok(!widget.includes(brokenText), `widget should not contain ${brokenText}`);
}

for (const token of ['wc-v2-branch-section', 'wc-v2-choice-group', 'wc-v2-choice', 'wc-v2-branch-help']) {
  assert.ok(widget.includes(token), `widget should expose ${token}`);
}

for (const token of ['branchDetailsSection', 'choiceGroup', 'choiceOption', 'branchHelp']) {
  assert.ok(reactForm.includes(`styles.${token}`), `React form should use ${token}`);
  assert.ok(reactCss.includes(`.${token}`), `CSS Module should define ${token}`);
}
```

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/wellness-branch-ui-v2.test.mjs`

Expected: FAIL porque existen textos mojibake y faltan agrupaciones V2.

### Task 2: Widget Webflow V2

**Files:**
- Modify: `public/widgets/wellness-center-widget.js`
- Test: `tests/wellness-branch-ui-v2.test.mjs`

- [ ] **Step 1: Corregir textos**

Reemplazar los textos corruptos del bloque por UTF-8 correcto:

```js
const WELLNESS_SERVICE_OPTIONS = [
  'Tienda',
  'Clínica veterinaria',
  'Hospital Veterinario',
  'Hotel',
  'Paseador de perros',
  'Funeraria'
];
```

Usar `¿Esta sucursal...` y `Sí` en el marcado.

- [ ] **Step 2: Agrupar la tarjeta**

Aplicar:

```html
<section class="wc-v2-branch-section">
  <div class="wc-v2-branch-section-head">
    <div>...</div>
    <div class="wc-v2-choice-group">...</div>
  </div>
</section>
```

Usar `wc-v2-choice` en cada opción y `wc-v2-branch-help` en textos explicativos.

- [ ] **Step 3: Añadir CSS V2**

Definir superficies internas, selectores segmentados, chips, foco, hover, presión, responsive y `prefers-reduced-motion` con los tokens V2 existentes.

- [ ] **Step 4: Confirmar GREEN parcial**

Run: `node --check public/widgets/wellness-center-widget.js`

Expected: exit code 0.

Run: `node --test tests/wellness-branch-ui-v2.test.mjs tests/wellness-center-widget-v2.test.mjs`

Expected: PASS para widget y contrato V2.

### Task 3: Formulario React equivalente

**Files:**
- Modify: `src/components/WellnessForm/WellnessComplementaryForm.tsx`
- Modify: `src/components/WellnessForm/WellnessForm.module.css`
- Test: `tests/wellness-branch-ui-v2.test.mjs`

- [ ] **Step 1: Corregir mojibake del formulario afectado**

Reemplazar `recepciÃ³n`, `Ã¡reas`, `imÃ¡genes`, `RazÃ³n` y `dÃ­gitos` por sus equivalentes UTF-8.

- [ ] **Step 2: Aplicar estructura compartida**

Usar `branchDetailsSection`, `branchDetailsHeader`, `choiceGroup`, `choiceOption` y `branchHelp` en servicios, beneficio y presencia digital.

- [ ] **Step 3: Añadir CSS Module**

Replicar el lenguaje visual del widget con los tokens locales: superficies crema, borde cálido, turquesa suave activo, estados interactivos y media query móvil.

- [ ] **Step 4: Confirmar GREEN**

Run: `node --test tests/wellness-branch-ui-v2.test.mjs tests/wellness-registration-v2.test.mjs`

Expected: PASS.

Run: `npm run type-check`

Expected: exit code 0.

### Task 4: QA

**Files:**
- Verify: todos los archivos modificados.

- [ ] **Step 1: Pruebas relevantes**

Run: `node --test tests/wellness-branch-ui-v2.test.mjs tests/wellness-location-details.test.mjs tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs tests/wellness-registration-v2.test.mjs`

Expected: 0 fallos.

- [ ] **Step 2: Puerta obligatoria**

Run: `npm run build`

Expected: exit code 0.

Run: `npm run type-check`

Expected: exit code 0.

Run: `npm run lint`

Expected: 0 errores.

- [ ] **Step 3: Revisión local**

Ejecutar `git diff --check`, resumir cambios y solicitar autorización antes de cualquier commit o push.
