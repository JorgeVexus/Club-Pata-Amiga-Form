# Bugs encontrados en el repo Chepiztrike/pata-amiga (el que clonamos para la migración)

## ✅ Todo corregido (actualización 2026-07-29)

El equipo de pata-amiga ya corrigió los 11 errores + 1 bug funcional de
abajo (ver `docs/fixes-reporte-coder.md` de su repo para el detalle de
cada arreglo) y de paso encontraron y arreglaron 2 bugs más por su
cuenta: `/admin/conversaciones` truena con canales sin mapear (ej.
`email`) y las campanas de notificaciones se salían de la pantalla en
móvil. También agregaron `.github/workflows/lint.yml` para que esto no
se vuelva a acumular sin ruido. Ya integramos esta actualización en
nuestro repo (rama `migracion/pata-amiga`) — este documento se deja
como referencia histórica de lo que se reportó originalmente.

---

Este documento es solo para el otro dev — lista lo que se encontró en
**su** código (no en nuestra migración), verificado corriendo `npm run
lint` directo sobre un clon limpio del repo, sin ningún cambio nuestro.

## 1. Bug funcional: `/embajadores` bloqueado por el guard de `/embajador`

**Archivo:** `src/lib/supabase/middleware.ts`

La protección de rutas usa:

```ts
const isProtected =
  path.startsWith("/app") ||
  path.startsWith("/admin") ||
  path.startsWith("/embajador");
```

`"/embajadores".startsWith("/embajador")` es `true`, así que la landing
**pública** del programa de embajadores (`/embajadores`) queda detrás del
mismo guard que el portal privado (`/embajador`) — cualquier visitante no
logueado que entra a `/embajadores` es redirigido a `/iniciar-sesion` en
vez de ver la página.

**Fix:**

```ts
const isProtected =
  path.startsWith("/app") ||
  path.startsWith("/admin") ||
  path === "/embajador" ||
  path.startsWith("/embajador/");
```

Verificado con curl: `/embajador` → 307 a login (correcto), `/embajadores`
→ 200 (correcto, antes redirigía).

## 2. Errores de ESLint (`react-hooks` — reglas del React Compiler)

11 errores reales (no falsos positivos — violan reglas de pureza/effects
que el React Compiler necesita para poder optimizar sin bugs). Corridos
sobre el repo original tal cual, `npm run lint`:

| Archivo | Línea | Regla | Problema |
|---|---|---|---|
| `src/app/admin/conversaciones/InboxClient.tsx` | 108, 193 | `react-hooks/refs` | Acceso a `.current` de un ref durante el render (`useRef(createClient()).current`) |
| `src/app/admin/page.tsx` | 138 | `react-hooks/purity` | `Date.now()` llamado durante el render (función impura) |
| `src/app/registro/plan/PlanSelector.tsx` | 36 | `react-hooks/set-state-in-effect` | `setState` síncrono dentro de un `useEffect` (puede causar renders en cascada) |
| `src/app/ventas/conversaciones/page.tsx` | 84 | `react-hooks/purity` | `Date.now()` durante el render |
| `src/app/ventas/pipelines/page.tsx` | 118 | `react-hooks/purity` | `Date.now()` durante el render |
| `src/components/app/NotificationsBell.tsx` | 53 | `react-hooks/purity` | `Date.now()` durante el render (función `timeAgo`) |
| `src/components/panel/Bell.tsx` | 34 | `react-hooks/set-state-in-effect` | `setState` síncrono dentro de `useEffect` |
| `src/components/panel/Bell.tsx` | 61 | `react-hooks/purity` | `Date.now()` durante el render (función `timeAgo`) |
| `src/components/panel/bandeja/Hilo.tsx` | 288 | `react-hooks/immutability` | Reasignación de variable (`diaAnterior`) después de terminado el render |
| `src/components/panel/contactos/NotasYTareas.tsx` | 48 | `react-hooks/purity` | `Date.now()` durante el render (función `vencida`) |

**Patrón repetido:** varios de estos son la misma función `timeAgo`
duplicada en `NotificationsBell.tsx` y `Bell.tsx` — llamar `Date.now()`
directamente en el cuerpo de un componente (no dentro de un
`useEffect`/callback) rompe la pureza que el React Compiler exige, y
puede dar timestamps inconsistentes entre el render del servidor y el
del cliente (hydration mismatch) o entre re-renders.

## 3. Advertencias (menor prioridad)

| Archivo | Línea | Regla | Detalle |
|---|---|---|---|
| `src/app/admin/comunicados/EmailTemplatesEditor.tsx` | 52 | `react-hooks/exhaustive-deps` | `draft` condicional puede cambiar las dependencias de un `useMemo` en cada render |
| `src/app/centros/registro/CenterForm.tsx` | 75 | `@typescript-eslint/no-unused-vars` | Variable `_c` definida pero no usada |
| `src/app/page.tsx` | 276, 363 | — | `eslint-disable` de `@next/next/no-img-element` que ya no hace falta (no hay problema que suprimir) |
| `src/app/ventas/contactos/actions.ts` | 25 | `@typescript-eslint/no-unused-vars` | Función `etiquetaContacto` definida pero no usada |

---

Generado corriendo `npm run lint` sobre un clon limpio (sin cambios) de
`Chepiztrike/pata-amiga`, rama `master`, el 2026-07-29.
