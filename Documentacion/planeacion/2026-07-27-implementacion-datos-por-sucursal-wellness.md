# Datos por sucursal Wellness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guardar, validar y publicar servicios, beneficio y canales digitales propios o heredados para cada sucursal Wellness.

**Architecture:** `wellness_center_locations` será la fuente de datos efectivos por sucursal. Los dos formularios complementarios —el widget Webflow y `WellnessComplementaryForm`— resolverán la herencia antes de enviar; el servidor sanitizará y persistirá esos valores, y la API pública aplicará fallback a la principal para datos históricos.

**Tech Stack:** JavaScript de widget Webflow, React 19, TypeScript, Next.js 16, Supabase/PostgreSQL y pruebas Node `node:test`.

---

## Estructura de archivos

- Crear `supabase/migrations/20260727_add_wellness_location_details.sql`: columnas de servicios, beneficio, redes e indicadores de herencia.
- Crear `tests/wellness-location-details.test.mjs`: contrato transversal de UI, tipos, migración, persistencia y publicación.
- Modificar `src/types/wellness.types.ts`: ampliar `WellnessCenterLocation`.
- Modificar `src/services/wellness.service.ts`: normalizar datos por sucursal y devolverlos al directorio público.
- Modificar `public/widgets/wellness-center-widget.js`: controles, visibilidad, recolección y validación en edición y espera.
- Modificar `src/components/WellnessForm/WellnessComplementaryForm.tsx`: aplicar las mismas reglas en el formulario React alternativo encontrado durante la auditoría.
- Modificar `src/components/WellnessForm/WellnessForm.module.css`: estilos reutilizables de controles condicionales.
- Modificar `src/components/Admin/WellnessCenterDetailModal.tsx` y `src/components/AdminLegacy/WellnessCenterDetailModal.tsx`: mostrar datos de la sucursal correspondiente.

### Task 1: Contrato de datos y migración

**Files:**
- Create: `tests/wellness-location-details.test.mjs`
- Create: `supabase/migrations/20260727_add_wellness_location_details.sql`
- Modify: `src/types/wellness.types.ts`

- [ ] **Step 1: Escribir la prueba fallida**

La prueba leerá los archivos productivos y exigirá estas propiedades:

```js
for (const field of [
  'services',
  'promotion_details',
  'social_links',
  'inherits_services',
  'inherits_promotion',
  'inherits_social_links'
]) {
  assert.match(typeSource, new RegExp(`${field}\\\\?`));
  assert.match(migrationSource, new RegExp(`ADD COLUMN IF NOT EXISTS ${field}`, 'i'));
}
```

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL porque no existen las columnas ni los campos del tipo.

- [ ] **Step 3: Implementar el contrato mínimo**

Agregar al tipo:

```ts
services?: string[];
promotion_details?: string | null;
social_links?: SocialLinks;
inherits_services?: boolean;
inherits_promotion?: boolean;
inherits_social_links?: boolean;
```

Crear columnas idempotentes:

```sql
ALTER TABLE wellness_center_locations
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS promotion_details TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS inherits_services BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inherits_promotion BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inherits_social_links BOOLEAN NOT NULL DEFAULT true;
```

- [ ] **Step 4: Confirmar GREEN**

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: PASS para contrato y migración.

### Task 2: Persistencia y directorio público

**Files:**
- Modify: `tests/wellness-location-details.test.mjs`
- Modify: `src/services/wellness.service.ts`

- [ ] **Step 1: Extender la prueba y confirmar RED**

Exigir que `syncLocations` normalice los nuevos campos y que `getAllApprovedLocations` use primero los datos de la ubicación:

```js
assert.match(serviceSource, /services:\s*Array\.isArray\(location\.services\)/);
assert.match(serviceSource, /promotion_details:\s*location\.promotion_details/);
assert.match(serviceSource, /social_links:\s*location\.social_links/);
assert.match(serviceSource, /location\.services\?\.length\s*\?\s*location\.services\s*:\s*center\.services/);
```

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL en normalización y fallback público.

- [ ] **Step 2: Implementar normalización**

Persistir arreglos sin valores vacíos, texto recortado, objeto social limitado a los cuatro canales e indicadores booleanos. Mantener el filtro actual de ubicaciones válidas por dirección, coordenadas o fotografías.

- [ ] **Step 3: Implementar fallback histórico**

En cada resultado público usar:

```ts
services: location.services?.length ? location.services : center.services,
promotion_details: location.promotion_details || center.promotion_details,
social_links: Object.values(location.social_links || {}).some(Boolean)
  ? location.social_links
  : center.social_links
```

- [ ] **Step 4: Confirmar GREEN**

Run: `node --test tests/wellness-location-details.test.mjs tests/wellness-center-locations.test.mjs`
Expected: PASS.

### Task 3: Widget Webflow compartido

**Files:**
- Modify: `tests/wellness-location-details.test.mjs`
- Modify: `public/widgets/wellness-center-widget.js`

- [ ] **Step 1: Escribir pruebas fallidas de marcado**

Exigir por tarjeta:

```js
for (const token of [
  'location_same_services_benefits',
  'location_inherits_promotion',
  'location_inherits_social_links',
  'location_services',
  'location_promotion_details',
  'location_social_instagram',
  'location_social_facebook',
  'location_social_tiktok',
  'location_social_website'
]) assert.ok(widgetSource.includes(token));
```

También verificar que `renderEditProfileForm` siga siendo utilizado por pantalla de espera y modal.

- [ ] **Step 2: Confirmar RED**

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL porque las tarjetas actuales solo capturan ubicación, teléfono y fotografías.

- [ ] **Step 3: Renderizar controles condicionales**

Ampliar `renderBranchCard(location, index, center)` con:

- pregunta de mismos servicios y beneficios;
- selector de servicios cuando la respuesta sea “No”;
- selector de beneficio principal/diferente;
- textarea de beneficio diferente;
- selector de mismas redes/redes diferentes;
- cuatro campos de canales digitales.

`renderBranchesEditor(center)` pasará `center` al crear tarjetas existentes y nuevas.

- [ ] **Step 4: Enlazar comportamiento**

`bindBranchRow` actualizará visibilidad al cambiar radios. Las tarjetas nuevas usarán valores heredados por defecto, sin copiar información entre tarjetas vecinas.

- [ ] **Step 5: Escribir prueba fallida de payload y validación**

Exigir helpers explícitos:

```js
assert.ok(widgetSource.includes('hasAtLeastOneWellnessSocial'));
assert.ok(widgetSource.includes('validateWellnessProfileForm'));
assert.ok(widgetSource.includes('inherits_services'));
assert.ok(widgetSource.includes('inherits_promotion'));
assert.ok(widgetSource.includes('inherits_social_links'));
```

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL hasta implementar recolección y validación.

- [ ] **Step 6: Implementar recolección y validación**

Antes de enviar:

- principal: al menos un valor no vacío entre Instagram, Facebook, TikTok y sitio web;
- sucursal con servicios propios: al menos un servicio;
- sucursal con beneficio propio: texto no vacío;
- sucursal con redes propias: al menos un canal;
- mensajes identificados por nombre o número de sucursal.

`collectWellnessLocations` guardará valores efectivos y los tres indicadores. Los dos submits activos usan `bindEditProfileForm`, por lo que la validación cubrirá pantalla de espera y modal.

- [ ] **Step 7: Confirmar GREEN**

Run: `node --test tests/wellness-location-details.test.mjs tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs`
Expected: PASS.

### Task 4: Formulario React alternativo

**Files:**
- Modify: `tests/wellness-location-details.test.mjs`
- Modify: `src/components/WellnessForm/WellnessComplementaryForm.tsx`
- Modify: `src/components/WellnessForm/WellnessForm.module.css`

- [ ] **Step 1: Escribir prueba fallida**

Verificar que `BranchFields` recibe datos de la principal y que el submit valida canales digitales:

```js
assert.match(reactSource, /primaryServices/);
assert.match(reactSource, /primaryPromotionDetails/);
assert.match(reactSource, /primarySocialLinks/);
assert.match(reactSource, /hasAtLeastOneSocial/);
```

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL.

- [ ] **Step 2: Implementar controles equivalentes**

Ampliar `BranchFields` con los mismos tres indicadores y campos condicionales del widget. Al crear una sucursal, inicializar:

```ts
{
  address: '',
  photo_urls: [],
  services: formData.services,
  promotion_details: formData.promotion_details,
  social_links: formData.social_links,
  inherits_services: true,
  inherits_promotion: true,
  inherits_social_links: true
}
```

- [ ] **Step 3: Implementar validación y compilación**

Validar la principal y cada sucursal antes de construir `compiledLocations`. Resolver herencia contra el estado actual de la principal y conservar los indicadores.

- [ ] **Step 4: Confirmar GREEN y tipos**

Run: `node --test tests/wellness-location-details.test.mjs tests/wellness-registration-v2.test.mjs`
Expected: PASS.
Run: `npm run type-check`
Expected: exit code 0.

### Task 5: Vista administrativa y verificación integral

**Files:**
- Modify: `tests/wellness-location-details.test.mjs`
- Modify: `src/components/Admin/WellnessCenterDetailModal.tsx`
- Modify: `src/components/AdminLegacy/WellnessCenterDetailModal.tsx`

- [ ] **Step 1: Escribir prueba fallida**

Exigir que ambas vistas lean `location.services`, `location.promotion_details` y `location.social_links`.

Run: `node --test tests/wellness-location-details.test.mjs`
Expected: FAIL.

- [ ] **Step 2: Mostrar información correspondiente**

Dentro de cada bloque de sucursal mostrar servicios, beneficio y canales propios, con fallback visual a los datos principales para registros históricos.

- [ ] **Step 3: Confirmar GREEN**

Run: `node --test tests/wellness-location-details.test.mjs tests/wellness-center-locations.test.mjs tests/wellness-location-photos.test.mjs`
Expected: PASS.

- [ ] **Step 4: Auditoría sistemática**

Revisar que:

- cada fila se recolecta aisladamente;
- cambiar un radio no modifica otras sucursales;
- la principal no se pierde;
- fotografías y geolocalización siguen funcionando;
- los dos formularios complementarios generan el mismo contrato;
- los registros anteriores reciben fallback.

- [ ] **Step 5: Puerta QA obligatoria**

Run: `npm run build`
Expected: exit code 0.

Run: `npm run type-check`
Expected: exit code 0.

Run: `npm run lint`
Expected: exit code 0 sin errores.

- [ ] **Step 6: Preparar revisión local**

Mostrar resumen, archivos modificados, pruebas ejecutadas y cualquier advertencia. No ejecutar `git commit` ni `git push` sin autorización expresa del usuario.
