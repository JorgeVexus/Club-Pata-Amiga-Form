# Endurecimiento de emisión de magic tokens — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Los pasos usan casillas para seguimiento.

**Objetivo:** Exigir una sesión Memberstack del mismo miembro antes de crear un magic token, manteniendo intactos el registro, los tokens existentes y el fallback del widget.

**Arquitectura:** El widget reutiliza `window.$memberstackDom.getMemberCookie()` para adjuntar el JWT. La API reutiliza `requireMemberActor(request, memberstackId)` como límite central de identidad antes de generar bytes aleatorios o escribir con la service role.

**Stack:** Next.js 15 App Router, TypeScript, Memberstack, Supabase, JavaScript de widget y `node:test`.

---

## Mapa de archivos

- Modificar `src/app/api/auth/magic-token/route.ts`: autorizar al miembro y aceptar `Authorization` en CORS.
- Modificar `public/widgets/unified-membership-widget.js`: obtener el JWT, enviarlo y conservar el fallback.
- Crear `tests/auth/magic-token-issuance-security.test.mjs`: contrato de regresión de emisión.
- Modificar `Documentacion/seguridad/2026-07-26-auditoria-magic-links-y-cargas.md`: cerrar el hallazgo P1 de emisión y registrar riesgos restantes.
- Conservar `Documentacion/planeacion/2026-07-26-endurecimiento-emision-magic-token-diseno.md`: diseño aprobado.
- Conservar este archivo como plan ejecutado.

### Tarea 1: Crear la prueba RED del contrato de autorización

**Archivos:**

- Crear: `tests/auth/magic-token-issuance-security.test.mjs`
- Leer: `src/app/api/auth/magic-token/route.ts`
- Leer: `public/widgets/unified-membership-widget.js`

- [ ] **Paso 1: escribir la prueba fallida**

Crear una prueba estática coherente con la suite de seguridad existente:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync('src/app/api/auth/magic-token/route.ts', 'utf8');
const widgetSource = fs.readFileSync('public/widgets/unified-membership-widget.js', 'utf8');

test('magic-token issuance authorizes the requested member before generating or inserting', () => {
  assert.match(routeSource, /import\s+\{\s*requireMemberActor\s*\}\s+from\s+'@\/lib\/member-auth'/);
  assert.match(routeSource, /requireMemberActor\(request,\s*memberstackId\)/);

  const authorizationIndex = routeSource.indexOf('requireMemberActor(request, memberstackId)');
  const tokenIndex = routeSource.indexOf('crypto.randomBytes(32)');
  const insertIndex = routeSource.indexOf(".from('magic_tokens')");

  assert.ok(authorizationIndex >= 0);
  assert.ok(authorizationIndex < tokenIndex);
  assert.ok(authorizationIndex < insertIndex);
});

test('magic-token CORS accepts the bearer authorization header', () => {
  assert.match(routeSource, /'Access-Control-Allow-Headers':\s*'Content-Type,\s*Authorization'/);
});

test('membership widget forwards the active Memberstack JWT when requesting a magic token', () => {
  assert.match(widgetSource, /getMemberCookie\(\)/);
  assert.match(widgetSource, /Authorization:\s*'Bearer '\s*\+\s*token/);
  assert.match(widgetSource, /if\s*\(!token\)\s*\{\s*fallback\(email\)/);
});
```

- [ ] **Paso 2: ejecutar la prueba y verificar RED**

Ejecutar:

```powershell
node --test tests/auth/magic-token-issuance-security.test.mjs
```

Resultado esperado: tres fallas porque la ruta todavía no autoriza, CORS no acepta `Authorization` y el widget no adjunta el JWT en esta llamada.

### Tarea 2: Autorizar la emisión en el servidor

**Archivos:**

- Modificar: `src/app/api/auth/magic-token/route.ts`
- Probar: `tests/auth/magic-token-issuance-security.test.mjs`

- [ ] **Paso 1: importar el límite central de autorización**

Agregar:

```ts
import { requireMemberActor } from '@/lib/member-auth';
```

- [ ] **Paso 2: habilitar Authorization en CORS**

Cambiar el encabezado a:

```ts
'Access-Control-Allow-Headers': 'Content-Type, Authorization',
```

- [ ] **Paso 3: verificar identidad antes de generar o insertar**

Después de validar `memberstackId` y email, y antes del primer `crypto.randomBytes`, agregar:

```ts
const auth = await requireMemberActor(request, memberstackId);
if (!auth.ok) {
    return auth.response;
}
```

No modificar `GET`, el formato de respuesta, la expiración ni el registro insertado.

- [ ] **Paso 4: ejecutar la prueba enfocada**

Ejecutar:

```powershell
node --test tests/auth/magic-token-issuance-security.test.mjs
```

Resultado esperado: la prueba del servidor y CORS avanzan; la del widget continúa fallando hasta la tarea siguiente.

### Tarea 3: Adjuntar el JWT en el widget sin romper el fallback

**Archivos:**

- Modificar: `public/widgets/unified-membership-widget.js`
- Probar: `tests/auth/magic-token-issuance-security.test.mjs`

- [ ] **Paso 1: convertir la generación en una operación que resuelve la sesión**

Dentro de `generateAndRedirect(memberId, email, customFields)`, resolver:

```js
var tokenPromise = window.$memberstackDom && window.$memberstackDom.getMemberCookie
    ? Promise.resolve(window.$memberstackDom.getMemberCookie())
    : Promise.resolve('');
```

- [ ] **Paso 2: conservar el fallback si no existe sesión**

Antes de llamar a `fetch`:

```js
tokenPromise.then(function(token) {
    if (!token) {
        fallback(email);
        return;
    }
```

La cadena debe conservar `.catch(function() { fallback(email); })`.

- [ ] **Paso 3: adjuntar Bearer sin cambiar el cuerpo**

Usar:

```js
headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
},
```

Mantener `memberstackId`, `email` y `customFields` sin cambios para compatibilidad.

- [ ] **Paso 4: verificar GREEN**

Ejecutar:

```powershell
node --test tests/auth/magic-token-issuance-security.test.mjs
```

Resultado esperado: 3 pruebas aprobadas y 0 fallas.

### Tarea 4: Actualizar la auditoría

**Archivos:**

- Modificar: `Documentacion/seguridad/2026-07-26-auditoria-magic-links-y-cargas.md`

- [ ] **Paso 1: registrar el cierre local del hallazgo**

Documentar que:

- `POST /api/auth/magic-token` exige JWT del mismo `memberstackId`;
- CORS permite `Authorization`;
- el widget conserva fallback;
- no hubo cambios de esquema ni invalidez de tokens existentes.

- [ ] **Paso 2: conservar riesgos residuales explícitos**

Mantener como pendientes:

- origen CORS abierto;
- campos auxiliares provenientes del cliente autenticado;
- autenticación coordinada de endpoints compartidos de almacenamiento.

- [ ] **Paso 3: validar formato**

Ejecutar:

```powershell
git diff --check
```

Resultado esperado: salida sin errores.

### Tarea 5: Puerta de calidad integral

**Archivos:**

- Verificar todos los archivos modificados.

- [ ] **Paso 1: ejecutar suite completa**

```powershell
node --test "tests/**/*.test.mjs"
```

Resultado esperado: todas las pruebas aprobadas.

- [ ] **Paso 2: ejecutar type-check**

```powershell
npm run type-check
```

Resultado esperado: código de salida 0.

- [ ] **Paso 3: ejecutar lint**

```powershell
npm run lint
```

Resultado esperado: 0 errores; las advertencias heredadas se documentan sin atribuirlas a este cambio.

- [ ] **Paso 4: ejecutar build**

```powershell
npm run build
```

Resultado esperado: compilación de producción exitosa.

- [ ] **Paso 5: revisar regresiones y alcance**

Confirmar:

- `GET /api/auth/magic-token` no cambió;
- el esquema no cambió;
- el widget mantiene el fallback;
- no se incluyó `changelogs/2026-07-23.md`;
- el changelog local pendiente del push anterior se conserva para el próximo commit funcional.

### Tarea 6: Preparar revisión del usuario

- [ ] **Paso 1: resumir cambios y resultados de QA**

Presentar archivos, impacto funcional, riesgos residuales y resultados exactos.

- [ ] **Paso 2: solicitar autorización específica**

Solicitar permiso para:

```powershell
git commit -m "fix: proteger emision de magic tokens"
git push origin main
```

Los comandos deben ejecutarse por separado y únicamente después de la autorización.

- [ ] **Paso 3: actualizar changelog después del push**

Tras un push exitoso, agregar inmediatamente a `changelogs/2026-07-26.md`:

- hash y descripción;
- cambios funcionales;
- pruebas ejecutadas;
- ausencia de migraciones;
- riesgos residuales.

No crear un push exclusivo para esa actualización.
