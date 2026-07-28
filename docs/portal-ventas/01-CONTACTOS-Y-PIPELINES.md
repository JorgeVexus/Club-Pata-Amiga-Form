# Portal de ventas — Sección 1: Contactos y pipelines

> **Estado:** propuesta para aprobación.
> **Depende de:** Sección 0 (roles, permisos, cascarón compartido).
> **Es la base de:** Secciones 2 (conversaciones), 4, 5 y 7 (tableros).

Esta sección construye el corazón del CRM: **un contacto por persona**, con su
línea de tiempo, y **oportunidades en un tablero kanban** que se mueven solas
con lo que pasa en la plataforma.

---

## 1. Lo que hoy usa el equipo (observado en LynSales)

El equipo trabaja hoy en LynSales (GoHighLevel con otra marca). Del sistema
vivo, a la fecha de este documento:

**Pipeline real, con volúmenes:**

| Etapa | Oportunidades | Valor |
| --- | --: | --- |
| Nuevo Lead | 742 | MX$0.00 |
| Solicitud de llamada | 17 | MX$0.00 |
| Carrito abandonado | 228 | MX$0.00 |
| Pago procesado / En revisión | 2 | MX$0.00 |
| Miembro activo | 0 | MX$0.00 |
| Miembro inactivo | 0 | MX$0.00 |
| Perdido | 0 | MX$0.00 |
| **Total** | **989** | |

**Cuatro cosas que esos números nos dicen, y que cambian el diseño:**

1. **Las tres últimas etapas están en cero.** Las etapas existen pero nadie las
   llena: mover una tarjeta a "Miembro activo" depende de que alguien lo note a
   mano, o de una automatización que no está enganchada al cobro real. En
   nuestra plataforma el cobro, la suscripción y la baja **son eventos propios**
   — esas etapas se llenan solas. Es la ventaja más grande de traer el CRM
   adentro y es el eje de esta sección (punto 5).
2. **228 carritos abandonados contra 2 pagos en revisión.** Ese es el embudo
   más caro del negocio y hoy nadie lo puede trabajar en serio porque el CRM no
   sabe en qué paso del registro se cayó cada persona. Nosotros sí lo sabemos.
3. **Todos los valores en MX$0.00.** El valor monetario nunca se llenó. En
   lugar de pedirle al equipo que lo escriba, lo calculamos del plan al que va
   dirigida la oportunidad (punto 5.3): así el tablero suma dinero real sin
   trabajo extra.
4. **366 conversaciones sin leer en la bandeja del equipo.** El equipo está
   ahogado. Asignación, "mi bandeja" y filtros no son adornos; son la diferencia
   entre usar la herramienta y abandonarla. Se detalla en la Sección 2, pero la
   asignación vive en el contacto y por eso se define aquí.

**Ficha de contacto que ya conocen** (panel derecho): Propietario · Seguidores ·
Etiquetas · pestañas *Todos los campos / DND / Acciones* · buscador de campos ·
grupo "Contacto" con Nombre, Apellidos, Correo electrónico (varios), Teléfono
(varios, con lada de país), Fecha de nacimiento, Fuente de contacto, Tipo de
contacto. Rieles laterales: actividad, oportunidades, tareas, notas, citas,
documentos.

**Tarjeta de oportunidad que ya conocen:** título, `Valor: MX$0.00`, avatar del
propietario y una fila de iconos con contadores (conversaciones, mensajes,
notas, tareas, citas).

Replicamos ese vocabulario y esa disposición a propósito: el equipo no tiene que
reaprender nada. Lo que cambia es que los datos son de verdad.

---

## 2. Modelo de datos

### 2.1 `contacts` — una fila por persona

```sql
create table contacts (
  id                uuid primary key default gen_random_uuid(),
  -- Identidad básica (los mismos campos que ya usan)
  first_name        text,
  last_name         text,
  birth_date        date,
  source            text,               -- "Fuente de contacto": instagram, landing-regalo, referido…
  contact_type      text not null default 'lead'
                      check (contact_type in ('lead','miembro','embajador','centro','otro')),
  -- Relaciones con la plataforma (todas opcionales)
  profile_id        uuid references profiles(id) on delete set null,
  campaign_lead_id  uuid references campaign_leads(id) on delete set null,
  ambassador_id     uuid references ambassadors(id) on delete set null,
  center_id         uuid references wellness_centers(id) on delete set null,
  -- Gestión
  owner_id          uuid references profiles(id) on delete set null,   -- "Propietario"
  custom_fields     jsonb not null default '{}',
  dnd               jsonb not null default '{}',   -- {"email":true,"whatsapp":false,…}
  notes_count       int  not null default 0,       -- contadores para las tarjetas
  last_activity_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

`profile_id` es la costura con la plataforma: cuando un lead se vuelve miembro,
**no se crea un contacto nuevo** — se le enlaza su `profiles.id`. El equipo ve
una sola historia continua, desde el primer DM hasta su tercera mascota.

### 2.2 `contact_identities` — cómo lo alcanzamos

Una persona escribe por Instagram con un nombre, deja otro correo en una landing
y paga con un tercero. Las identidades son filas, no columnas:

```sql
create table contact_identities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  kind        text not null check (kind in
                ('email','phone','instagram','messenger','whatsapp','portal')),
  value       text not null,          -- normalizado: correo en minúsculas, teléfono en E.164
  is_primary  boolean not null default false,
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (kind, value)                -- ← la llave de la deduplicación
);
```

El `unique (kind, value)` es lo que hace imposible tener dos contactos con el
mismo correo. Cuando llega un mensaje nuevo, el conector busca la identidad; si
existe, adjunta a ese contacto; si no, crea contacto + identidad en una sola
transacción.

### 2.3 Etiquetas y campos personalizados — con criterio

De la investigación de GoHighLevel: meter todo en etiquetas produce "sprawl" y
filtros que no se pueden confiar. Separamos por naturaleza del dato:

- **Etiquetas** (`tags` + `contact_tags`): estados y hechos binarios —
  `miembro activo`, `pidió llamada`, `no contactar`, `vino de la campaña regalo`.
  Catálogo propio para poder renombrarlas sin romper los filtros guardados.
- **Campos personalizados** (`custom_field_defs` + `contacts.custom_fields`):
  atributos con valor — cuántas mascotas tiene, presupuesto, ciudad, el veterinario
  de siempre. Cada definición declara tipo (texto, número, fecha, selección,
  booleano), grupo/carpeta (para el buscador de campos que ya usan) y a qué
  aplica (`contact` u `opportunity`).

> Igual que en GoHighLevel, un campo personalizado **no** cambia de `contact` a
> `opportunity` después de creado. Esa restricción se aplica en base de datos,
> porque cambiarla corrompe los datos históricos.

### 2.4 Línea de tiempo, notas, tareas y seguidores

```sql
create table contact_activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  kind        text not null,       -- mensaje_recibido, etapa_movida, nota, pago, mascota_alta…
  actor_id    uuid references profiles(id),   -- null = la plataforma o la IA
  actor_label text,                            -- "PATiTA (IA)", "Sistema"
  summary     text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index on contact_activities (contact_id, created_at desc);
```

Esta tabla es **el sumidero único de `emitirEvento()`** que definimos en la
Sección 0.8. Todo lo que pasa aterriza aquí: mensajes, cambios de etapa, notas,
pagos, altas de mascota, aprobaciones de reintegro. Sirve para tres cosas a la
vez — la línea de tiempo de la ficha, los eventos que se ven intercalados en el
hilo de conversación (como ya los ven hoy: *"Opportunity NUEVO PROSPECTO …
created"*), y el día que quieran automatizaciones, el motor se suscribe aquí sin
tocar una sola pantalla.

Además: `tasks` (título, vence, responsable, hecha — alimenta el contador de la
tarjeta) y `contact_followers` (los "Seguidores": usuarios que quieren ver la
actividad de ese contacto sin ser su propietario).

### 2.5 DND por canal

`contacts.dnd` guarda el "no molestar" **por canal**, no global: alguien puede
no querer correos y sí aceptar WhatsApp. Se respeta en tres lugares —
el compositor de la bandeja lo bloquea, los envíos masivos lo excluyen, y los
agentes IA lo consultan antes de escribir. Es requisito legal y de confianza,
no una preferencia de interfaz.

### 2.6 Pipelines y oportunidades

```sql
create table pipelines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_default  boolean not null default false,
  position    int  not null default 0,
  archived_at timestamptz
);

create table pipeline_stages (
  id           uuid primary key default gen_random_uuid(),
  pipeline_id  uuid not null references pipelines(id) on delete cascade,
  name         text not null,
  color        text not null default 'teal',
  position     int  not null,
  -- Si la etapa la llena la plataforma sola, aquí queda registrado con qué evento.
  auto_event   text,
  is_won       boolean not null default false,
  is_lost      boolean not null default false
);

create table opportunities (
  id               uuid primary key default gen_random_uuid(),
  contact_id       uuid not null references contacts(id) on delete cascade,
  pipeline_id      uuid not null references pipelines(id),
  stage_id         uuid not null references pipeline_stages(id),
  title            text not null,
  value_cents      int  not null default 0,
  currency         text not null default 'MXN',
  owner_id         uuid references profiles(id),
  status           text not null default 'abierta'
                     check (status in ('abierta','ganada','perdida')),
  lost_reason_id   uuid references lost_reasons(id),
  source           text,
  custom_fields    jsonb not null default '{}',
  stage_entered_at timestamptz not null default now(),   -- para detectar estancadas
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

`lost_reasons` es un catálogo editable (la investigación mostró que los motivos
de pérdida filtrables son de lo más valorado por los equipos que usan
GoHighLevel, y hoy el equipo no los tiene). `stage_entered_at` permite la
pregunta que de verdad importa: *¿qué llevo 10 días sin mover?*

### 2.7 Vistas guardadas

```sql
create table saved_views (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contactos','oportunidades')),
  name       text not null,
  filters    jsonb not null default '{}',
  sort       jsonb not null default '{}',
  owner_id   uuid references profiles(id),   -- null = compartida con el equipo
  created_at timestamptz not null default now()
);
```

Igual que las Smart Lists de GoHighLevel: **son filtros guardados, no copias de
contactos.** No duplican nada, no cuentan aparte, y se pueden crear sin límite.
Aparecen como pestañas arriba de la lista, tal como el equipo las ve hoy.

---

## 3. Deduplicación: una persona, un contacto

### 3.1 Reglas de coincidencia (en orden)

Hay dos clases de identidad, y la distinción importa:

- **Fuertes** (correo, cuenta del portal, Instagram, Messenger, WhatsApp):
  pertenecen a una sola persona.
- **Débil** (teléfono): se comparte —familia, negocio, recepción.

1. **Identidad fuerte idéntica** — mismo `kind` + `value` normalizado → es la
   misma persona, se une sin preguntar.
2. **Correo con distinta escritura** — se normaliza a minúsculas y se recorta
   antes de comparar.
3. **Solo coincide el teléfono** → **no se une solo.** Se une únicamente si
   *además* el nombre coincide (sin acentos ni mayúsculas, y solo si no está
   vacío). Si no, se crea un contacto aparte, el teléfono se queda con quien lo
   tenía, y queda constancia de "posible duplicado" **en los dos lados** para
   que lo resuelva una persona.
4. **Nombre parecido sin identidad en común** → no se une nunca.
5. **Dos cuentas de la plataforma en un mismo contacto** → se avisa. Puede ser
   la misma persona con dos registros, pero `contacts.profile_id` apunta a una
   sola, y dejar a un miembro invisible en el CRM es peor que pedir una decisión.

> **Por qué el teléfono es débil.** La primera versión de esta especificación lo
> trataba como fuerte. Al correr el relleno inicial con los datos reales de
> desarrollo aparecieron dos uniones equivocadas: dos cuentas distintas
> (`asahiprueba@` y `asahizv@`) quedaron como un solo contacto, y un centro
> aliado se mezcló con un lead de campaña. Ambas compartían teléfono y nada más.
> El teléfono siguió siendo llave única en la tabla —para que dos contactos no
> lo tengan a la vez— pero dejó de bastar para unir.

### 3.2 Herramienta de fusión

Como la de GoHighLevel: busca duplicados, permite fusionar **hasta 10** en un
registro maestro, y **no pierde nada** — notas, tareas, etiquetas, correos,
conversaciones, oportunidades y campos personalizados se combinan en el maestro.
Solo `gerente_ventas` y arriba pueden fusionar (matriz de la Sección 0), y cada
fusión queda como actividad con el detalle de qué se unió, por si hay que
entender después qué pasó.

### 3.3 Relleno inicial desde las 5 fuentes

Una migración recorre, en este orden de precedencia (el primero gana en caso de
conflicto de nombre):

| Orden | Fuente | Identidad que aporta | `contact_type` |
| --- | --- | --- | --- |
| 1 | `profiles` (miembros) | correo, teléfono, `portal` | `miembro` |
| 2 | `ambassadors` | correo, teléfono | `embajador` |
| 3 | `wellness_centers` | correo, teléfono | `centro` |
| 4 | `campaign_leads` | correo | `lead` |
| 5 | `channel_conversations` | id de Instagram / Messenger / WhatsApp | `lead` |

Los contactos de redes suelen llegar sin correo: se crean con su identidad de
canal y el nombre que da la plataforma de Meta. Cuando esa persona después deja
su correo en el chat o se registra, la regla 1 la une con lo que ya existía. Ese
es exactamente el caso de la conversación de Geovanina que aparece en las
capturas: llegó por Facebook, dio su correo y teléfono dentro del chat, y hoy
son dos registros distintos.

La migración es **idempotente** y se puede correr de nuevo sin duplicar.

### 3.4 Importar desde LynSales

El equipo tiene 989 oportunidades y su lista de contactos allá. LynSales exporta
CSV (el botón "Importar" de la captura implica el par exportar/importar), así
que la carga es un importador de CSV con:

- mapeo de columnas en pantalla, recordado entre importaciones;
- columna de etiquetas separadas por comas, como GoHighLevel;
- columna **DND** reconocida y aplicada a todos los canales;
- las mismas reglas de deduplicación (3.1): reimportar el mismo archivo no
  duplica a nadie;
- vista previa con conteo de "nuevos / se unen a existente / posibles
  duplicados" **antes** de escribir nada.

> **Insumo del cliente:** exportar de LynSales el CSV de contactos y el de
> oportunidades. Sin eso arrancamos con los contactos que ya viven en la
> plataforma, que no es poco, pero se pierde el histórico de los 989.

---

## 4. Contactos que son miembros: la regla de privacidad

Cuando `profile_id` no es nulo, la ficha muestra un bloque **Membresía** de solo
lectura: plan y versión, estado, antigüedad, próximo cobro, mascotas por nombre
y especie, y el conteo de reintegros. Con un enlace a `/admin` que **solo se
renderiza si el usuario tiene rol de administración**.

Lo que un rol de ventas **nunca** puede ver, ni abriendo la ficha ni por la API:
INE, comprobante de domicilio, CURP, RFC, datos bancarios, archivos y montos de
reintegros, expedientes de apelación.

Cómo se garantiza, en tres capas:

1. La consulta de la ficha selecciona columnas explícitas — nunca `select *`
   sobre `profiles`.
2. Las políticas RLS de `documents`, `reimbursements`, `appeals` y las columnas
   bancarias no incluyen los roles de ventas.
3. Una prueba automatizada intenta leer esas tablas con una sesión de rol
   `ventas` y **debe** fallar. Si algún día alguien afloja una política, la
   prueba se cae.

---

## 5. El pipeline por omisión = el ciclo de vida real

Aquí está el cambio de fondo respecto a lo que tienen hoy.

### 5.1 Etapas

Se crea un pipeline "Pata Amiga" que respeta los nombres que el equipo ya usa,
con dos agregados que hoy les faltan (`Registro iniciado` separado de
`Carrito abandonado`, para saber si la persona llegó a crear cuenta o se cayó
antes):

| # | Etapa | Color | Se llena |
| --- | --- | --- | --- |
| 1 | Nuevo prospecto | azul | Al primer mensaje o al llenar una landing |
| 2 | Solicitud de llamada | naranja | La IA o una persona detecta que pidió que le llamen |
| 3 | Registro iniciado | gris | Creó cuenta pero no terminó de pagar |
| 4 | Carrito abandonado | negro | Llegó al checkout y no pagó en 24 h |
| 5 | Pago procesado / En revisión | teal | Stripe confirmó el pago; falta aprobar mascota |
| 6 | Miembro activo | verde | Suscripción activa (ganada) |
| 7 | Miembro inactivo | amarillo | Suscripción vencida o cancelada |
| 8 | Perdido | rojo | Descartado, con motivo |

Las etapas 5, 6 y 7 son las que hoy están en cero. Con esto se llenan sin que
nadie las toque.

### 5.2 Transiciones automáticas

`emitirEvento()` ya pasa por todos estos puntos del código. Cada evento mueve la
tarjeta y deja rastro en la línea de tiempo:

| Evento de la plataforma | Mueve a | Notas |
| --- | --- | --- |
| Primer mensaje entrante en cualquier canal | 1 · Nuevo prospecto | Crea contacto y oportunidad si no existen |
| Alta en una landing de campaña | 1 · Nuevo prospecto | `source` = la campaña |
| La IA clasifica "quiere que le llamen" | 2 · Solicitud de llamada | Ya existe la herramienta `clasificar_conversacion` |
| Cuenta creada sin suscripción | 3 · Registro iniciado | |
| Sesión de checkout de Stripe abierta | 3 · Registro iniciado | Guarda a qué plan iba |
| 24 h sin pagar tras abrir checkout | 4 · Carrito abandonado | Tarea programada diaria |
| `checkout.session.completed` | 5 · Pago procesado | |
| Suscripción `active` + mascota aprobada | 6 · Miembro activo → **ganada** | |
| Suscripción `past_due` / `canceled` | 7 · Miembro inactivo | |
| Marcado a mano como descartado | 8 · Perdido | Pide motivo de la lista |

**Regla de oro:** una automatización **nunca** revierte lo que hizo una persona.
Si alguien mueve una tarjeta a mano, se marca `stage_locked_by` con su nombre y
los eventos dejan de moverla; solo dejan actividad en la línea de tiempo. Sin
esto, la herramienta pelea con el equipo y el equipo la abandona.

### 5.3 Valor monetario automático

El `Valor: MX$0.00` de todas las tarjetas de hoy es información perdida. Como
sabemos a qué plan va dirigida cada oportunidad, el valor se calcula:

- Con plan elegido → el precio de ese plan (anual o mensual, del motor de la
  Sección 3).
- Sin plan aún → el precio del plan por omisión, marcado como estimado.
- Miembro activo → lo que realmente paga.

Así los encabezados de etapa suman dinero de verdad y el tablero de la Sección 7
puede hablar de pesos en lugar de conteos.

---

## 6. Interfaz

Misma disposición que ya conocen, con los componentes compartidos de la
Sección 0 (`components/panel/`), y por lo tanto también visible desde `/admin`.

### 6.1 Lista de contactos — `/ventas/contactos`

Tabla con columnas configurables ("Gestionar campos"), buscador, **pestañas de
vistas guardadas**, filtros avanzados combinables con Y/O (por etiqueta, etapa,
propietario, fuente, tipo, campo personalizado, actividad reciente, DND),
ordenamiento, selección múltiple con **acciones en lote** (etiquetar, asignar
propietario, cambiar etapa, exportar CSV) e importación.

### 6.2 Ficha de contacto

Panel derecho idéntico en estructura al que usan: encabezado con nombre y abrir
en pestaña nueva · **Propietario** · **Seguidores** · **Etiquetas** · pestañas
*Todos los campos / DND / Acciones* · buscador de campos · grupos de campos
plegables. Correos y teléfonos son **varios** por contacto, con su ⊕ para
agregar y lada de país en el teléfono.

Rieles: Actividad (la línea de tiempo) · Oportunidades · Tareas · Notas ·
Membresía (si aplica, punto 4) · Conversaciones (Sección 2) · Documentos.

Se reutiliza `DetailModal` para que en pantallas chicas la ficha abra como
ventana emergente, igual que las fichas del panel de administración.

### 6.3 Kanban de oportunidades — `/ventas/pipelines`

- Selector de pipeline + chip con el total.
- Encabezado por etapa: punto de color, nombre, **conteo y suma en pesos**,
  flecha para colapsar.
- Tarjeta: título, valor, avatar del propietario y la fila de contadores
  (conversaciones, mensajes, notas, tareas, citas) que ya leen de un vistazo.
- Arrastrar entre etapas; al soltar en "Perdido" pide el motivo.
- Casillas en las tarjetas para **acciones en lote** (mover, asignar, etiquetar,
  borrar) sin salir del tablero.
- Alternar a **vista de lista** para trabajar en volumen.
- Aviso de **estancadas**: contorno ámbar si `stage_entered_at` pasa el umbral
  de la etapa.
- **Móvil 375 px:** el kanban no se encoge — se navega por etapas con chips
  horizontales y las tarjetas se apilan a lo alto. Igual que la navegación móvil
  del panel, que ya funciona así.

### 6.4 Títulos automáticos

El equipo hoy lee títulos como *"NUEVO PROSPECTO: Avner Resendiz"*,
*"Carrito abandonado: jujuju@gmail…"*. Se generan con una plantilla por etapa
(editable), así que la lectura del tablero no cambia — pero nadie los escribe.

---

## 7. Server actions

Todas validan rol en el servidor y emiten actividad.

```
contactos:      crear · actualizar · fusionar · etiquetar · asignarPropietario
                seguir/dejarDeSeguir · fijarDND · importarCSV · exportarCSV
campos:         crearDefinicion · editarDefinicion · reordenar
oportunidades:  crear · moverEtapa · asignar · marcarGanada · marcarPerdida(motivo)
                actualizarValor · accionesEnLote
pipelines:      crear · editar · reordenarEtapas · archivar
vistas:         guardar · renombrar · compartir · borrar
tareas:         crear · completar · reasignar
```

---

## 8. Cómo verificamos que quedó

Con datos reales en la base de desarrollo, no con capturas:

1. Un DM de Instagram de alguien nuevo crea contacto + identidad + oportunidad
   en "Nuevo prospecto", y aparece en la línea de tiempo.
2. Esa misma persona se registra con un correo: **sigue siendo un solo
   contacto**, ahora con `profile_id` y dos identidades.
3. Abrir checkout y no pagar → al correr la tarea diaria, la tarjeta cae en
   "Carrito abandonado" sola.
4. Pagar con `4242…` → la tarjeta llega a "Pago procesado" y luego a "Miembro
   activo" al aprobar la mascota, con el valor del plan en pesos.
5. Mover a mano una tarjeta a otra etapa y disparar el evento contrario: **la
   tarjeta no se mueve** (queda bloqueada por la persona) y sí queda la actividad.
6. Importar dos veces el mismo CSV: la segunda vez no crea duplicados.
7. Fusionar dos contactos: notas, etiquetas, conversaciones y oportunidades
   quedan todas en el maestro.
8. Con sesión de rol `ventas`, intentar leer `documents` y las columnas
   bancarias de `profiles` → **falla**. Prueba automatizada.
9. Verificado en escritorio y en 375 px.

---

## 9. Decisiones tomadas y por qué

| Decisión | Por qué |
| --- | --- |
| Identidades como filas con `unique(kind,value)` | Es lo que hace estructuralmente imposible el duplicado, en lugar de confiar en una limpieza posterior |
| No fusionar automáticamente por nombre parecido | Mezclar dos clientes distintos es peor que tener dos registros del mismo |
| Etiquetas para estados, campos personalizados para atributos | La queja recurrente de la comunidad de GoHighLevel es el "sprawl" de etiquetas y filtros que ya no se pueden confiar |
| Vistas guardadas = filtros, no copias | Modelo de las Smart Lists; sin duplicar datos ni conteos |
| Un campo no cambia de contacto a oportunidad | Restricción heredada de GoHighLevel, aplicada en base de datos porque cambiarla corrompe el histórico |
| La acción humana bloquea la automatización | Si la herramienta pelea con el equipo, el equipo la abandona |
| Valor monetario calculado, no capturado | Hoy 989 tarjetas dicen MX$0.00; pedir captura manual daría el mismo resultado |
| Motivos de pérdida como catálogo | Filtrar por motivo es de lo más útil del CRM y hoy no lo tienen |

---

## 10. Fuera de alcance de esta sección

- **Bandeja de conversaciones** — Sección 2 (aquí solo el vínculo contacto ↔ conversación).
- **Citas y calendarios de agenda.** El riel de citas queda con su lugar en la
  ficha, pero agendar es una superficie aparte que no está en el pedido.
- **Motor de automatizaciones.** Las transiciones del punto 5.2 son eventos en
  código, no flujos configurables. La costura está lista (Sección 0.8).
- **Puntaje de leads (lead scoring).**
- **Llamadas telefónicas.** El riel de teléfono de LynSales no se replica: no
  hay proveedor de telefonía en este alcance.
