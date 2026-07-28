# Portal de ventas — Sección 3: Membresías y beneficios versionados

> **Estado:** propuesta para aprobación.
> **Depende de:** Sección 0 (roles y permisos). No depende de las secciones 1 y 2.
> **Advertencia:** es la sección que **toca la lógica viva de los miembros**
> (períodos de espera, topes de reintegro, límite de mascotas). Es la de mayor
> riesgo del proyecto y por eso su diseño es conservador.

---

## 1. El problema

Hoy las reglas del negocio son constantes en el código (`src/lib/constants.ts`,
`src/lib/waiting-period.ts`):

| Regla | Valor hoy | Quién la usa |
| --- | --- | --- |
| Precio mensual / anual | $159 / $1,699 MXN | Registro, landing, Stripe |
| Período de espera del contratante | 90 días desde el pago | Reintegros |
| Período de espera por mascota | 180 estándar · 150 adoptado de raza · 120 adoptado mestizo · 90 con código de embajador · 180 reemplazo | Alta de mascota, reintegros |
| Topes de reintegro por año | Gastos veterinarios $3,000 · Fallecimiento $2,000 · Vacunas $300 | Saldos y aprobación |
| Mascotas activas | 3 | Alta de mascota |
| Mascota senior (requiere certificado) | 10 años | Alta de mascota |
| Compromiso de transferencia | 72 horas | Reintegros |
| Apelaciones por sujeto | 2 | Apelaciones |
| Comisión de embajador | $16 mensual / $170 anual | Pagos a embajadores |

Cambiar cualquiera de esas requiere que alguien edite código y despliegue. El
pedido es que ventas pueda **crear membresías con distintos beneficios** y que la
plataforma los respete sola.

## 2. La decisión de fondo: el catálogo vive en código, los valores en la base

Un beneficio no es un dato suelto: es un dato **que algún código tiene que
obedecer**. Si dejamos que ventas invente beneficios arbitrarios, nace un campo
que nadie lee y la promesa se rompe en silencio — el peor resultado posible en un
producto de salud.

Entonces:

- **El catálogo de beneficios vive en código** (`src/lib/plans/benefits.ts`).
  Cada beneficio declara su llave, su tipo, su valor por omisión, su unidad,
  **quién lo consume** y quién puede editarlo. Agregar un beneficio nuevo es una
  entrada en el catálogo más el código que lo obedece: un cambio pequeño,
  revisable, que el programador del cliente puede hacer solo.
- **Los valores viven en la base**, por versión de plan. Ventas cambia números y
  arma paquetes sin desplegar.

```ts
// src/lib/plans/benefits.ts  (extracto ilustrativo)
export const BENEFIT_CATALOG = {
  espera_contratante_dias: {
    label: "Período de espera del contratante",
    type: "entero", unit: "días", default: 90,
    consumedBy: ["reintegros"],
    editableBy: "super_admin",        // regla del reglamento
    legalBinding: true,
  },
  espera_mascota_estandar_dias: {
    label: "Período de espera por mascota — estándar",
    type: "entero", unit: "días", default: 180,
    consumedBy: ["alta de mascota", "reintegros"],
    editableBy: "super_admin", legalBinding: true,
  },
  tope_gastos_veterinarios_mxn: {
    label: "Tope anual de gastos veterinarios",
    type: "dinero", unit: "MXN", default: 3000,
    consumedBy: ["saldos de reintegro"],
    editableBy: "super_admin", legalBinding: true,
  },
  mascotas_activas_max: {
    label: "Mascotas activas incluidas",
    type: "entero", default: 3,
    consumedBy: ["alta de mascota"],
    editableBy: "super_admin", legalBinding: true,
  },
  orientacion_vet_24_7: {
    label: "Orientación veterinaria 24/7",
    type: "booleano", default: true,
    consumedBy: ["bot vet"],
    editableBy: "gerente_ventas", legalBinding: false,
  },
  // …los demás de la tabla del punto 1
} as const;
```

Los valores por omisión del catálogo **son** los de `constants.ts`: se importan
de ahí, no se copian. No hay dos fuentes de verdad.

### 2.1 Lo que NO se vuelve editable

Las **5 características de la membresía** (`MEMBERSHIP_FEATURES`) siguen en
código, en su orden vinculante: *todo México · mantienes tu veterinario ·
3 mascotas · orientación 24/7 · 100% digital*. Son la promesa de marca, no
mecánica de plan. Lo mismo la terminología y `brand-voice.ts`.

Si un plan futuro incluyera, por ejemplo, 5 mascotas, el beneficio cambia pero la
frase de marca **no se genera sola** desde el beneficio: la revisa una persona.
Un plan con mecánica distinta se comunica con texto escrito a mano, no armado por
plantilla.

---

## 3. Modelo de datos

```sql
create table membership_plans (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,        -- 'membresia', 'membresia-plus'
  name        text not null,
  description text,
  is_public   boolean not null default true,  -- si aparece en el sitio
  position    int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table plan_versions (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references membership_plans(id) on delete cascade,
  version           int  not null,
  interval          text not null check (interval in ('month','year')),
  price_cents       int  not null,
  currency          text not null default 'MXN',
  benefits          jsonb not null default '{}',   -- solo lo que difiere del catálogo
  status            text not null default 'borrador'
                      check (status in ('borrador','publicada','retirada')),
  -- Stripe
  stripe_product_id text,
  stripe_price_id   text,
  -- Compuerta legal
  legal_document_id uuid references legal_documents(id),
  legal_confirmed_by uuid references profiles(id),
  legal_confirmed_at timestamptz,
  -- Auditoría
  notes             text,
  created_by        uuid references profiles(id),
  published_by      uuid references profiles(id),
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (plan_id, version, interval)
);

alter table subscriptions
  add column plan_version_id     uuid references plan_versions(id),
  add column benefits_snapshot   jsonb,
  add column benefits_snapshot_at timestamptz;
```

`benefits` guarda **solo las diferencias** contra el catálogo. Un plan que no
cambia nada tiene `{}`. Así, cuando mañana se agregue un beneficio nuevo al
catálogo, todas las versiones viejas lo heredan con su valor por omisión en lugar
de quedar con un hueco.

### 3.1 El resolvedor: una sola puerta

```ts
// src/lib/plans/resolve.ts
export function beneficiosDe(sub: SubscriptionRow): Beneficios {
  // catálogo (defaults) ← snapshot de la suscripción ← nada más.
  // Si la suscripción no tiene snapshot (datos previos a esta sección),
  // devuelve los defaults del catálogo, que son las reglas de hoy.
}
```

**Todo el código que hoy lee constantes pasa a leer el resolvedor.** El refactor
alcanza: `waiting-period.ts`, `reimbursement-balance.ts`, la validación de alta de
mascota (límite y senior), el compromiso de 72 h, el máximo de apelaciones y la
comisión de embajador.

Las constantes **no se borran**: quedan como los valores por omisión del
catálogo. Nada del comportamiento actual cambia el día que se despliega esta
sección. Eso es a propósito: la migración debe ser invisible.

---

## 4. Grandfathering: cómo un miembro conserva lo que contrató

Cuando alguien paga, se copia el resultado del resolvedor a
`subscriptions.benefits_snapshot`. **A partir de ahí, ese miembro se rige por su
copia**, no por lo que diga el plan hoy.

Publicar la versión 2 de un plan no toca a nadie: los miembros de la versión 1
siguen con sus 180 días y sus $3,000. Es lo correcto legalmente — la persona
aceptó un reglamento concreto — y es lo que hace defendible el reglamento de
reintegros.

**Stripe refuerza esto solo.** Los precios de Stripe son inmutables: no se
editan, se crean nuevos. Una versión nueva del plan es un `price` nuevo, y las
suscripciones existentes siguen apuntando al precio viejo. La base y Stripe
cuentan la misma historia sin que haya que sincronizar nada.

### 4.1 Migrar a una cohorte (solo `super_admin`)

Cuando sí se quiera mover gente — por ejemplo, mejorar un tope para todos — hay
una acción deliberada:

1. Se elige la versión destino y se filtra la cohorte (por versión de origen,
   antigüedad, estado).
2. Se muestra **el antes y el después beneficio por beneficio**, y cuántas
   personas quedan mejor y cuántas peor.
3. Si alguien queda **peor** en un beneficio vinculante, la acción **se bloquea**
   salvo que se adjunte el documento legal nuevo y se confirme explícitamente.
4. Al ejecutar: se actualiza el snapshot, queda registro por miembro en
   `contact_activities`, y sale un correo con plantilla editable avisando el
   cambio.

Nunca hay migración silenciosa. Nunca hay migración a peor sin papel.

---

## 5. La compuerta legal

`CLAUDE.md` ya advierte que hay que revisar que los textos legales digan lo mismo
que el código. Con planes editables ese riesgo se multiplica, así que se vuelve
una compuerta:

**Publicar una versión que cambie cualquier beneficio marcado
`legalBinding: true` exige:**

- señalar el `legal_documents` vigente que ya refleja el cambio, **o** subir la
  versión nueva del reglamento en ese mismo paso;
- confirmación de un `super_admin` (queda en `legal_confirmed_by`).

Cambios que **no** tocan beneficios vinculantes — precio, nombre, descripción,
si aparece en el sitio — los publica `gerente_ventas` sin compuerta.

> **Refinamiento de la matriz de la Sección 0.** Ahí quedó que
> `gerente_ventas` puede "crear versión nueva / publicar en Stripe". Se precisa:
> puede crear versiones y publicar **precio y empaquetado**; los beneficios
> vinculantes los cambia `super_admin`. Es un ajuste hacia más cuidado, no menos,
> y viene de que estas reglas están escritas en el reglamento que el miembro
> aceptó.

---

## 6. Stripe

### 6.1 Publicar

Al publicar una versión, en Stripe (hoy en modo de prueba):

1. `product` por plan, reutilizado entre versiones.
2. `price` **nuevo** por versión e intervalo, con `metadata` que lleva
   `plan_version_id` — así el webhook sabe siempre a qué versión pertenece un
   pago sin adivinar.
3. Se guardan los identificadores en `plan_versions`.
4. Si algo falla a medias, la versión se queda en `borrador` con el error a la
   vista. No hay estados a medias publicados.

### 6.2 Checkout y webhook

El checkout deja de leer `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` del
entorno y usa el `stripe_price_id` de la versión publicada. Las variables de
entorno se conservan un ciclo como respaldo por si hay que revertir.

El webhook lee `plan_version_id` de la metadata, lo escribe en la suscripción y
toma el snapshot de beneficios en la misma transacción en que activa la
membresía. Un solo lugar, sin carrera.

### 6.3 Cambio de plan

Subir o bajar de plan crea el cambio en Stripe con prorrateo y **actualiza el
snapshot en ese momento** (con registro del antes y el después). Es el único caso
en que el snapshot de un miembro cambia sin acción de un `super_admin`, porque lo
pidió el propio miembro.

### 6.4 Cupones y códigos de promoción

El checkout ya acepta códigos promocionales. Se agrega crearlos desde el portal:
`coupon` + `promotion_code` en Stripe, con vigencia, tope de usos y restricción
por plan, más el registro de cuántas veces se usó.

Esto cierra un pendiente que hoy es manual: la palabra del cupón de
`/landings/regalo` (ver `docs/LANDINGS.md`) se podrá crear desde el portal sin
entrar a Stripe.

---

## 7. Dónde se nota en la plataforma

Un cambio de beneficios tiene que verse **en todas partes o en ninguna**. Los
lugares que pasan a leer del plan y del snapshot:

| Superficie | Antes | Después |
| --- | --- | --- |
| Precios de la landing y del registro | `PLANS` en código | Versiones publicadas y públicas |
| Pantalla de elección de plan | Dos opciones fijas | Los planes públicos vigentes |
| Alta de mascota (límite y aviso senior) | Constantes | Snapshot del miembro |
| Cálculo de período de espera | `waiting-period.ts` | Snapshot del miembro |
| Saldos y topes de reintegro | `REIMBURSEMENT_CAPS_MXN` | Snapshot del miembro |
| "Mi membresía" en `/app` | Texto fijo | Sus beneficios reales, con la fecha desde la que aplican |
| Comisión del embajador | Constantes | Beneficio del plan referido |
| Agentes IA | Texto fijo en el prompt | Beneficios del plan público vigente |

Ese último renglón importa: hoy el agente de ventas recita las características
desde el prompt. Si ventas publica un plan nuevo y el agente sigue diciendo lo de
antes, el equipo pierde credibilidad en el primer mensaje.

---

## 8. Migración

Una sola migración, sin cambio visible:

1. Crear el plan `membresia` — "Membresía Pata Amiga".
2. Crear la **versión 1** mensual ($159) y anual ($1,699), con `benefits = {}`
   (o sea: exactamente las reglas de hoy) y los `stripe_price_id` que ya existen
   en las variables de entorno.
3. A cada suscripción existente: `plan_version_id` según su intervalo y
   `benefits_snapshot` = los valores por omisión del catálogo.
4. Verificar que el número de suscripciones con snapshot es igual al total. Si no
   cuadra, la migración falla y se revierte.

---

## 9. Interfaz — `/ventas/membresias`

- **Lista de planes** con sus versiones, la vigente marcada, y cuántos miembros
  hay en cada versión (el dato que hoy nadie tiene).
- **Editor de versión**: precio e intervalo arriba; abajo los beneficios
  agrupados por consumidor (Reintegros · Mascotas · Servicios · Embajadores).
  Cada beneficio muestra su valor por omisión, quién lo obedece y un candado si
  requiere `super_admin`.
- **Comparador**: versión nueva contra la vigente, beneficio por beneficio, con
  las diferencias resaltadas. Se ve **antes** de publicar.
- **Publicar**: confirmación que enumera qué se crea en Stripe y a quién afecta
  ("0 miembros actuales; aplica a nuevas altas"). Con la compuerta legal si toca.
- **Cupones**: crear, listar, ver usos, desactivar.
- **Migrar cohorte** (solo `super_admin`): el flujo del punto 4.1.

---

## 10. Cómo verificamos que quedó

1. Desplegar la migración y comprobar que **nada cambia**: un miembro existente
   ve los mismos períodos de espera, topes y límite de mascotas que antes.
2. Publicar la versión 2 con un tope distinto → el miembro de la versión 1 sigue
   con el suyo, y una alta nueva toma el nuevo. Verificado en la base y en `/app`.
3. Intentar cambiar un beneficio vinculante con sesión `gerente_ventas` → se
   bloquea y explica por qué.
4. Publicar con beneficio vinculante sin documento legal → no deja.
5. Alta completa con `4242 4242 4242 4242` sobre una versión nueva: la
   suscripción queda con su `plan_version_id` y su snapshot correcto.
6. Cambio de plan de un miembro: Stripe prorratea y el snapshot se actualiza con
   registro del antes y el después.
7. Crear un cupón desde el portal y usarlo en un checkout real de prueba.
8. Migrar una cohorte de una cuenta de prueba: se ve el comparador, sale el
   correo y queda la actividad.
9. Intentar una migración que empeora un beneficio vinculante sin papel → se
   bloquea.
10. Un plan retirado ya no aparece en la landing pero los miembros que lo tienen
    siguen funcionando.
11. Verificado en escritorio y en 375 px.

---

## 11. Decisiones tomadas y por qué

| Decisión | Por qué |
| --- | --- |
| Catálogo en código, valores en la base | Un beneficio que ningún código obedece es una promesa falsa |
| `benefits` guarda solo diferencias | Un beneficio nuevo no deja huecos en las versiones viejas |
| Snapshot en la suscripción | La persona aceptó un reglamento concreto; es lo correcto y hace defendible el reglamento |
| Precio nuevo por versión en Stripe | Los precios de Stripe son inmutables: el diseño coincide con la herramienta en lugar de pelear con ella |
| `plan_version_id` en la metadata de Stripe | El webhook nunca tiene que adivinar de qué versión fue un pago |
| Beneficios vinculantes solo `super_admin` + compuerta legal | Están escritos en el reglamento que el miembro aceptó |
| Las 5 características siguen en código | Son promesa de marca, no mecánica de plan |
| Los agentes IA leen los beneficios vigentes | Un agente que recita un plan viejo quema la credibilidad en el primer mensaje |
| La migración inicial no cambia nada | El día del despliegue es el peor momento para estrenar reglas nuevas |
| Las constantes no se borran | Quedan como los valores por omisión: una sola fuente de verdad |

---

## 12. Fuera de alcance de esta sección

- **Beneficios de tipo arbitrario** definidos desde la interfaz. Un beneficio
  nuevo necesita el código que lo obedezca.
- **Precios por región o por moneda.** Un solo mercado, MXN.
- **Planes familiares o con varios contratantes.**
- **Facturación fuera de Stripe.** El CFDI sigue como está.
- **Pruebas A/B de precio.**
- **Reglas por mascota individual** (un tope distinto para un perro específico).
