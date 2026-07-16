# Email día 0 de documentación faltante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar únicamente el email del día 0 según la referencia entregada, conservando la selección dinámica de documentos y ofreciendo un preview local verificable.

**Architecture:** Extraer el HTML del seguimiento a un generador puro y reutilizable. El generador seleccionará una composición editorial exclusiva para `followupDay === 0` y mantendrá el template existente para los días posteriores. El envío de Resend y el preview administrativo consumirán el mismo generador.

**Tech Stack:** Next.js 15, TypeScript, HTML email con tablas y estilos inline, Node test runner.

---

### Task 1: Contrato testeable del generador

**Files:**
- Create: `src/utils/missing-pet-docs-email.ts`
- Create: `tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 1: Escribir pruebas que importen el generador y exijan contenido dinámico del día 0**

Las pruebas deben comprobar las variantes `photo`, `certificate` y `both`; la interpolación de `firstName`, `petName` y `uploadUrl`; y marcadores visuales exclusivos del día 0.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

Expected: FAIL porque el módulo o la exportación todavía no existe.

- [ ] **Step 3: Crear la interfaz y el generador mínimo**

Exportar `MissingDocType`, `FollowupDay`, `MissingPetDocsEmailParams`, `getMissingDocsSubject()` y `buildMissingDocsEmailHtml()`. El día 0 tendrá su renderer separado; los días 10, 13, 14 y 15 conservarán el renderer vigente.

- [ ] **Step 4: Ejecutar la prueba y confirmar GREEN**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

Expected: todas las pruebas PASS.

### Task 2: Composición visual del día 0

**Files:**
- Modify: `src/utils/missing-pet-docs-email.ts`
- Test: `tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 1: Añadir pruebas de estructura visual y accesibilidad**

Comprobar fondo celeste, hero, bloque turquesa, CTA amarillo, cierre de manada, textos alternativos y fallbacks tipográficos.

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

Expected: FAIL por ausencia de la composición completa.

- [ ] **Step 3: Implementar el HTML compatible con email**

Usar ancho máximo de 600 px, tablas de presentación, estilos inline, media query móvil y constantes centralizadas para los placeholders de hero, manada, logo e iconos. No añadir animaciones, scripts, gradientes ni dependencias externas incompatibles con correo.

- [ ] **Step 4: Ejecutar las pruebas y confirmar GREEN**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

Expected: todas las pruebas PASS.

### Task 3: Integrar el envío real sin alterar los demás días

**Files:**
- Modify: `src/app/actions/comm.actions.ts`
- Test: `tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 1: Añadir una prueba de regresión para los días 10, 13, 14 y 15**

Validar que esos días no incluyen el marcador visual del día 0 y siguen generando asunto, texto y CTA válidos.

- [ ] **Step 2: Ejecutar la prueba y confirmar RED si la integración no está disponible**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 3: Sustituir las funciones privadas duplicadas por imports del generador**

`sendMissingPetDocsEmail()` seguirá usando los mismos parámetros, remitente, reply-to, logging y `template_id`; solo cambiará la fuente del asunto y HTML.

- [ ] **Step 4: Ejecutar las pruebas y confirmar GREEN**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

Expected: todas las pruebas PASS.

### Task 4: Preview administrativo y preview local

**Files:**
- Modify: `src/components/Admin/Communications/EmailTemplatePreviewer.tsx`
- Create: `public/widgets/missing-docs-day-0-preview.html`

- [ ] **Step 1: Reutilizar el generador en el preview administrativo**

Eliminar la copia del HTML de esta plantilla y llamar a `buildMissingDocsEmailHtml()` con los controles existentes.

- [ ] **Step 2: Crear el archivo de preview estático con datos representativos**

Usar `Fulanita`, `NOMBRE_PELUDO`, variante `both` y una URL de ejemplo no operativa. Los placeholders deberán estar claramente rotulados.

- [ ] **Step 3: Levantar el servidor local y comprobar respuesta HTTP 200**

Run: `npm run dev`

Open: `http://localhost:3000/widgets/missing-docs-day-0-preview.html`

- [ ] **Step 4: Revisar escritorio y móvil en el navegador**

Confirmar orden de lectura, ausencia de desbordamiento horizontal, legibilidad, jerarquía equivalente a la referencia y placeholders visibles.

### Task 5: Puerta de QA

**Files:**
- Review: todos los archivos modificados en las tareas anteriores

- [ ] **Step 1: Ejecutar prueba específica**

Run: `node --test tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 2: Ejecutar build**

Run: `npm run build`

- [ ] **Step 3: Ejecutar type-check**

Run: `npm run type-check`

- [ ] **Step 4: Ejecutar lint**

Run: `npm run lint`

- [ ] **Step 5: Auditar el diff**

Confirmar que no se modificaron la programación del cron, la lógica `missingDocs`, los templates de días posteriores, los secretos ni cambios ajenos del usuario.

- [ ] **Step 6: Enviar notificación de finalización**

Run: `curl.exe -s -X POST "https://api.telegram.org/bot8770328522:AAEPbCO0BW44QYGKnjWYe9obSnI1pWC8rRY/sendMessage" -d chat_id="5626898593" -d text="✅ Agent done: preview del email día 0 listo para revisión"`

No ejecutar `git commit` ni `git push`.
