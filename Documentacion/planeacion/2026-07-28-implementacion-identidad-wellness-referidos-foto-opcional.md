# Identidad Wellness, código de embajador y foto opcional — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar identidad Pata Amiga al dashboard Wellness, reactivar el código opcional de embajador en el paso 3 V2 y dejar de bloquear el acceso por falta exclusiva de foto en `complete-profile-widget.js`.

**Architecture:** Los cambios se mantienen aislados en sus tres superficies actuales. El dashboard Wellness reutiliza el asset y patrón de marca del widget de embajadores; el registro reactiva su implementación ya existente; y Complete Profile ajusta únicamente su detector local de campos faltantes, sin tocar utilidades ni APIs compartidas.

**Tech Stack:** JavaScript embebido para widgets Webflow, React 19, TypeScript, CSS Modules, Node Test Runner y Next.js.

---

### Task 1: Crear pruebas de regresión

**Files:**
- Create: `tests/wellness-registration-complete-profile-adjustments.test.mjs`
- Read: `public/widgets/wellness-center-widget.js`
- Read: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`
- Read: `public/widgets/complete-profile-widget.js`

- [ ] **Step 1: Escribir una prueba inicialmente fallida**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const wellness = readFileSync('public/widgets/wellness-center-widget.js', 'utf8');
const registration = readFileSync('src/components/RegistrationV2/steps/Step3PlanSelection.tsx', 'utf8');
const completeProfile = readFileSync('public/widgets/complete-profile-widget.js', 'utf8');

test('wellness dashboard uses the official brand and wellness badge on desktop and mobile', () => {
  assert.match(wellness, /home%20v2%20images\/logo-light-bg\.svg/);
  assert.match(wellness, /CENTRO DE BIENESTAR/);
  assert.match(wellness, /wc-v2-mobile-brand/);
});

test('registration V2 step 3 exposes the optional ambassador code', () => {
  assert.match(registration, /const SHOW_AMBASSADOR_CODE = true;/);
  assert.match(registration, /\/api\/referrals\/validate-code/);
  assert.match(registration, /isCodeValidated \? referralCode\.toUpperCase\(\) : undefined/);
});

test('complete profile ignores only missing pet photos', () => {
  const method = completeProfile.match(/getMissingFields\(pet\) \{[\s\S]*?return missing;\s*\}/)?.[0] || '';
  assert.doesNotMatch(method, /missing\.push\('photo'\)/);
  for (const field of ['petType', 'age', 'gender', 'breed', 'breedType', 'coatColor', 'vetCert']) {
    assert.match(method, new RegExp(`missing\\.push\\('${field}'\\)`));
  }
});
```

- [ ] **Step 2: Ejecutar la prueba y comprobar RED**

Run: `node --test tests/wellness-registration-complete-profile-adjustments.test.mjs`

Expected: FAIL porque falta la marca Wellness, el código está deshabilitado y `photo` aún bloquea Complete Profile.

### Task 2: Incorporar la identidad de marca al dashboard Wellness

**Files:**
- Modify: `public/widgets/wellness-center-widget.js`
- Test: `tests/wellness-registration-complete-profile-adjustments.test.mjs`

- [ ] **Step 1: Añadir estilos de marca reutilizables**

Agregar clases:

```css
.wc-v2-brand,
.wc-v2-mobile-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.wc-v2-brand img,
.wc-v2-mobile-brand img {
    width: 108px;
    height: auto;
}

.wc-v2-brand-badge {
    padding: 6px 9px;
    border-radius: 999px;
    background: var(--wc-v2-teal-soft);
    color: #087B72;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .07em;
    white-space: nowrap;
}
```

En móvil reducir el logo y la etiqueta para conservar espacio.

- [ ] **Step 2: Reemplazar las marcas de escritorio y móvil**

Usar en ambas:

```html
<span class="wc-v2-mobile-brand">
  <img src="${CONFIG.API_BASE_URL}/widgets/home%20v2%20images/logo-light-bg.svg" alt="Pata Amiga">
  <span class="wc-v2-brand-badge">CENTRO DE BIENESTAR</span>
</span>
```

La variante de escritorio usa `wc-v2-brand`.

- [ ] **Step 3: Ejecutar la prueba focalizada**

Run: `node --test tests/wellness-registration-complete-profile-adjustments.test.mjs`

Expected: la prueba de marca pasa; las otras permanecen rojas.

### Task 3: Reactivar el código de embajador en el registro V2

**Files:**
- Modify: `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`
- Test: `tests/wellness-registration-complete-profile-adjustments.test.mjs`

- [ ] **Step 1: Habilitar la sección existente**

Cambiar:

```ts
const SHOW_AMBASSADOR_CODE = false;
```

por:

```ts
const SHOW_AMBASSADOR_CODE = true;
```

- [ ] **Step 2: Ejecutar la prueba focalizada**

Run: `node --test tests/wellness-registration-complete-profile-adjustments.test.mjs`

Expected: marca y registro pasan; Complete Profile continúa rojo.

### Task 4: Excluir la foto del detector local de Complete Profile

**Files:**
- Modify: `public/widgets/complete-profile-widget.js`
- Test: `tests/wellness-registration-complete-profile-adjustments.test.mjs`

- [ ] **Step 1: Retirar exclusivamente la condición local de foto**

Eliminar de `getMissingFields(pet)`:

```js
if (!(pet.primary_photo_url || pet.photo_url)) missing.push('photo');
```

No modificar las demás condiciones ni utilidades compartidas.

- [ ] **Step 2: Ejecutar la prueba focalizada**

Run: `node --test tests/wellness-registration-complete-profile-adjustments.test.mjs`

Expected: PASS.

### Task 5: Verificar regresiones y presentación

**Files:**
- Verify: `public/widgets/wellness-center-widget-v2-preview.html`
- Verify: tests existentes de Wellness, registro V2 y Complete Profile.

- [ ] **Step 1: Comprobar sintaxis de widgets**

Run:

```bash
node --check public/widgets/wellness-center-widget.js
node --check public/widgets/complete-profile-widget.js
```

Expected: ambos comandos terminan con código 0.

- [ ] **Step 2: Ejecutar regresión focalizada**

Run:

```bash
node --test tests/wellness-registration-complete-profile-adjustments.test.mjs tests/wellness-center-widget-v2.test.mjs tests/wellness-registration-v2.test.mjs tests/complete-profile-login-widget.test.mjs tests/complete-profile-member-info.test.mjs
```

Expected: todas las pruebas pasan.

- [ ] **Step 3: Revisar visualmente el dashboard Wellness**

Abrir el preview del widget y confirmar:

- logo oficial visible en escritorio;
- etiqueta `CENTRO DE BIENESTAR`;
- logo y etiqueta legibles en móvil;
- navegación y menú de cuenta funcionales;
- ausencia de desbordamiento horizontal.

- [ ] **Step 4: Ejecutar la compuerta obligatoria**

Run:

```bash
npm run build
npm run type-check
npm run lint
git diff --check
```

Expected: código de salida 0 en todos los comandos.

- [ ] **Step 5: Preparar resumen para revisión**

Listar archivos modificados, pruebas ejecutadas y cualquier advertencia preexistente. Solicitar autorización específica antes de `git commit` o `git push`.
