# Pruebas de correos de documentación faltante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir al previsualizador administrativo una herramienta autenticada para ver y enviar una variante concreta del correo real de documentación faltante a un destinatario de prueba.

**Architecture:** Un contrato puro validará y normalizará los parámetros de prueba. Una API administrativa usará ese contrato y el generador canónico que ya consume el cron para devolver el preview o enviar mediante Resend. El previsualizador actual dejará de mantener una copia del HTML y consumirá la API para garantizar paridad.

**Tech Stack:** Next.js App Router, TypeScript, React 19, Resend, Node test runner, CSS Modules.

---

## Mapa de archivos

- Crear `src/utils/missing-pet-docs-admin-test.js`: contrato puro de validación y construcción del contenido canónico.
- Crear `src/utils/missing-pet-docs-admin-test.d.ts`: tipos TypeScript del contrato.
- Crear `src/app/api/admin/communications/missing-docs-test/route.ts`: autenticación, preview y envío de prueba.
- Modificar `src/components/Admin/Communications/EmailTemplatePreviewer.tsx`: editor, preview canónico y acción de envío.
- Modificar `src/components/Admin/Communications/EmailTemplatePreviewer.module.css`: estados y controles de envío.
- Crear `tests/admin/missing-pet-docs-test-contract.test.mjs`: validación y paridad del contenido.
- Crear `tests/admin/missing-pet-docs-admin-api.test.mjs`: contrato estático de seguridad de la API.
- Crear `tests/admin/missing-pet-docs-previewer.test.mjs`: integración estática del dashboard.

### Task 1: Contrato puro de la herramienta de prueba

**Files:**
- Create: `src/utils/missing-pet-docs-admin-test.js`
- Create: `src/utils/missing-pet-docs-admin-test.d.ts`
- Test: `tests/admin/missing-pet-docs-test-contract.test.mjs`

- [ ] **Step 1: Escribir pruebas fallidas de validación y contenido**

Las pruebas importarán `validateMissingDocsTestInput()` y `buildMissingDocsTestContent()`; comprobarán días y documentos permitidos, correo válido, URL HTTP/HTTPS, límites de nombres y que el asunto/HTML coincidan con `getMissingDocsSubject()` y `buildMissingDocsEmailHtml()`.

```js
const validInput = {
  recipientEmail: 'qa@pataamiga.mx',
  userName: 'Jorge QA',
  petName: 'Luna',
  followupDay: 10,
  missingDocs: 'photo',
  uploadUrl: 'https://app.pataamiga.mx/completar-documentacion'
};
assert.deepEqual(validateMissingDocsTestInput(validInput), { ok: true, value: validInput });
assert.throws(() => validateMissingDocsTestInput({ ...validInput, followupDay: 12 }), /día/i);
assert.throws(() => validateMissingDocsTestInput({ ...validInput, missingDocs: 'ine' }), /documento/i);
assert.throws(() => validateMissingDocsTestInput({ ...validInput, recipientEmail: 'no-es-correo' }), /correo/i);
assert.throws(() => validateMissingDocsTestInput({ ...validInput, uploadUrl: 'javascript:alert(1)' }), /URL/i);
```

- [ ] **Step 2: Ejecutar la prueba y verificar que falla**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs`

Expected: FAIL porque el módulo todavía no existe.

- [ ] **Step 3: Implementar el contrato mínimo**

El módulo exportará listas cerradas, normalizará el correo a minúsculas, recortará espacios y construirá el contenido exclusivamente mediante las funciones canónicas existentes. El `petIndex` simulado será `1` y nunca será recibido desde el cliente.

```js
const FOLLOWUP_DAYS = Object.freeze([0, 10, 13, 14, 15]);
const MISSING_DOC_TYPES = Object.freeze(['photo', 'certificate', 'both']);

function buildMissingDocsTestContent(input) {
  const { value } = validateMissingDocsTestInput(input);
  const params = { ...value, petIndex: 1 };
  return {
    ...value,
    subject: getMissingDocsSubject(value.petName, value.followupDay, value.missingDocs),
    html: buildMissingDocsEmailHtml(params),
    text: `${getMissingDocsMessage(value.petName, value.userName, value.followupDay, value.missingDocs).body}\n\nCompleta el perfil aquí: ${value.uploadUrl}`
  };
}
```

- [ ] **Step 4: Ejecutar la prueba y verificar que pasa**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs`

Expected: PASS.

### Task 2: API administrativa de preview y envío

**Files:**
- Create: `src/app/api/admin/communications/missing-docs-test/route.ts`
- Test: `tests/admin/missing-pet-docs-admin-api.test.mjs`

- [ ] **Step 1: Escribir una prueba estática inicialmente fallida**

La prueba verificará que la ruta usa `getAdminUser()` y `unauthorizedResponse()`, no importa Memberstack ni Supabase, no usa `CRON_SECRET`, valida `action`, construye contenido con `buildMissingDocsTestContent()` y envía a `[content.recipientEmail]` usando la identidad oficial configurada en `src/lib/resend.ts`.

- [ ] **Step 2: Ejecutar la prueba y verificar que falla**

Run: `node --test tests/admin/missing-pet-docs-admin-api.test.mjs`

Expected: FAIL porque la ruta todavía no existe.

- [ ] **Step 3: Implementar POST autenticado**

```ts
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin || ('isUnauthorized' in admin && admin.isUnauthorized)) return unauthorizedResponse();

  const body = await request.json();
  if (body.action !== 'preview' && body.action !== 'send') {
    return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
  }

  const content = buildMissingDocsTestContent(body);
  if (body.action === 'preview') {
    return NextResponse.json({ success: true, subject: content.subject, html: content.html });
  }

  if (!resend) return NextResponse.json({ success: false, error: 'Resend no configurado.' }, { status: 500 });
  const { data, error } = await resend.emails.send({
    from: `${MEMBERS_FROM_NAME} <${MEMBERS_FROM_EMAIL}>`,
    to: [content.recipientEmail],
    replyTo: REPLY_TO_EMAIL,
    subject: content.subject,
    html: content.html,
    text: content.text
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  console.info('[Admin MissingDocs Test]', { admin: admin.email, recipient: content.recipientEmail, day: content.followupDay, missingDocs: content.missingDocs, resendId: data?.id });
  return NextResponse.json({ success: true, id: data?.id, recipientEmail: content.recipientEmail });
}
```

Los errores de validación devolverán `400` sin exponer stack traces.

- [ ] **Step 4: Ejecutar las pruebas de contrato y API**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs tests/admin/missing-pet-docs-admin-api.test.mjs`

Expected: PASS.

### Task 3: Preview canónico y envío en el dashboard

**Files:**
- Modify: `src/components/Admin/Communications/EmailTemplatePreviewer.tsx`
- Modify: `src/components/Admin/Communications/EmailTemplatePreviewer.module.css`
- Test: `tests/admin/missing-pet-docs-previewer.test.mjs`

- [ ] **Step 1: Escribir una prueba estática inicialmente fallida**

La prueba comprobará que la plantilla `member-missing-docs` usa `adminFetch('/api/admin/communications/missing-docs-test')`, incluye `recipientEmail`, acciones `preview` y `send`, confirmación con el destinatario, bloqueo `isSending`, feedback accesible con `role="status"` y conserva los toggles móvil/escritorio.

- [ ] **Step 2: Ejecutar la prueba y verificar que falla**

Run: `node --test tests/admin/missing-pet-docs-previewer.test.mjs`

Expected: FAIL porque todavía no existe la integración.

- [ ] **Step 3: Sustituir el render duplicado por preview canónico**

Cuando `selectedTemplate.id === 'member-missing-docs'`, un efecto con debounce solicitará `{ action: 'preview', ...formState }`. Si responde correctamente, actualizará `previewHtml` y `previewSubject`; si falla conservará el HTML anterior y mostrará el error. Las demás plantillas seguirán usando `selectedTemplate.render(formState)`.

- [ ] **Step 4: Añadir destinatario y envío confirmado**

```ts
const handleSendMissingDocsTest = async () => {
  const recipientEmail = String(formState.recipientEmail || '').trim();
  if (!window.confirm(`¿Enviar esta prueba únicamente a ${recipientEmail}?`)) return;
  setIsSending(true);
  setSendFeedback(null);
  try {
    const response = await adminFetch('/api/admin/communications/missing-docs-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', ...formState })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible enviar la prueba.');
    setSendFeedback({ type: 'success', message: `Prueba enviada a ${result.recipientEmail}. ID: ${result.id || 'sin ID'}` });
  } catch (error) {
    setSendFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible enviar la prueba.' });
  } finally {
    setIsSending(false);
  }
};
```

- [ ] **Step 5: Añadir estilos y estados accesibles**

El formulario incorporará el correo obligatorio, botón naranja consistente con el sistema, spinner/estado `Enviando…`, feedback de éxito/error y una nota visible: “Este envío es de prueba y no modifica expedientes ni ejecuta el cron”.

- [ ] **Step 6: Ejecutar las pruebas de la funcionalidad**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs tests/admin/missing-pet-docs-admin-api.test.mjs tests/admin/missing-pet-docs-previewer.test.mjs tests/missing-pet-docs-email.test.mjs`

Expected: PASS.

### Task 4: Auditoría sistemática y puerta de calidad

**Files:**
- Review: `src/app/api/cron/missing-info-followup/route.ts`
- Review: todos los archivos modificados en Tasks 1–3.

- [ ] **Step 1: Auditar regresiones y seguridad**

Confirmar con `git diff` y búsquedas dirigidas que el cron no fue modificado, el nuevo endpoint no acepta `memberId`, no contiene `CRON_SECRET`, no consulta miembros y no puede enviar sin autenticación administrativa.

- [ ] **Step 2: Buscar inconsistencias activamente**

Revisar codificación UTF-8, tipos estrictos, accesibilidad del feedback, doble clic, respuestas no JSON y actualización tardía de previews. Corregir cualquier hallazgo antes de continuar.

- [ ] **Step 3: Ejecutar toda la verificación obligatoria**

Run, por separado:

```powershell
node --test tests/admin/missing-pet-docs-test-contract.test.mjs tests/admin/missing-pet-docs-admin-api.test.mjs tests/admin/missing-pet-docs-previewer.test.mjs tests/missing-pet-docs-email.test.mjs
npm run build
npm run type-check
npm run lint
```

Expected: todos terminan con código `0`.

- [ ] **Step 4: Preparar revisión local**

Resumir archivos, comportamiento y resultados de QA. No ejecutar `git commit` ni `git push`; solicitar autorización explícita al usuario después de que pueda revisar los cambios.

