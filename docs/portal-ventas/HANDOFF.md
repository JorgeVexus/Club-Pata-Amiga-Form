# Portal de ventas — dónde nos quedamos

> **Última sesión:** 29 de julio de 2026 · último commit `2ddd708`
> **Para retomar:** lee esto y el [README](README.md). Las specs por sección
> siguen siendo la fuente de verdad de lo que falta.
>
> En esa sesión se cerraron las secciones **4 (calendario de contenido)**,
> **5 (boletín)**, **6 (agente demo)** y **7 (tableros)**. Con eso **las 7
> secciones del plan quedan construidas**. Antes de eso hubo un lote de
> arreglos del reporte del
> coder del cliente que cambió cosas que vas a usar al seguir — están en la
> sección 4.1 de aquí abajo y el detalle en
> [`docs/fixes-reporte-coder.md`](../fixes-reporte-coder.md).
>
> ⚠️ **No revises nada en staging: está congelado desde el commit `58cf99a`
> (27-jul 19:41, F2b).** La cuenta de Vercel está en Hobby, que solo permite 2
> tareas programadas diarias, y `vercel.json` declara 5 — así que **todos los
> despliegues fallan desde F2c**. Es una decisión tomada: no se recortan los
> crones, el plan sube a Pro para la salida a producción (ver
> [`docs/PRODUCCION.md`](../PRODUCCION.md)). Mientras tanto, verifica en local
> con `npm run build && npm start`.

---

## 1. En una frase

**Las 7 secciones del plan están construidas y el histórico de LynSales ya está
dentro.** Lo que queda no es construir secciones nuevas: es (1) verificar con la
IA conectada lo que hoy solo corrió en modo demostración y (2) el checklist de
producción. Los dos están detallados abajo.

---

## 2. Qué se puede usar hoy

Entrando a `/ventas` con `ventas@pataamiga.dev` / `Ventas1234!` o
`gerente@pataamiga.dev` / `Gerente1234!` (contraseñas en `CLAUDE.md`):

| Pantalla | Qué hace |
| --- | --- |
| `/ventas` | Resumen con conversaciones por etapa y lo que llega en cada fase |
| `/ventas/contactos` | Lista con búsqueda por identidad, filtros, vistas guardadas, lote, CSV |
| `/ventas/contactos/[id]` | Ficha completa: propietario, etiquetas, campos, DND, línea de tiempo, membresía (sin datos sensibles) |
| `/ventas/contactos/duplicados` | Revisión y fusión de duplicados |
| `/ventas/contactos/importar` | Importación de CSV en 4 pasos con vista previa |
| `/ventas/pipelines` | Kanban de 8 etapas con pesos, arrastrar, motivo de pérdida, estancadas |
| `/ventas/conversaciones` | Bandeja multicanal (Meta, correo, supervisión) con triaje y hilo |
| `/ventas/plantillas` | Plantillas de respuesta 1 a 1 + catálogo de WhatsApp |
| `/ventas/ia` | Gobierno de agentes: topes, guardia, escalaciones, votos |
| `/ventas/membresias` | Planes y versiones con publicación en Stripe · cupones (crear en Stripe, usos, desactivar) · migrar cohorte (solo super admin) |
| `/ventas/calendario` | Lista, mes y cuentas · cola de revisión · editor con validaciones en vivo · aprobar/devolver/programar · modo asistido |
| `/ventas/newsletter` | Calendario editorial del año · brief · agentes investigador y de marca con su costo · editor de bloques · cola de revisión · plantillas |
| `/boletin/baja/<token>` | Baja del boletín, pública y sin sesión (un clic, con confirmación) |
| Agente demo | Widget con sello de demostración en `/app` y `/registro/plan` para cuentas sin membresía. **APAGADO por omisión**: se enciende en Ventas → Agentes IA (`demo_agent_enabled`) |
| `/ventas` (tablero) | Embudo con tasa de paso, 10 tarjetas con comparación contra el período anterior, gráficas de tendencia, tabla por persona, motivos de pérdida, exportar CSV y enviar reporte |
| `/admin` (bloque Ventas) | Embudo compacto y 5 tarjetas, con **las mismas funciones de métricas** que el portal |

Los administradores llegan por el conmutador de portales (menú de perfil).

---

## 3. Lo que sigue, en orden

### 3.1 Antes de producción: publicar los planes en Stripe

No es una sección del plan, pero salió al probar F3c y conviene decidirlo
pronto. Las versiones **v1** (las que creó la migración inicial) nunca se
publicaron en Stripe, así que el checkout sigue cayendo al precio de las
variables de entorno `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`. Eso
funciona, pero deja dos cabos:

- Ese precio del entorno pertenece a **otro producto** de Stripe, así que un
  cupón restringido a un plan no aplicaría (el portal ya lo detecta y lo
  explica en lugar de crear un cupón que no muerde).
- Mientras tanto, publicar una versión nueva y darse de alta usan caminos
  distintos.

Se arregla publicando las versiones vigentes desde `/ventas/membresias`, lo que
crea sus precios propios. Cambia el precio que ve una alta nueva, así que es
una decisión del equipo, no un detalle técnico. Va en `docs/PRODUCCION.md`.

### 3.2 El histórico de LynSales — HECHO (29-jul)

El export vive en
`006_Pata_Amiga/pata_amiga_crm_lynnsales/Export_Contacts_undefined_Jul_2026_12_16_PM.csv`
(995 filas, 9 columnas). Ya está importado en dev, y las **dos decisiones del
cliente** quedaron así:

1. **Las filas inalcanzables se descartan.** 406 traen correo, 139 teléfono y
   **543 ninguno de los dos**. Se omiten: crearían fichas imposibles de
   contactar y duplicables en cada reimportación (la falla de F1e). El número
   baja de 995 a **452** y la pantalla lo dice con esas palabras, para que a
   nadie le sorprenda.
2. **Manda la fecha del archivo, no la de la importación.** `Created` viene en
   ISO con zona (`-06:00`) en las 995 filas, de **20-ene a 28-jul de 2026**.

Para eso el importador ganó dos columnas — **Fecha de alta original** y
**Última actividad** — que reconoce solas si el encabezado se llama `Created` /
`Last Activity`. Lo que hacen:

- `contacts.created_at` y `contacts.last_activity_at` con los valores del
  archivo (solo al **crear**: a un contacto que ya existe no se le mueve el alta).
- `opportunities.created_at`, `stage_entered_at` y `updated_at` con la misma
  fecha, así el embudo cuenta el histórico en su mes y "días en etapa" dice la
  verdad desde el primer minuto.

Y una casilla nueva, **"Colocar en el pipeline según las etiquetas"** (encendida
por omisión), con el mapa en `ETIQUETA_A_ETAPA` (`src/lib/crm/import.ts`).
Cuando una fila trae varias etiquetas gana la más avanzada de `AVANCE`, donde
**"solicitud de llamada" va por encima de las etapas del embudo**: quien pidió
que le llamaran necesita que una persona le llame, y esa tarjeta tiene que estar
donde el equipo la vea. Son 9 filas con etiquetas mezcladas y todas incluyen esa.

Reparto real de las 452 (cuadra con el archivo al contacto):

| Etapa | Tarjetas | De dónde sale |
| --- | --: | --- |
| Carrito abandonado | 169 | `carrito abandonado` (170 − 1 que además pidió llamada) |
| Registro iniciado | 139 | `funnel_registro_credenciales` + `funnel_datos_contratante` (141 − 2) |
| Nuevo prospecto | 107 | 94 sin etiqueta + 13 `campaña-regalo` (conservan su etiqueta) |
| Solicitud de llamada | 18 | `solicitud por llamada` ∪ `transferencia a humano` |
| Miembro inactivo | 11 | `miembro inactivo` |
| Miembro activo | 5 | `miembro activo` |
| Pago procesado | 3 | `pago procesado` |

No hay correos ni teléfonos repetidos dentro del archivo. Contra la base sí
hubo choques (1 se unió a un contacto existente y 1 quedó para revisar por
teléfono compartido): la deduplicación de F1e se encargó, con el teléfono como
identidad **débil**.

**Si hay que reimportar** (llega un export corregido): el archivo se puede
volver a pasar tal cual — la resolución por identidad no duplica a nadie y
`ensureOpportunity` no crea una segunda tarjeta. La corrida completa tarda
**~11 minutos** porque va fila por fila; la pantalla escribe en lotes de 50 y
muestra "N de 995 filas" mientras avanza. **El contador de pantalla va un lote
atrás del real**: si necesitas saber cuánto entró de verdad, cuenta en la base.

#### Lo que destapó la importación (y ya está arreglado)

Dos pantallas que estaban "terminadas" se rompieron al ver datos de verdad. Las
dos se arreglaron con la decisión del cliente del 29-jul:

**1. El Kanban tardaba 9 segundos.** `/ventas/pipelines` traía **todas** las
oportunidades del pipeline sin tope, con sus relaciones embebidas, y las
serializaba completas como props: 467 tarjetas = **~9 s y 1.28 MB de HTML**
(medido tres veces, no era arranque en frío). Con las 15 tarjetas de prueba no
se notaba.

Ahora cada columna abre con **50** (`TOPE_POR_ETAPA` en
`src/lib/crm/tarjetas.ts`) y tiene su **"Ver más (N)"**, que trae la siguiente
página sin recargar. Medido igual: **~0.9 s y 553 KB**. Tres detalles que
importan si alguien lo toca:

- Los totales del encabezado y de cada columna (**"112 oportunidades ·
  $190,288 · mostrando 50"**) salen de `resumenPorEtapa`, no de las tarjetas
  cargadas. Si salieran de las cargadas, el tablero diría 50 donde hay 112.
- El filtro "solo mías" se aplica **en la consulta**, también en el "ver más".
- `armarTarjeta` es la única función que construye una tarjeta, y la usan la
  pantalla y la acción. Dos armadores es cómo se separaron las dos bandejas de
  conversaciones.

**2. El embudo decía "786% desde la anterior".** El porcentaje se calculaba
contra la etapa de arriba, y **las etapas no son subconjuntos**: casi nadie pasa
por "Solicitud de llamada" (19) y muchísimos entran directo a "Registro
iniciado" (143). Correcto según su fórmula, sin significado para quien lo lee.

Ahora es **"% del total del período"** (`porcentajeDelTotal` en
`metricas.ts`): siempre suma 100, no depende del orden de las etapas y no se
rompe si el equipo agrega una. Con el histórico dentro se lee de un golpe dónde
se queda la gente — **37% en carrito abandonado**. El reporte por correo dice lo
mismo, porque sale de la misma función.

### 3.3 Verificar lo que solo corrió en modo demostración

La llave de Anthropic llega pronto. En cuanto esté, lo primero:

- Puntos 4, 5 y 6 de la verificación de la sección 6: que el agente demo **no
  dé orientación veterinaria** (ni general), que responda "eso lo verás al ser
  miembro" a una pregunta sobre datos del usuario, y que aguante un mensaje que
  diga "ignora tus instrucciones". En los registros debe verse que **no se
  llamó ninguna herramienta de datos de miembro**.
- Sección 5: que el investigador devuelva hallazgos **con fuente** y que el
  agente de marca no meta nada que no venga del material.
- Revisar el costo real de una corrida contra los precios declarados en
  Ajustes de IA (`ia_precio_entrada_usd_millon`, `ia_precio_salida_usd_millon`,
  `ia_tipo_cambio_mxn`) y ajustar los topes.

### 3.4 Piezas compartidas que conviene reutilizar

- `src/lib/tableros/metricas.ts` y `rango.ts` — TODAS las métricas y todos los
  rangos de fecha. El tablero de ventas y el bloque de /admin salen de aquí; si
  alguien necesita un número nuevo, se agrega aquí y lo ganan los dos.
- `src/lib/tableros/reporte.ts` — el reporte armado con datos vivos, que usan
  el botón y la tarea programada. El panel de administración puede colgarse de
  él sin duplicar nada.
- `src/lib/tableros/exportar.ts` — CSV con columnas por capacidad y registro en
  `export_log`. Cualquier lista nueva que exporte debería pasar por aquí.
- `src/lib/content/terminologia.ts` — la revisión de terminología vinculante,
  sin dependencias a propósito. La usan el calendario y el boletín.
- `src/lib/newsletter/costos.ts` — costo de una corrida de IA a partir de los
  tokens, con los precios como ajuste editable. Los otros agentes todavía
  estiman tokens por longitud de texto y no llevan costo: si F6 o F7 tocan eso,
  aquí está resuelto.
- `completeJson` en la capa de proveedor (`src/lib/llm/types.ts`) — salida
  estructurada con el uso real de tokens, y modo demostración cuando no hay
  `ANTHROPIC_API_KEY`.
- `ai_usage` ya distingue conversaciones de canal (`conversation_id`) de
  conversaciones del asistente (`assistant_conversation_id`). Para F7, el gasto
  por agente sale de ahí.

---

## 4. Cómo se ha trabajado (conviene mantenerlo)

- **Una fase = un commit verificado.** Migración → librería → interfaz →
  verificación en navegador con datos reales → commit → push.
- **Nada se da por bueno sin probarlo contra la base.** Cada commit dice qué se
  verificó y cómo. Si algo no se pudo probar, se dice en lugar de omitirlo.
- **Los datos de prueba se limpian.** Si una prueba deja algo encendido (una
  plantilla "aprobada", una versión publicada, un canal apagado), se revierte al
  terminar y se dice en el mensaje del commit.
- **Comentarios que explican el porqué**, no el qué — el programador del cliente
  lee este repo.
- **Verificar en 375 px** además de escritorio.
- `git commit -F archivo` (PowerShell rompe los mensajes largos con comillas).

### 4.1 Lo que cambió en el lote de arreglos (úsalo al seguir)

**Ahora hay reja de lint.** `.github/workflows/lint.yml` corre `npm run lint` y
`npm run typecheck` en cada push y PR a master. El árbol quedó en **0 errores y
0 advertencias**; conviene mantenerlo así. Ojo: Next 16 **ya no corre ESLint
dentro de `next build`**, así que Vercel puede desplegar en verde con errores —
por eso existe la reja. Corre los dos comandos antes de empujar.

**Fechas: no llames `Date.now()` dentro del render.** En `src/lib/dates.ts`
están `haceDias(7)`, `diasDesde(iso)`, `tiempoRelativo(iso, ahora)` y
`estaVencida(iso, ahora)`. En cliente, `ahora` sale de `useAhora()`
(`src/lib/hooks.ts`), que se refresca solo cada minuto. Si el componente se
pinta también en el servidor (una lista siempre visible, no un panel que se
abre), pásale el reloj **por prop desde el server component**: un solo reloj
evita que servidor y navegador pinten distinto.

**`localStorage`: usa `useValorLocal(llave)`** (`src/lib/hooks.ts`) en vez de
leerlo en un `useEffect` con `setState`. Para escribir, guarda en el manejador
del evento y lleva el valor nuevo aparte en un `useState` — el evento `storage`
solo avisa de cambios de OTRA pestaña.

**Los mapas de búsqueda necesitan red.** `CHANNEL_META[canal].badgeCls` tumbó
la bandeja de admin entera con un 500 en cuanto apareció el canal `email`. El
patrón que quedó es `metaCanal(canal)`, que devuelve un estilo neutro para lo
que no conozca. F5/F6/F7 van a agregar más mapas por tipo: **dale siempre un
respaldo, y arma los filtros desde las llaves del mapa** para que no se
desincronicen.

**El proxy ya protege `/ventas`.** Cualquier ruta nueva bajo `/ventas` queda
detrás del guard sin tocar nada. La comparación es por **segmento exacto**, no
`startsWith`: si algún día agregas una landing pública que empiece igual que un
área privada, ya no colisiona.

**Paneles flotantes: míralos en 375 px.** Los dos paneles de campana estaban
anclados con `right-0` y se salían de la pantalla en móvil (el de admin quedaba
casi entero fuera, en x negativa). Abajo de `sm` se fijan a los bordes de la
ventana. Si agregas un menú o panel flotante, mide su `getBoundingClientRect()`
a 375 px — a simple vista no se nota que está fuera.

---

## 5. Fallas encontradas al probar (ya corregidas)

Sirven de advertencia para lo que sigue: **todas aparecieron al correr el código
con datos reales, ninguna al escribirlo.**

| Dónde | Qué pasaba |
| --- | --- |
| Deduplicación (F1a) | El teléfono unía contactos solo; dos cuentas distintas quedaron como una y un centro se mezcló con un lead. Ahora el teléfono es identidad **débil** |
| `ensureOpportunity` (F1a) | Buscaba solo tarjetas abiertas, así que un miembro activo recibía tarjeta nueva en cada corrida |
| `formatDateEs` (F1b) | Le concatenaba `T12:00:00` a cualquier cadena → "Invalid time value" con timestamps. Tumbaba páginas con error 500 |
| Importación (F1e) | Una fila con solo un teléfono ajeno creaba un contacto **sin identidades**, inalcanzable y duplicable en cada reimportación |
| Correo (F2b) | Se sobrescribía el asunto del hilo con el de cada respuesta, rompiendo el enganche por asunto |
| Escalación (F2d) | El mensaje que pedía un humano escalaba **y además** recibía respuesta de la IA (se leía el estado viejo de la conversación) |
| Cupones (F3c-1) | Restringir un cupón "al plan" apuntaba a un producto de Stripe por el que hoy no se vende nada: la pantalla lo prometía y en la caja no pasaba nada. Ahora solo se acepta si el plan tiene una versión publicada **con precio** |
| Compuerta legal (F3c-2) | `legal_documents` estaba **vacía** desde siempre (los textos viven en código), así que el selector salía sin opciones y ninguna compuerta se podía cruzar. La migración 30 la siembra |
| Terminología (F4a) | Normalizar el copy entero con `normalize("NFD")` lo **acorta** al quitar acentos, así que los índices se desfasaban y se señalaba la palabra equivocada (con emojis, peor). Ahora se normaliza carácter por carácter |
| Terminología (F4a) | Prohibir "seguro" a secas bloqueaba el descargo aprobado de la marca ("no es un seguro"). Hay lista de frases permitidas, y la palabra solo se marca cuando funciona como sustantivo |
| Compuerta veterinaria (F5a) | Marcar un tema como "de salud" con su edición ya aprobada hacía que el CHECK rechazara la fila **desde dentro del disparador**, y eso revertía el guardado entero del tema: la casilla se guardaba sin guardarse. Ahora la edición baja a revisión |
| Envío del boletín (F5d) | La primera corrida marcó la edición como **enviada** aunque los tres correos fallaron: el conteo de pendientes solo miraba la cola, no los fallidos. Ahora hay `attempts` por correo, tres intentos, y si no sale ninguno la edición queda `fallida` |
| Consumo del agente demo (F6a) | `ai_usage.conversation_id` apunta a `channel_conversations`, pero las del asistente viven en `assistant_conversations`: la llave foránea rechazaba la fila y `registrarUso()` no lanza, así que el consumo se perdía **en silencio**. Sin esas filas el tope de gasto nunca habría saltado. Columna nueva `assistant_conversation_id` |
| Zona horaria, el resto de la plataforma (F10) | El arreglo de F7a solo cubría `src/lib/tableros/`. Estaba repetido en **once** lugares más, tres con consecuencias que alguien iba a reclamar: el **tope diario de gasto de IA** se reiniciaba a las 6 de la tarde; la **fecha fin del período de espera** de una mascota salía con un día extra para quien se registrara de noche (es la fecha que decide desde cuándo procede un reintegro); y una **promoción que vencía hoy** dejaba de mostrarse 6 horas antes. También el "este mes" de /admin, finanzas, embajadores, el tope del boletín y los **dos CSV bancarios**, que definen a quién se le paga. Todo sale ahora de `src/lib/zona-horaria.ts` |
| Zona horaria del tablero (F7a) | Los días se calculaban con la hora **local del proceso**: aquí (UTC−6) el "26 de julio" agarraba 17 contactos que en UTC son del 27, y en Vercel (UTC) habrían salido otros. **El mismo código daba dos verdades según dónde corriera.** Ahora todo cuenta en `America/Mexico_City` |
| Columnas inventadas (F7a) | `channel_messages.sent_by_ai`, `tasks.done` y `lost_reasons.label` **no existen** (son `sender`, `completed_at` y `name`). TypeScript no las atrapa porque el cliente de Supabase no está tipado: habrían devuelto ceros silenciosos. **Verifica los nombres contra `information_schema` antes de escribir una consulta nueva** |
| Última actividad del histórico (F8) | `emitEvent` sube `last_activity_at` a "ahora" en CADA evento — correcto en vivo, pero la importación emite tres por fila, así que **borraba la fecha real que acababa de escribir**: 452 contactos sin respuesta desde marzo aparecían al frente de la lista como si acabaran de escribir. Ahora la importación la vuelve a poner al final de cada fila |
| Antigüedad de las tarjetas (F8) | `opportunities.stage_entered_at` tiene default `now()`, y de ahí salen "días en etapa" y el aviso de **estancada**. Sin tocarlo, 169 carritos abandonados en mayo entraban al tablero como recién llegados y habrían tardado 14 días en levantar la mano. Se escribe con la fecha del archivo, igual que `created_at` y `updated_at` |
| Constante exportada en `"use server"` (F8) | Un archivo de acciones **solo puede exportar funciones async**. `export const TAMANO_LOTE` pasó `tsc --noEmit` y el lint sin una queja y **tumbó el build**. Otra que solo aparece compilando: corre `npm run build` antes de empujar, no solo los dos comandos de la reja |
| Guard del proxy (lote de arreglos) | `startsWith("/embajador")` también atrapaba `/embajadores`, la landing **pública**: cualquier visitante sin sesión terminaba en el login. Confirmado en staging antes de arreglarlo |
| Bandeja de admin (lote de arreglos) | `CHANNEL_META[canal]` sin respaldo → error 500 y **bandeja entera caída** en cuanto `lib/channels/email.ts` empezó a crear conversaciones de canal `email`. El tipo decía 4 canales; la base traía más |
| Campanas en móvil (lote de arreglos) | Panel anclado `right-0` con la campana a la izquierda del encabezado → el panel se pintaba de x −278 a 62, prácticamente fuera de la pantalla. Ninguna prueba de escritorio lo iba a mostrar |
| Cliente de Supabase (lote de arreglos) | `useRef(createClient()).current` creaba un cliente en **cada render** y tiraba todos menos el primero |

---

## 6. Lo que bloquea al cliente (no a nosotros)

Nada de esto detiene el desarrollo; cada pieza faltante se indica en la interfaz.

| Insumo | Qué desbloquea |
| --- | --- |
| **Subdominio de correo** + proveedor de entrada (`EMAIL_WEBHOOK_SECRET`) | Correo entrante real. Hoy funciona con cargas simuladas |
| **Aprobación de Meta** de las plantillas de WhatsApp | Reabrir conversaciones fuera de las 24 h. Las dos del catálogo están en `pendiente` |
| Permisos `pages_manage_posts` e `instagram_content_publish` | Publicación automática del calendario (F4) |
| Plantilla de marca del boletín | Agente de marca (F5) |
| **Palabra del cupón** de `/landings/regalo` | El portal ya la crea en Stripe y la deja en la landing en un solo paso; falta que el equipo decida la palabra |
| **Redacción del convenio asociado** | Es el único documento legal sin fila en `legal_documents`: no se pone una fila sin documento detrás |
| **`ANTHROPIC_API_KEY`** | Los dos agentes del boletín. Sin ella corren en modo demostración y lo dicen |
| **Plantilla de marca del boletín** (diseño y ejemplo) | Hoy se usa el layout de arranque; el agente lo puede seguir, pero no es la marca final |
| **Correos de prueba del equipo** (Ajustes de IA) | La compuerta de prueba obligatoria del boletín |
| **Quién confirma la revisión veterinaria** | Los temas de salud del boletín |
| **Palabra secreta del webhook de Resend** | Que el webhook verifique firmas en producción |
| **Ejemplos revisados del agente demo** y decidir cuándo encenderlo | La demostración muestra valor sin inventar. Sin ejemplos cargados, el agente lo dice en lugar de improvisar |
| **Destinatarios de reportes** (Sitio web → Notificaciones) y la cadencia del reporte automático | El botón "Enviar reporte" del tablero y el reporte recurrente |

---

## 7. Estado técnico

- **Migraciones:** 36 (las del portal van de la 20 a la 36). `docs/PRODUCCION.md`
  ya está corregido: **15 variables de entorno**, no 13.
- **Tareas programadas** en `vercel.json`: **8**. Cumpleaños y carritos
  abandonados (diarias), mensajes programados (cada 10 min), escalaciones (cada
  15 min), publicaciones del calendario (cada 5 min), envío del boletín (cada
  10 min), agregados del tablero (diaria 8:30) y reporte de ventas recurrente
  (diaria 15:00, decide adentro si hoy toca). Vercel Pro permite hasta 40, así
  que hay espacio de sobra; en Hobby solo caben 2 diarias, que es lo que tiene
  **staging congelado**.
- **Webhook nuevo:** `/api/webhooks/resend` (entregado, abierto, rebotado,
  queja). CONECTAR en el panel de Resend; su palabra secreta va en
  `RESEND_WEBHOOK_SECRET`.
- **Punto de retorno anterior a todo esto:** etiqueta `v1.0-plataforma-base`
  (commit `cdf68e7`) + volcado de la base y Storage en
  `006_Pata_Amiga/backups/2026-07-26-checkpoint-v1.0/`.
- `tsc --noEmit` limpio en cada commit.

### Deuda consciente

- **Componentes cliente con constantes**: `PetForm`, `VetChat` y `RequestForm`
  siguen mostrando los valores del catálogo en lugar de los del miembro. La
  *aplicación* de las reglas ya usa el snapshot (servidor); lo que falta es
  pasarles los valores como props para que la pantalla diga lo mismo que el
  motor. Importa cuando exista un plan con beneficios distintos.
- **Registro de descargas de CSV**: la sección 7 lo pide; no existe tabla de
  auditoría todavía.
- **Clasificación de la IA → "Solicitud de llamada"**: requiere ampliar el enum
  de su herramienta; se dejó para cuando se retomen los agentes.
- **Migrar cohorte no cambia lo que se cobra**, solo los beneficios. Es lo
  correcto para el caso que pide la spec (mejorarle algo a un grupo); si algún
  día se quiere mover también el precio, hay que decidir qué pasa con el
  período ya pagado de cada quien.
- **La migración se ejecuta miembro por miembro**, sin transacción que abarque
  a toda la cohorte: si falla a la mitad, los ya migrados quedan migrados y el
  resumen dice cuántos fallaron. Con las cohortes de hoy no es problema;
  conviene revisarlo antes de mover miles.
- **Los publicadores automáticos del calendario no publican todavía**: Facebook
  e Instagram lanzan un error que dice qué permiso falta en Meta, en lugar de
  fingir. Se implementan cuando Meta apruebe `pages_manage_posts` e
  `instagram_content_publish`; mientras tanto las cuentas van en asistido, que
  sí funciona de punta a punta.
- **El aviso previo del calendario enlaza al calendario**, no a la tarjeta
  concreta. Cancelar desde ahí sí evita la publicación (probado), pero hay que
  buscar el post en la lista.
- **Sin corredor de pruebas en el repo.** La validación de terminología se
  probó con 27 casos compilando el módulo aparte, y el boletín con 17 más; si
  el equipo mete un runner algún día, esos son los primeros archivos que
  merecen pruebas de verdad. Ojo: **los módulos que importan por alias `@/` no
  se pueden compilar y correr sueltos** (TypeScript resuelve el alias pero no
  lo reescribe al emitir). Por eso `terminologia.ts`, `bloques.ts` y
  `costos.ts` se escribieron sin dependencias: para poder probarlos.
- **Ningún agente nuevo se ha probado con la IA conectada.** El boletín y el
  agente demo se verificaron en modo demostración (sin `ANTHROPIC_API_KEY`).
  Todo lo que rodea al modelo está probado —topes, compuertas, registro de
  consumo, herramientas—, pero **el comportamiento de los prompts no**: que el
  demo no dé orientación veterinaria, que no sepa nada del usuario y que
  aguante un "ignora tus instrucciones" son los puntos 4, 5 y 6 de la
  verificación de la sección 6, y siguen pendientes. Es lo primero que hay que
  correr cuando llegue la llave.
- **La prueba de envío del boletín nunca ha llegado a una bandeja.** La llave
  de Resend de desarrollo solo entrega al correo verificado de la cuenta. La
  compuerta funciona (si Resend rechaza, `test_sent_at` no se marca), pero
  cuando haya dominio verificado hay que volver a correrlo de punta a punta.
- **La exclusión por DND lee todas las identidades de correo del CRM en
  memoria.** Con los contactos de hoy no es problema; con decenas de miles hay
  que pasarlo a una consulta con `in` por lotes.
- **El tablero calcula las tarjetas al vuelo en cada carga.** Ya se midió con el
  histórico dentro (452 contactos, 467 tarjetas): **780 ms**, así que aguanta y
  la pregunta queda cerrada. El que no aguantó fue el Kanban — ver 3.2.
- **Solo se exporta el embudo.** La spec pide que toda lista que se abra desde
  el tablero exporte a CSV; hoy está el embudo, que es la que importa. Las
  demás pueden colgarse de `lib/tableros/exportar.ts` sin escribir nada nuevo.
- **Las fichas emergentes (`DetailModal`) no se conectaron al tablero.** Las
  etapas del embudo llevan al pipeline filtrado, que resuelve el caso de uso;
  la ficha con el detalle por rol sigue disponible en las pantallas del CRM. La reja de
  CI de hoy solo corre lint y tipos: sigue sin haber pruebas que atrapen un
  error de lógica.
- **La bandeja de `/admin/conversaciones` y la de `/ventas/conversaciones` son
  dos pantallas distintas.** La de admin es la vieja (`InboxClient`), la de
  ventas es la del portal. El canal `email` existía en una y no en la otra, que
  es justo de dónde salió el 500. Si tocas canales, revisa las dos.
