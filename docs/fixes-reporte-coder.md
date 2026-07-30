# Lote de arreglos — reporte del coder del cliente (28-jul-2026)

El coder del cliente corrió `npm run lint` sobre un clon limpio de este repo y
reportó un bug funcional más una lista de errores de ESLint. Este documento
explica **qué se arregló y por qué cada arreglo es el que es**, para que
cualquiera del equipo pueda revisarlo sin tener que reconstruir el
razonamiento.

Regla que seguimos en todo el lote: **ningún `eslint-disable` para callar un
error**. Si la regla se queja, o el código mejora o la regla se configura de
forma explícita y argumentada.

---

## 0. Contexto importante: por qué se acumularon sin que nadie los viera

Next.js 16 **ya no corre ESLint dentro de `next build`** (`next lint` se
retiró). Nuestro `build` es `next build` pelón, así que Vercel seguía
desplegando en verde con 12 errores de lint en el árbol. Esa es la causa raíz
de que la lista creciera sin ruido.

Por eso el lote incluye una reja (sección 8).

---

## 1. Bug funcional: `/embajadores` bloqueado por el guard de `/embajador`

**Archivo:** `src/lib/supabase/middleware.ts` (lo llama `src/proxy.ts` — en
Next 16 el archivo `middleware.ts` de raíz se llama `proxy.ts`).

El guard preguntaba `path.startsWith("/embajador")`, y
`"/embajadores".startsWith("/embajador")` es `true`. Resultado: la landing
**pública** del programa de embajadores quedaba detrás del guard del portal
privado. Confirmado en staging antes del arreglo: `/embajadores` → `307` al
login.

El coder propuso `path === "/embajador" || path.startsWith("/embajador/")`,
que es correcto. Lo generalizamos para que el bug no pueda volver por otra
ruta:

```ts
const AREAS_PRIVADAS = ["/app", "/admin", "/embajador", "/ventas", "/centro"];
const isProtected = AREAS_PRIVADAS.some(
  (area) => path === area || path.startsWith(`${area}/`),
);
```

El match es **por segmento exacto**, así que `/embajadores` y `/centros`
(ambas públicas) ya no colisionan con `/embajador` y `/centro`.

**Además sumamos `/ventas` y `/centro` al guard.** Ya estaban protegidas del
lado del servidor (`requirePortal` en `ventas/layout.tsx`, `getUser` explícito
en `centro/page.tsx`), así que esto no cambia quién entra: lo que cambia es
que a quien no trae sesión se le corta en el proxy, sin llegar a pegarle a la
base. Defensa en profundidad y una vuelta menos a la BD.

## 2. Los 4 `Date.now()` de server components no eran impuros

`admin/page.tsx`, `ventas/conversaciones`, `ventas/pipelines` y `ventas/ia`
son server components asíncronos: corren una vez por request, no hay
re-render ni hidratación. La regla `react-hooks/purity` no distingue servidor
de cliente y los marcaba igual.

En vez de callarlos, notamos que los cuatro repetían la misma cuenta de
fechas a mano. Se extrajo **`src/lib/fechas.ts`** (`haceDias`, `diasDesde`,
`tiempoRelativo`, `estaVencida`). El error desaparece porque el cálculo ya no
vive en el cuerpo del componente, y de paso las fechas del proyecto quedan en
un solo lugar.

## 3. Los 3 `Date.now()` de cliente sí eran reales — y se parten en dos casos

Se revisó, uno por uno, si el render marcado llega al HTML del servidor:

- **`Bell.tsx` y `NotificationsBell.tsx`** — la lista está detrás de
  `{open && …}`, así que nunca se renderiza en el servidor. No había
  desajuste de hidratación, pero las horas **quedaban congeladas** en el
  render que tocara. Arreglo: hook compartido `useAhora()` (bucket por minuto,
  tick cada 60 s) + `tiempoRelativo` de `fechas.ts`. Ahora las horas se
  actualizan solas con el panel abierto.
- **`NotasYTareas.tsx`** — esta sí se renderiza en el servidor (la lista de
  tareas siempre está a la vista), así que `vencida()` sí era riesgo real de
  desajuste de hidratación. Su padre `ventas/contactos/[id]/page.tsx` es un
  server component, así que recibe **`ahora` por prop**: un solo reloj, que
  viaja en el HTML y se reusa al hidratar. Determinista y sin parpadeo.

`timeAgo` estaba **duplicado carácter por carácter** en las dos campanas.
Ahora es una sola función.

## 4. Lectura de `localStorage` al montar (`Bell.tsx`, `PlanSelector.tsx`)

Los dos hacían `setState` síncrono dentro de un `useEffect` para leer
`localStorage`. Es el caso canónico de `useSyncExternalStore`. Se extrajo el
hook compartido **`useValorLocal(key)`** (lectura, sin escritura). El
`PlanSelector` conserva igual su estado `"checking"` y el prellenado del
código de embajador.

## 5. `Hilo.tsx` — reasignación dentro del `.map()`

`let diaAnterior` se declaraba arriba y se reasignaba dentro del `.map()` para
decidir dónde va el separador de día. Ahora los separadores se calculan **una
vez, antes del JSX**, y el cuerpo del `map` queda puro. Sin cambio visual.

## 6. `InboxClient.tsx` — cliente de Supabase por render

`useRef(createClient()).current` **crea un cliente en cada render** y tira
todos menos el primero. `useState(createClient)` lo crea una sola vez, en
forma diferida. Arreglo real, no cosmético.

## 7. Advertencias

- `_c` en `CenterForm.tsx` es el modismo estándar de "desestructurar para
  omitir". En vez de deformar el código, se configuró
  `varsIgnorePattern: "^_"` en `eslint.config.mjs`: el guion bajo ya
  significa "a propósito no se usa", y ahora vale para todo el repo.
- `etiquetaContacto` en `ventas/contactos/actions.ts` era código muerto → se
  borró (queda en el historial de git).
- Los dos `eslint-disable` de `@next/next/no-img-element` en `page.tsx` ya no
  suprimían nada (la regla se retiró en `eslint-config-next` 16) → se
  quitaron.
- `EmailTemplatesEditor.tsx` — el borrador se armaba con un objeto nuevo en
  cada render cuando todavía no había cambios guardados, así que el `useMemo`
  de la vista previa **nunca memorizaba** (sus dependencias cambiaban siempre).
  Ahora el borrador va en su propio `useMemo`.

## 8. La reja: `.github/workflows/lint.yml`

Corre `npm run lint` y `npx tsc --noEmit` en cada push y PR a `master`.

Deliberadamente **no** metimos el lint dentro de `npm run build`: eso haría
que una variable sin usar pueda tumbar un deploy de producción, y a semanas
del arranque en vivo ese no es un riesgo que valga la pena. La reja avisa
fuerte y visible; el deploy sigue siendo decisión de quien lo ve.

---

# Lo que salió de paso (NO venía en el reporte)

Estos dos aparecieron mientras se verificaban los arreglos de arriba. No los
reportó nadie; se encontraron probando en el navegador.

## 9. `/admin/conversaciones` tronaba con error 500 — la bandeja entera caída

`CHANNEL_META` tenía cuatro canales (facebook, instagram, whatsapp, portal) y
la pastilla hacía `CHANNEL_META[canal].badgeCls` sin red. Cuando
`src/lib/channels/email.ts` empezó a crear conversaciones con
`channel: "email"`, esa búsqueda devolvía `undefined` y reventaba **la página
completa** para cualquier admin. En la base de desarrollo ya había 2
conversaciones de correo, así que la bandeja estaba caída, no intermitente.

Arreglo en dos partes, porque el bug real es la fragilidad:

1. Se agregaron `email` ("Correo") y `vet` ("Veterinario") al mapa.
2. Se metió `metaCanal(canal)`, que **devuelve un estilo neutro si el canal no
   está en el mapa**. Un canal nuevo ya no puede tumbar la bandeja: se pinta
   gris con su propio nombre hasta que alguien le dé color. El filtro de canal
   también se arma solo desde las llaves del mapa, para que no se vuelvan a
   desincronizar.

También se soltó el tipo `Conversation["channel"]` de la unión cerrada a
`string`: la unión decía cuatro valores, pero los datos venían de la base con
más — TypeScript daba una seguridad que no existía.

## 10. Las dos campanas se salían de la pantalla en móvil

En 375 px el panel de la campana del panel de admin quedaba de x **-278 a 62**:
casi entero fuera de la pantalla, ilegible. El de la campana del miembro se
salía 9 px. Los dos estaban anclados con `right-0`, y en móvil las campanas no
caen pegadas a la derecha.

Abajo de `sm` los dos paneles ahora se fijan a los bordes de la ventana
(`max-sm:fixed max-sm:inset-x-4`), así quedan completos sin importar dónde
caiga la campana. De `sm` para arriba no cambia nada. Es la misma solución en
los dos archivos, a propósito.

---

## Verificación

Todo lo de abajo se probó de verdad, con datos reales de la base de
desarrollo, sobre el build de producción (`npm run build` + `npm start`).

**Automático**

- `npm run lint` → **0 errores, 0 advertencias** (venía de 12 y 5).
- `npm run typecheck` → limpio.
- `npm run build` → compila.

**Guard de rutas** (códigos HTTP reales)

| ruta | antes | ahora |
|---|---|---|
| `/embajadores` (pública) | 307 → login ❌ | **200** ✅ |
| `/centros` (pública) | 200 | 200 ✅ |
| `/embajador` (privada) | 307 | 307 ✅ |
| `/centro` (privada) | sin guard en proxy | 307 ✅ |
| `/ventas` (privada) | sin guard en proxy | 307 ✅ |
| `/app`, `/admin` | 307 | 307 ✅ |

**En el navegador** (escritorio 1280 px y móvil 375 px, sin un solo error en
la consola en ninguna pantalla)

- `/embajadores` carga completa sin sesión, con su formulario.
- Campana de admin: contador en 14, al abrir se guarda el "visto" en
  `localStorage`, el contador se apaga y **al recargar sigue apagado** (que es
  justo lo que prueba que `useValorLocal` lee bien sin el efecto). Horas
  relativas correctas ("hace 12 d").
- Campana del miembro: 2 sin leer → se marcan al abrir, horas relativas
  correctas.
- Notas y tareas: se creó una tarea con fecha pasada y salió en rosa con
  "Venció 20 jul", pintada desde el servidor y **sin desajuste de hidratación**
  al recargar. La tarea de prueba se cerró después.
- Bandeja: hilo con 4 días distintos → **4 separadores**, uno por día, en
  orden. Verificado contra la base (`select count(distinct fecha)`).
- Bandeja de admin: carga, y el cliente de Supabase creado con
  `useState(createClient)` sí hace sus consultas (`channel_messages` y
  `channel_conversations` en la pestaña de red).
- Selector de plan: código guardado en `localStorage` → se prellena y se
  valida solo ("✓ Código PATAMIGA-EQUIPO aplicado"); al escribir encima, lo
  escrito manda.
- Móvil 375 px: ninguna pantalla desborda a lo ancho, y los dos paneles de
  campana quedan completos dentro de la pantalla (16 → 359).
