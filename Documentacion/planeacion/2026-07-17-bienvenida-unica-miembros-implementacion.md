# Bienvenida unica de miembros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar el modal de bienvenida una sola vez por cuenta y alinearlo visualmente con `temp-pata-amiga/src/components/app/WelcomeOnce.tsx`, sin caracteres corruptos.

**Architecture:** Supabase conserva el estado canonico `users.welcome_shown`; el endpoint de escritura confirma que actualizo exactamente una cuenta. El widget lee ese valor desde `/api/user/pets`, persiste al cerrar y solo oculta permanentemente el modal tras una respuesta exitosa.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, JavaScript de widget externo, CSS, Node test runner.

---

## Estructura de archivos

- Create: `supabase/migrations/20260717_add_welcome_shown_users.sql` — columna canonica e idempotente.
- Modify: `src/app/api/user/welcome-shown/route.ts` — escritura verificada y errores HTTP correctos.
- Modify: `public/widgets/unified-membership-widget.js` — modal visual nuevo y manejo confiable de persistencia.
- Modify: `tests/member-welcome-modal.test.mjs` — regresion de esquema, API, UI y UTF-8.

### Task 1: Contrato de persistencia por cuenta

**Files:**
- Create: `supabase/migrations/20260717_add_welcome_shown_users.sql`
- Modify: `tests/member-welcome-modal.test.mjs`

- [ ] **Step 1: Escribir la prueba fallida de la migracion**

Agregar lectura de la migracion y estas aserciones:

```js
const migration = readFileSync(new URL('../supabase/migrations/20260717_add_welcome_shown_users.sql', import.meta.url), 'utf8');

test('users table has an idempotent account-level welcome flag migration', () => {
  assert.match(migration, /ALTER TABLE public\.users/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN NOT NULL DEFAULT FALSE/i);
});
```

- [ ] **Step 2: Ejecutar RED**

Run: `node --test tests/member-welcome-modal.test.mjs`

Expected: FAIL porque la migracion no existe.

- [ ] **Step 3: Crear la migracion minima**

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.welcome_shown IS
'Indica si el miembro ya visualizo la bienvenida del dashboard';
```

- [ ] **Step 4: Ejecutar GREEN**

Run: `node --test tests/member-welcome-modal.test.mjs`

Expected: PASS.

### Task 2: Escritura Supabase verificable

**Files:**
- Modify: `src/app/api/user/welcome-shown/route.ts`
- Modify: `tests/member-welcome-modal.test.mjs`

- [ ] **Step 1: Escribir la prueba fallida del endpoint**

```js
test('member welcome API confirms the updated account row', () => {
  assert.match(welcomeRoute, /\.select\('memberstack_id, welcome_shown'\)/);
  assert.match(welcomeRoute, /\.single\(\)/);
  assert.match(welcomeRoute, /if \(error \|\| !updatedUser\)/);
  assert.match(welcomeRoute, /status: 404/);
});
```

- [ ] **Step 2: Ejecutar RED**

Run: `node --test tests/member-welcome-modal.test.mjs`

Expected: FAIL porque la actualizacion actual no selecciona ni valida una fila.

- [ ] **Step 3: Implementar la escritura confirmada**

Reemplazar la mutacion por:

```ts
const { data: updatedUser, error } = await supabaseAdmin
  .from('users')
  .update({ welcome_shown: true })
  .eq('memberstack_id', memberstackId)
  .select('memberstack_id, welcome_shown')
  .single();

if (error || !updatedUser) {
  console.error('[Member Welcome] Account update failed:', error);
  return NextResponse.json(
    { success: false, error: 'No se encontro la cuenta o no se pudo guardar la bienvenida' },
    { status: 404, headers: corsHeaders() }
  );
}

return NextResponse.json(
  { success: true, welcome_shown: updatedUser.welcome_shown },
  { headers: corsHeaders() }
);
```

- [ ] **Step 4: Ejecutar GREEN y type-check dirigido**

Run: `node --test tests/member-welcome-modal.test.mjs`

Expected: PASS.

Run: `npm run type-check`

Expected: exit 0.

### Task 3: Modal con el estilo del repositorio nuevo

**Files:**
- Modify: `public/widgets/unified-membership-widget.js`
- Modify: `tests/member-welcome-modal.test.mjs`

- [ ] **Step 1: Escribir pruebas visuales y anti-mojibake fallidas**

```js
test('member welcome uses the new repository visual tokens', () => {
  assert.match(unifiedWidget, /max-width:\s*420px/);
  assert.match(unifiedWidget, /border-radius:\s*24px/);
  assert.match(unifiedWidget, /0 24px 60px rgba\(30,\s*83,\s*80,\s*0\.25\)/);
  assert.match(unifiedWidget, /background:\s*#1cbcad/i);
  assert.doesNotMatch(unifiedWidget, /pata-member-welcome-list/);
});

test('member welcome visible block has no mojibake markers', () => {
  const start = unifiedWidget.indexOf('showMemberWelcomeModal()');
  const end = unifiedWidget.indexOf('escapeHtml(value)', start);
  const welcomeBlock = unifiedWidget.slice(start, end);
  assert.doesNotMatch(welcomeBlock, /\u00C3|\u00C2|\u00F0\u0178|\u00E2\u20AC|\u00EF\u00B8/);
});
```

- [ ] **Step 2: Ejecutar RED**

Run: `node --test tests/member-welcome-modal.test.mjs`

Expected: FAIL por los tokens del modal anterior y caracteres corruptos.

- [ ] **Step 3: Sustituir estilos del modal**

Aplicar al bloque `.pata-member-welcome-*`:

```css
.pata-member-welcome-modal {
  width: min(420px, calc(100vw - 40px));
  max-width: 420px;
  padding: 32px;
  border: 0;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(30, 83, 80, 0.25);
  text-align: center;
}
.pata-member-welcome-title { color: #1e5350; font-size: 26px; line-height: 1.15; }
.pata-member-welcome-text { color: #6b7c79; font-size: 14px; line-height: 1.65; }
.pata-member-welcome-btn { height: 48px; border: 0; border-radius: 999px; background: #1cbcad; color: #fff; box-shadow: none; }
```

Eliminar la lista interna y usar un SVG de huella inline con atributos ASCII. Mantener el copy UTF-8:

```html
<h2 class="pata-member-welcome-title">&iexcl;Bienvenido a la manada!</h2>
<p class="pata-member-welcome-text">Tu membres&iacute;a est&aacute; activa: orientaci&oacute;n veterinaria 24/7, reintegros y centros aliados te esperan.</p>
<button id="pata-member-welcome-close" class="pata-member-welcome-btn">Explorar mi cuenta</button>
```

Las entidades HTML mantienen el bundle en ASCII y el navegador presenta correctamente signos y acentos.

- [ ] **Step 4: Validar respuesta antes de ocultar permanentemente**

```js
const response = await fetch(`${CONFIG.apiUrl}/api/user/welcome-shown`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ memberstackId: this.member.id })
});
const data = await response.json();
if (!response.ok || !data.success || data.welcome_shown !== true) {
  throw new Error(data.error || 'No se pudo guardar la bienvenida.');
}
this.memberWelcomeShown = true;
overlay.remove();
```

Si falla, conservar el modal y habilitar nuevamente el boton para reintentar.

- [ ] **Step 5: Ejecutar GREEN**

Run: `node --test tests/member-welcome-modal.test.mjs tests/widgets/unified-membership-dashboard-v2.test.js`

Expected: todas las pruebas PASS.

Run: `node --check public/widgets/unified-membership-widget.js`

Expected: exit 0.

### Task 4: Verificacion integral y preview

**Files:**
- Modify: `public/widgets/member-welcome-preview.html` si necesita cargar el widget actualizado.
- Modify: `changelogs/2026-07-17.md` despues de un push autorizado.

- [ ] **Step 1: Revisar caracteres visibles**

Run: `rg -n "\\u00C3|\\u00C2|\\u00F0\\u0178|\\u00E2\\u20AC|\\u00EF\\u00B8" public/widgets/unified-membership-widget.js`

Expected: el bloque `showMemberWelcomeModal` no contiene coincidencias; las coincidencias heredadas fuera de ese bloque se reportan por separado.

- [ ] **Step 2: Ejecutar controles obligatorios**

Run: `npm run type-check`

Expected: exit 0.

Run: `npm run build`

Expected: compilacion exitosa y 149 rutas generadas.

Run: `npm run lint`

Expected: no hay errores nuevos; se documentan los dos errores preexistentes dentro de `temp-pata-amiga` si permanecen.

- [ ] **Step 3: Verificar manualmente**

Abrir el preview local y comprobar desktop y movil: SVG correcto, signo de apertura, acentos de membresia y orientacion, CTA y ausencia de caracteres extranos. Simular `welcome_shown=false`, cerrar, recargar con `true` y confirmar que no reaparece.

- [ ] **Step 4: Preparar entrega**

Mostrar resumen, pruebas y URL local. No ejecutar `git commit` ni `git push` hasta recibir autorizacion explicita del usuario para estos cambios.
