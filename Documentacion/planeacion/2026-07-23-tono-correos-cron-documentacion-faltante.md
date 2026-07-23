# Tono de correos de cron para documentación faltante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Actualizar el tono, asuntos y textos dinámicos de los correos de seguimiento por foto/certificado faltante sin cambiar el diseño visual existente, asegurando que el preview del admin y el envío de prueba usen exactamente el mismo generador que el cron.

**Architecture:** Se conservará el `buildBrandedEmailShell()` actual y se moverá toda la variación al modelo de contenido de `missing-pet-docs-email.js`: asunto por día, cuerpo por día y fragmentos dinámicos según falte foto, certificado o ambos. Los tests se reescribirán para validar el contenido real del generador compartido, evitando expectativas obsoletas del diseño anterior.

**Tech Stack:** Node test runner, utilidades JS existentes, Next.js admin preview, Resend integration existente.

---

### Task 1: Reescribir cobertura de tests del generador de correos

**Files:**
- Modify: `tests/missing-pet-docs-email.test.mjs`
- Test: `tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
test('day 0 usa el nuevo tono y asunto cuando faltan ambos documentos', () => {
    const html = buildMissingDocsEmailHtml({ ...base, followupDay: 0, missingDocs: 'both' });
    assert.match(html, /Nos da much[íi]simo gusto que ya seas parte de la manada/i);
    assert.match(html, /SU FOTO M[ÁA]S GUAPA/i);
    assert.match(html, /SU CERTIFICADO M[ÉE]DICO/i);
    assert.match(getMissingDocsSubject('NOMBRE_PELUDO', 0, 'both'), /perfil de NOMBRE_PELUDO/i);
});

test('adapta el contenido a solo foto o solo certificado', () => {
    const photoHtml = buildMissingDocsEmailHtml({ ...base, followupDay: 13, missingDocs: 'photo' });
    const certHtml = buildMissingDocsEmailHtml({ ...base, followupDay: 13, missingDocs: 'certificate' });

    assert.match(photoHtml, /Solo falta este detalle/i);
    assert.match(photoHtml, /Su FOTO/i);
    assert.doesNotMatch(photoHtml, /CERTIFICADO/i);

    assert.match(certHtml, /Solo falta este detalle/i);
    assert.match(certHtml, /Su CERTIFICADO M[ÉE]DICO/i);
    assert.doesNotMatch(certHtml, /FOTO \(para reconocerlo al momento\)/i);
});

test('cada día usa el nuevo mensaje de urgencia y CTA dentro del shell actual', () => {
    for (const followupDay of [10, 13, 14, 15]) {
        const html = buildMissingDocsEmailHtml({ ...base, followupDay, missingDocs: 'both' });
        assert.match(html, /Club Pata Amiga/);
        assert.match(html, /Completar perfil|DEJARLO listo ahora|COMPLETAR perfil ahora/i);
    }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/missing-pet-docs-email.test.mjs`
Expected: FAIL porque el generador actual todavía contiene el tono y asuntos anteriores.

- [ ] **Step 3: Write minimal implementation support in tests**

```js
const expectedUrgencyByDay = {
    10: /A[ÚU]N TENEMOS 10 D[ÍI]AS/i,
    13: /Quedan 3 D[ÍI]AS/i,
    14: /Quedan 2 D[ÍI]AS/i,
    15: /[ÚU]LTIMO D[ÍI]A/i,
};
```

- [ ] **Step 4: Run test to verify the failure stays focused**

Run: `node --test tests/missing-pet-docs-email.test.mjs`
Expected: FAIL por contenido faltante, no por errores de sintaxis.

### Task 2: Actualizar el modelo de contenido del generador compartido

**Files:**
- Modify: `src/utils/missing-pet-docs-email.js`
- Modify: `src/utils/missing-pet-docs-email.d.ts`
- Test: `tests/missing-pet-docs-email.test.mjs`

- [ ] **Step 1: Implement dynamic content helpers**

```js
function getMissingDocsCopy(day, missing, petName) {
    return {
        subject: '...',
        headline: '...',
        body: '...',
        ctaLabel: '...',
        signoffLead: '...',
        missingSectionTitle: '...',
        docCards: {
            photo: { title: '...', description: '...' },
            certificate: { title: '...', description: '...' },
        },
    };
}
```

- [ ] **Step 2: Keep the existing shell and thread the new copy through it**

```js
return buildBrandedEmailShell({
    firstName,
    headline: escapeHtml(message.headline),
    body: message.body,
    missingRows,
    uploadUrl,
    petName,
    ctaLabel: message.ctaLabel,
    helperText: message.helperText,
    signoffLead: message.signoffLead,
});
```

- [ ] **Step 3: Update the document cards to adapt to photo/certificate/both**

```js
function buildMissingRows(petName, missingDocs, cardCopy) {
    // Render only the cards that apply and use day-aware copy
}
```

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/missing-pet-docs-email.test.mjs`
Expected: PASS

### Task 3: Validar que el admin preview/envío de prueba siga usando el mismo generador

**Files:**
- Modify: `tests/admin/missing-pet-docs-test-contract.test.mjs`
- Test: `tests/admin/missing-pet-docs-test-contract.test.mjs`

- [ ] **Step 1: Write the failing contract assertions**

```js
test('el contenido de prueba refleja el nuevo tono y asunto compartidos', () => {
    const content = buildMissingDocsTestContent(validInput);
    assert.match(content.subject, /10 d[íi]as|Luna/i);
    assert.match(content.html, /muy buenos d[íi]as juntos/i);
});
```

- [ ] **Step 2: Run test to verify it fails or protects integration**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs`
Expected: FAIL si el contrato no refleja el nuevo copy; PASS una vez alineado.

- [ ] **Step 3: Adjust tests only if the shared generator output changed intentionally**

```js
assert.equal(
    content.html,
    buildMissingDocsEmailHtml(canonicalParams),
);
```

- [ ] **Step 4: Run the focused contract test**

Run: `node --test tests/admin/missing-pet-docs-test-contract.test.mjs`
Expected: PASS

### Task 4: Verificación de regresión y handoff

**Files:**
- No code changes expected unless verification finds issues

- [ ] **Step 1: Run the full targeted email test set**

Run: `node --test tests/missing-pet-docs-email.test.mjs tests/admin/missing-pet-docs-test-contract.test.mjs`
Expected: PASS

- [ ] **Step 2: Run required project verification**

Run: `npm run build`
Expected: PASS

Run: `npm run type-check`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Notify readiness**

Run: `curl.exe -s -X POST "https://api.telegram.org/bot8770328522:AAEPbCO0BW44QYGKnjWYe9obSnI1pWC8rRY/sendMessage" -d chat_id="5626898593" -d text="✅ Agent done: updated missing pet docs cron email tone, preview, and subjects for admin testing"`
Expected: Telegram notification sent successfully.
