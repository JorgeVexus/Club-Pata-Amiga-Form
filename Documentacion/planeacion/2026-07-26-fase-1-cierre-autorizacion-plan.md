# Fase 1 â€” Cierre de AutorizaciÃ³n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Work directly on `main`; do not create a branch or worktree. Do not commit or push without the user's explicit authorization.

**Goal:** Proteger las operaciones sensibles de miembros, solicitudes de apoyo, embajadores, centros de bienestar y administraciÃ³n sin cambiar sus contratos pÃºblicos ni interrumpir usuarios activos.

**Architecture:** Crear una capa neutral de identidad que verifica el JWT actual de Memberstack y resuelve propiedad/roles en Supabase. Actualizar los clientes para enviar el token antes de volver obligatoria la autorizaciÃ³n en las API Routes; conservar IDs existentes solamente como comprobaciÃ³n de consistencia.

**Tech Stack:** Next.js 16 App Router, TypeScript, Memberstack JWT, Supabase Service Role, Node test runner.

---

## Estructura de archivos

- Create: `src/lib/actor-context.ts` â€” tipos neutrales de actor y respuestas 401/403.
- Create: `src/lib/memberstack-token.ts` â€” extracciÃ³n y verificaciÃ³n centralizada del Bearer token.
- Create: `src/lib/member-auth.ts` â€” resoluciÃ³n de miembro y propiedad desde Supabase.
- Create: `src/lib/wellness-auth.ts` â€” resoluciÃ³n de centro desde el miembro autenticado.
- Modify: `src/lib/ambassador-auth.ts` â€” reutilizar el verificador central.
- Modify: `src/lib/admin-auth.ts` â€” sustituir el encabezado falsificable por JWT verificado.
- Modify: `src/utils/admin-fetch.ts` â€” adjuntar JWT y conservar temporalmente el encabezado legacy.
- Modify: widgets de perfil/configuraciÃ³n/solidaridad/centro â€” adjuntar JWT en llamadas sensibles.
- Modify: API Routes listadas en las tareas 4â€“7 â€” exigir actor y propiedad.
- Create: `tests/auth/*.test.mjs` â€” contratos estÃ¡ticos y unitarios de autenticaciÃ³n/autorizaciÃ³n.
- Create: `Documentacion/seguridad/matriz-autorizacion-endpoints.md` â€” matriz final actor/permiso/propiedad.

## Task 1: Verificador central de Memberstack

**Files:**

- Create: `src/lib/memberstack-token.ts`
- Modify: `src/lib/ambassador-auth.ts`
- Test: `tests/auth/memberstack-token-contract.test.mjs`

- [ ] **Step 1: Escribir la prueba fallida**

La prueba debe leer ambos archivos y exigir un Ãºnico verificador, extracciÃ³n estricta de Bearer, `cache: 'no-store'`, soporte para ambas variables secretas y ausencia de una segunda llamada directa al endpoint de verificaciÃ³n en `ambassador-auth.ts`.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokenSource = readFileSync("src/lib/memberstack-token.ts", "utf8");
const ambassadorSource = readFileSync("src/lib/ambassador-auth.ts", "utf8");

test("centralizes strict Memberstack bearer verification", () => {
  assert.match(tokenSource, /export async function verifyMemberstackRequest/);
  assert.match(
    tokenSource,
    /authorization\.match\(\/\^Bearer\\\\s\+\(\.\+\)\$\/i\)/,
  );
  assert.match(tokenSource, /cache:\s*'no-store'/);
  assert.match(tokenSource, /MEMBERSTACK_ADMIN_SECRET_KEY/);
  assert.match(tokenSource, /MEMBERSTACK_SECRET_KEY/);
  assert.match(
    ambassadorSource,
    /import \{ verifyMemberstackRequest \} from '@\/lib\/memberstack-token'/,
  );
  assert.doesNotMatch(
    ambassadorSource,
    /admin\.memberstack\.com\/members\/verify-token/,
  );
});
```

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/memberstack-token-contract.test.mjs`
Expected: FAIL porque `src/lib/memberstack-token.ts` no existe.

- [ ] **Step 3: Implementar el verificador mÃ­nimo**

```ts
import { NextRequest } from "next/server";

export async function verifyMemberstackRequest(
  request: NextRequest,
): Promise<string | null> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  const secretKey =
    process.env.MEMBERSTACK_ADMIN_SECRET_KEY ||
    process.env.MEMBERSTACK_SECRET_KEY;
  if (!token || !secretKey) return null;

  try {
    const response = await fetch(
      "https://admin.memberstack.com/members/verify-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": secretKey,
        },
        body: JSON.stringify({ token }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.id || payload?.data?.id || payload?.member?.id || null;
  } catch (error) {
    console.error("[MemberstackToken] Token verification failed:", error);
    return null;
  }
}
```

Actualizar `src/lib/ambassador-auth.ts` para importar esta funciÃ³n y eliminar su implementaciÃ³n duplicada.

- [ ] **Step 4: Verificar GREEN**

Run: `node --test tests/auth/memberstack-token-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Punto de revisiÃ³n**

Run: `git diff --check` y revisar que no haya cambios fuera de los tres archivos de esta tarea. No hacer commit.

## Task 2: Contexto neutral y autenticaciÃ³n de miembros

**Files:**

- Create: `src/lib/actor-context.ts`
- Create: `src/lib/member-auth.ts`
- Test: `tests/auth/member-actor-contract.test.mjs`

- [ ] **Step 1: Escribir la prueba fallida**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member actor derives identity from verified token and checks supplied ids", () => {
  const actor = readFileSync("src/lib/actor-context.ts", "utf8");
  const member = readFileSync("src/lib/member-auth.ts", "utf8");
  assert.match(
    actor,
    /type ActorRole = 'member' \| 'ambassador' \| 'wellness_center' \| 'admin'/,
  );
  assert.match(member, /verifyMemberstackRequest\(request\)/);
  assert.match(member, /\.eq\('memberstack_id', memberstackId\)/);
  assert.match(
    member,
    /expectedMemberstackId && expectedMemberstackId !== memberstackId/,
  );
  assert.match(member, /status:\s*401/);
  assert.match(member, /status:\s*403/);
});
```

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/member-actor-contract.test.mjs`
Expected: FAIL porque los mÃ³dulos no existen.

- [ ] **Step 3: Implementar contratos**

`actor-context.ts` debe exportar `ActorRole`, `ActorContext`, `actorFailure(status, error)` y tipos discriminados `{ ok: true, actor } | { ok: false, response }`.

`member-auth.ts` debe:

```ts
const memberstackId = await verifyMemberstackRequest(request);
if (!memberstackId) return actorFailure(401, "SesiÃ³n invÃ¡lida o expirada");
if (expectedMemberstackId && expectedMemberstackId !== memberstackId) {
  return actorFailure(403, "No tienes acceso a esta cuenta");
}
const { data: user, error } = await supabaseAdmin
  .from("users")
  .select("id, memberstack_id, role, approval_status, membership_status")
  .eq("memberstack_id", memberstackId)
  .maybeSingle();
```

Si Supabase falla, responder 500; si no existe usuario, 403; si existe, devolver `ActorContext` con `role: 'member'`, `supabaseUserId`, `memberstackId` y permiso `member:self`.

- [ ] **Step 4: Verificar GREEN**

Run: `node --test tests/auth/member-actor-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Punto de revisiÃ³n**

Run: `npm run type-check`. Expected: exit 0. No hacer commit.

## Task 3: AutenticaciÃ³n administrativa real

**Files:**

- Modify: `src/lib/admin-auth.ts`
- Modify: `src/utils/admin-fetch.ts`
- Test: `tests/auth/admin-jwt-auth.test.mjs`

- [ ] **Step 1: Escribir la prueba fallida**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin auth verifies bearer token before resolving role", () => {
  const server = readFileSync("src/lib/admin-auth.ts", "utf8");
  const client = readFileSync("src/utils/admin-fetch.ts", "utf8");
  assert.match(server, /verifyMemberstackRequest\(req\)/);
  assert.doesNotMatch(
    server,
    /const memberstackId = req\.headers\.get\('x-admin-memberstack-id'\)/,
  );
  assert.match(client, /getMemberCookie/);
  assert.match(client, /Authorization:\s*`Bearer \$\{token\}`/);
});
```

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/admin-jwt-auth.test.mjs`
Expected: FAIL porque el servidor confÃ­a en `x-admin-memberstack-id` y el cliente no envÃ­a JWT.

- [ ] **Step 3: Implementar servidor y cliente**

En `getAdminUser`, resolver el ID exclusivamente mediante `verifyMemberstackRequest(req)`. Mantener la consulta de rol y devolver 401 si no hay identidad o el rol no es admin/super_admin.

En `adminFetch`, obtener:

```ts
const token =
  typeof window !== "undefined" &&
  (window as any).$memberstackDom?.getMemberCookie
    ? await Promise.resolve((window as any).$memberstackDom.getMemberCookie())
    : "";
```

Adjuntar `Authorization` cuando exista. Conservar `x-admin-memberstack-id` durante esta fase solo para compatibilidad/diagnÃ³stico; el servidor no debe confiar en Ã©l.

- [ ] **Step 4: Verificar GREEN**

Run: `node --test tests/auth/admin-jwt-auth.test.mjs`
Expected: PASS.

- [ ] **Step 5: RegresiÃ³n admin**

Run: `node --test tests/admin/*.test.mjs tests/admin/*.test.js` usando la expansiÃ³n PowerShell de archivos si el glob no se resuelve. Expected: todos los tests admin existentes pasan.

## Task 4: Proteger cancelaciÃ³n y reactivaciÃ³n de miembros

**Files:**

- Modify: `src/app/api/user/deactivate/route.ts`
- Modify: `src/app/api/user/reactivate/route.ts`
- Modify: `public/widgets/user-profile-widget.js`
- Modify: `public/widgets/user-settings-widget.js`
- Test: `tests/auth/member-cancellation-authorization.test.mjs`

- [ ] **Step 1: Escribir pruebas negativas**

La prueba debe exigir `requireMemberActor(request, memberstackId)` antes de cualquier consulta/llamada a Stripe y exigir que los widgets de perfil y configuraciÃ³n obtengan `getMemberCookie()` y adjunten Bearer en cancelaciÃ³n y reactivaciÃ³n.

```js
assert.match(deactivate, /requireMemberActor\(request,\s*memberstackId\)/);
assert.ok(deactivate.indexOf('requireMemberActor') < deactivate.indexOf(\".from('users')\"));
assert.match(reactivate, /requireMemberActor\(request,\s*memberstackId\)/);
assert.ok(reactivate.indexOf('requireMemberActor') < reactivate.indexOf('stripe.subscriptions.list'));
assert.match(widget, /Authorization:\s*`Bearer \$\{[^}]+\}`/);
```

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/member-cancellation-authorization.test.mjs`
Expected: FAIL porque las rutas aÃºn confÃ­an en el cuerpo.

- [ ] **Step 3: Implementar guardas**

DespuÃ©s de validar que `memberstackId` existe:

```ts
const auth = await requireMemberActor(request, memberstackId);
if (!auth.ok) return auth.response;
```

Usar `auth.actor.memberstackId` para todas las consultas y sincronizaciones posteriores.

- [ ] **Step 4: Actualizar widget**

Crear un helper local que obtenga `getMemberCookie()` y combine headers sin eliminar `Content-Type`. Usarlo en cancelaciÃ³n y reactivaciÃ³n.

- [ ] **Step 5: Verificar GREEN y regresiÃ³n**

Run:

```text
node --test tests/auth/member-cancellation-authorization.test.mjs
node --test tests/membership-cancellation-utils.test.mjs tests/stripe-subscription-period.test.mjs
```

Expected: PASS en ambas ejecuciones.

## Task 5: Proteger solicitudes de apoyo y documentos admin

**Files:**

- Modify: `src/app/api/solidarity/request/route.ts`
- Modify: `src/app/api/admin/solidarity/requests/[id]/route.ts`
- Modify: `public/widgets/solidarity-client.js`
- Modify: `public/widgets/unified-membership-widget.js`
- Test: `tests/auth/solidarity-authorization.test.mjs`

- [ ] **Step 1: Escribir prueba fallida**

Exigir que la creaciÃ³n llame `requireMemberActor(request, memberstackId)` antes de leer usuario/mascota, que la ruta admin llame `getAdminUser` antes de generar URLs firmadas, y que ambos clientes adjunten Bearer.

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/solidarity-authorization.test.mjs`
Expected: FAIL en los contratos de servidor y cliente.

- [ ] **Step 3: Proteger creaciÃ³n**

Resolver actor, usar `auth.actor.supabaseUserId` para cargar usuario y conservar la comprobaciÃ³n `pet.owner_id === user.id`. Rechazar discrepancia de `memberstackId` con 403.

- [ ] **Step 4: Proteger documentos admin**

Al inicio del `GET`:

```ts
const admin = await getAdminUser(request);
if (!admin || ("isUnauthorized" in admin && admin.isUnauthorized)) {
  return unauthorizedResponse();
}
```

Solo despuÃ©s consultar la solicitud y generar URLs firmadas.

- [ ] **Step 5: Actualizar clientes y verificar**

Agregar un `tokenProvider` a `SolidarityClient` y enviar `Authorization` mediante su mÃ©todo `request`. El cliente embebido del widget unificado debe recibir el token actual sin introducir Supabase en navegador.

Run:

```text
node --test tests/auth/solidarity-authorization.test.mjs
node --test tests/widgets/solidarity-client.test.js tests/widgets/solidarity-request-bank-validation.test.js tests/solidarity-balance.test.mjs tests/solidarity-cycle.test.mjs
```

Expected: PASS.

## Task 6: Proteger centros de bienestar

**Files:**

- Create: `src/lib/wellness-auth.ts`
- Modify: `src/app/api/wellness/cancel/route.ts`
- Modify: `public/widgets/wellness-center-widget.js`
- Modify: `src/app/api/admin/wellness/[id]/status/route.ts`
- Test: `tests/auth/wellness-authorization.test.mjs`

- [ ] **Step 1: Escribir prueba fallida**

Exigir que el centro se resuelva mediante token y `.eq('memberstack_id', memberstackId)`, que cancelaciÃ³n compare el ID legacy, que el widget envÃ­e Bearer y que la mutaciÃ³n admin llame `getAdminUser`.

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/wellness-authorization.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implementar `requireWellnessActor`**

Verificar token, comparar `expectedMemberstackId`, cargar `wellness_centers` por `memberstack_id` y devolver `ActorContext` con `wellnessCenterId` y permiso `wellness:self`.

- [ ] **Step 4: Proteger rutas**

En cancelaciÃ³n usar el centro resuelto y actualizar por `id`, no por el valor del cuerpo. En status admin autenticar antes de consultar o enviar correo.

- [ ] **Step 5: Actualizar widget y verificar**

Obtener una vez `getMemberCookie()` durante inicializaciÃ³n, almacenarlo solo en memoria y adjuntarlo a cancelaciÃ³n. No guardarlo en `localStorage`.

Run:

```text
node --test tests/auth/wellness-authorization.test.mjs
node --test tests/wellness-center-widget-v2.test.mjs tests/wellness-center-widget-pending.test.mjs tests/wellness-registration-v2.test.mjs
```

Expected: las pruebas de autorizaciÃ³n pasan; `wellness-registration-v2` seguirÃ¡ registrÃ¡ndose como deuda previa hasta su tarea especÃ­fica de reparaciÃ³n.

## Task 7: Proteger comisiones, payouts y administraciÃ³n de embajadores

**Files:**

- Modify: `src/app/api/referrals/[id]/route.ts`
- Modify: `src/app/api/payouts/[id]/route.ts`
- Modify: `src/app/api/admin/ambassadors/[id]/enable-code-change/route.ts`
- Modify: `src/app/api/admin/ambassadors/sync-memberstack/route.ts`
- Test: `tests/auth/ambassador-finance-admin-authorization.test.mjs`

- [ ] **Step 1: Escribir prueba fallida**

Para las cuatro rutas exigir `getAdminUser(request)` antes de cualquier `.select`, `.update`, cÃ¡lculo de comisiÃ³n o envÃ­o. Exigir rechazo de `isUnauthorized`.

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/ambassador-finance-admin-authorization.test.mjs`
Expected: FAIL porque las rutas no estÃ¡n protegidas consistentemente.

- [ ] **Step 3: AÃ±adir guardas**

Usar:

```ts
const admin = await getAdminUser(request);
if (!admin || ("isUnauthorized" in admin && admin.isUnauthorized)) {
  return unauthorizedResponse();
}
```

No cambiar todavÃ­a cÃ¡lculos, estados o transacciones; corresponden a la Fase 2.

- [ ] **Step 4: Verificar GREEN**

Run:

```text
node --test tests/auth/ambassador-finance-admin-authorization.test.mjs
node --test tests/widgets/ambassador-dashboard-security.test.js tests/widgets/ambassador-dashboard-v2.test.js
```

Expected: autorizaciÃ³n PASS; la regresiÃ³n responsive preexistente puede seguir fallando hasta Task 9.

- [ ] **Step 5: Punto de revisiÃ³n**

Ejecutar un barrido de mutaciones Service Role sin guardas. Clasificar explÃ­citamente cada excepciÃ³n pÃºblica (registro, webhook firmado, catÃ¡logo o lead) en la matriz.

## Task 8: Matriz de autorizaciÃ³n y barrido completo

**Files:**

- Create: `Documentacion/seguridad/matriz-autorizacion-endpoints.md`
- Create: `tests/auth/service-role-route-audit.test.mjs`

- [ ] **Step 1: Escribir prueba fallida**

La prueba recorrerÃ¡ `src/app/api/**/route.ts`; toda ruta que combine Service Role con POST/PUT/PATCH/DELETE deberÃ¡ contener una guarda reconocida o estar en una lista cerrada y comentada de endpoints pÃºblicos.

- [ ] **Step 2: Verificar RED**

Run: `node --test tests/auth/service-role-route-audit.test.mjs`
Expected: FAIL mostrando rutas no clasificadas.

- [ ] **Step 3: Clasificar rutas**

La allowlist solo podrÃ¡ incluir:

- webhooks con firma criptogrÃ¡fica verificada;
- registro pÃºblico con validaciÃ³n y rate-limit documentados;
- formularios de leads/newsletter sin acceso a datos privados;
- endpoints de catÃ¡logos sin mutaciÃ³n sensible.

Toda otra ruta deberÃ¡ usar una guarda real.

- [ ] **Step 4: Documentar matriz**

Para cada endpoint registrar: mÃ©todo, actor, credencial, propiedad, datos sensibles, respuesta 401, respuesta 403 y excepciÃ³n pÃºblica justificada.

- [ ] **Step 5: Verificar GREEN**

Run: `node --test tests/auth/service-role-route-audit.test.mjs`
Expected: PASS con cero rutas sin clasificar.

## Task 9: Reparar las tres regresiones existentes

**Files:**

- Modify: `src/app/actions/user.actions.ts`
- Modify: `src/components/WellnessForm/WellnessComplementaryForm.tsx`
- Modify: `public/widgets/ambassador-widget.js`
- Test: pruebas existentes correspondientes

- [ ] **Step 1: Confirmar RED actual**

Run:

```text
node --test tests/user-actions-memberstack-id.test.mjs
node --test tests/wellness-registration-v2.test.mjs
node --test tests/widgets/ambassador-dashboard-v2.test.js
```

Expected: un fallo en cada archivo por los contratos ya documentados.

- [ ] **Step 2: Reparar resoluciÃ³n de Memberstack**

Restaurar en `getPetsByUserId` la selecciÃ³n:

```ts
.select('id, memberstack_id, first_name, last_name, last_admin_response, action_required_fields, membership_status')
```

Cuando el argumento sea UUID de Supabase, usar el `memberstack_id` resuelto para consultar mascotas y Memberstack.

- [ ] **Step 3: Reparar guardado complementario**

Restaurar la llamada relativa exacta:

```ts
fetch("/api/wellness/update", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

Conservar el payload y feedback actuales; no rediseÃ±ar el componente.

- [ ] **Step 4: Reparar navegaciÃ³n mÃ³vil**

Dentro de `@media(max-width:760px)` definir:

```css
.amb-v2-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: visible;
}
```

- [ ] **Step 5: Verificar GREEN**

Repetir los tres comandos del Step 1. Expected: todos PASS.

## Task 10: QA sistemÃ¡tico y handoff

**Files:**

- Modify: `Documentacion/auditorias/2026-07-26-auditoria-integral-flujos.md`
- Create: `Documentacion/seguridad/2026-07-26-verificacion-fase-1.md`

- [ ] **Step 1: AuditorÃ­a de regresiÃ³n**

Revisar `git diff` archivo por archivo; confirmar que no se cambiaron montos, porcentajes, lÃ­mites, tablas ni estados funcionales en esta fase.

- [ ] **Step 2: Bug hunting**

Buscar:

```text
x-admin-memberstack-id usado como identidad server-side
memberstackId del body usado antes de una guarda
Service Role + mutaciÃ³n sin guarda
URLs firmadas generadas antes de autenticar
tokens almacenados en localStorage
```

Registrar cero hallazgos o cada excepciÃ³n justificada.

- [ ] **Step 3: Suite completa**

Ejecutar todos los `.test.js`, `.test.mjs`, `.spec.js` y `.spec.mjs` bajo `tests/` mediante una lista PowerShell explÃ­cita. Expected: 0 fallos.

- [ ] **Step 4: Gates obligatorios**

Run, por separado:

```text
npm run build
npm run type-check
npm run lint
```

Expected: build y type-check exit 0; lint 0 errores. Registrar el conteo de warnings sin ocultarlo.

- [ ] **Step 5: Documentar rollback y sandbox**

El informe debe enumerar archivos, endpoints protegidos, respuestas 401/403, pruebas, variables requeridas, rollback conjunto cliente/servidor y casos que todavÃ­a requieren staging.

- [ ] **Step 6: RevisiÃ³n del usuario**

Mostrar resumen y `git status`; no ejecutar `git commit` ni `git push`. Solicitar autorizaciÃ³n especÃ­fica si el usuario quiere commit.

- [ ] **Step 7: NotificaciÃ³n**

Ejecutar la notificaciÃ³n de Telegram exigida por `AGENTS.md` con una lÃ­nea que indique que Fase 1 estÃ¡ lista para revisiÃ³n.
