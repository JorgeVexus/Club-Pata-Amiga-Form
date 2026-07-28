# Portal de ventas — Sección 5: Newsletter con agentes IA

> **Estado:** propuesta para aprobación.
> **Depende de:** Sección 0 y la compuerta de aprobación de la Sección 4 (se
> reutiliza, no se reinventa).
> **Destino del envío:** correo a `newsletter_subscribers` (decidido). No hay
> página pública ni archivo en el sitio en este alcance.

---

## 1. El circuito

```
Calendario editorial          Agente investigador        Agente de marca
(anual, con temas          →  (Claude, con insumo     →  (arma el correo con
 mensuales/semanales)          humano obligatorio)        las plantillas de marca)
                                                                  ↓
                          Envío programado  ←  Aprobación del gerente
                          (Resend)             (con prueba obligatoria)
```

Cada paso deja su rastro: qué se le pidió al agente, qué devolvió, cuánto costó y
quién aprobó. Una edición se puede rehacer desde cualquier paso sin empezar de
cero.

---

## 2. El calendario editorial

Se programa un año completo y se le van colgando temas.

```sql
create table newsletter_schedule (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- "Boletín semanal 2026"
  cadence     text not null check (cadence in ('diaria','semanal','mensual')),
  weekday     int,                        -- 1..7 para semanal
  month_day   int,                        -- 1..28 para mensual
  send_time   time not null default '09:00',
  timezone    text not null default 'America/Mexico_City',
  is_active   boolean not null default true,
  starts_on   date not null,
  ends_on     date
);

create table newsletter_topics (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid references newsletter_schedule(id) on delete set null,
  planned_for  date not null,             -- fecha de envío prevista
  title        text not null,
  -- El insumo humano: sin esto el agente no corre.
  brief        text,                      -- ángulo, qué debe quedar claro
  must_include text,                      -- datos, promociones, fechas
  must_avoid   text,
  sources      jsonb not null default '[]',  -- fuentes sugeridas por el equipo
  is_health    boolean not null default false, -- ¿toca salud animal?
  status       text not null default 'planeado'
                 check (status in ('planeado','listo_para_investigar','en_proceso',
                                   'con_edicion','omitido')),
  created_by   uuid references profiles(id)
);
```

Una tarea programada crea los `newsletter_topics` vacíos del año según la cadencia
(por ejemplo, 52 huecos con su fecha). El equipo los va llenando con título y
brief. Un tema **sin brief no se puede mandar a investigar**: el "human in the
loop" es una condición de arranque, no un paso opcional.

---

## 3. Los agentes

```sql
create table newsletter_editions (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references newsletter_topics(id) on delete cascade,
  subject        text,
  preheader      text,
  blocks         jsonb not null default '[]',  -- contenido estructurado
  html           text,                          -- render final
  template_id    uuid references newsletter_templates(id),
  status         text not null default 'borrador'
                   check (status in ('borrador','investigada','redactada','revision',
                                     'aprobada','programada','enviada','fallida')),
  -- Revisión veterinaria, solo si el tema toca salud
  vet_reviewed_by uuid references profiles(id),
  vet_reviewed_at timestamptz,
  -- Aprobación (misma compuerta que la Sección 4)
  approved_by    uuid references profiles(id),
  approved_at    timestamptz,
  review_note    text,
  test_sent_at   timestamptz,
  scheduled_for  timestamptz,
  created_at     timestamptz not null default now(),

  constraint aprobacion_obligatoria check (
    status not in ('programada','enviada') or approved_by is not null
  ),
  constraint prueba_obligatoria check (
    status not in ('programada','enviada') or test_sent_at is not null
  ),
  constraint revision_vet_si_aplica check (
    status not in ('aprobada','programada','enviada')
      or vet_reviewed_at is not null
      or not coalesce((select is_health from newsletter_topics t where t.id = topic_id), false)
  )
);

create table newsletter_runs (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references newsletter_editions(id) on delete cascade,
  kind         text not null check (kind in ('investigacion','redaccion')),
  model        text not null,
  input        jsonb not null,     -- lo que se le pidió (auditable)
  output       jsonb,              -- lo que devolvió
  sources      jsonb not null default '[]',
  tokens_in    int, tokens_out int,
  cost_cents   int,
  duration_ms  int,
  error        text,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);
```

### 3.1 Agente investigador

Recibe el brief del tema y devuelve **material, no prosa terminada**: hallazgos
con su fuente, datos, ideas de sección, y lo que decidió dejar fuera.

Reglas duras:

- **No corre sin brief humano.** Si falta, la interfaz lo dice.
- **Toda afirmación va con su fuente**, y las fuentes quedan guardadas en el
  registro. Un hallazgo sin fuente se marca como "sin verificar" y no puede
  entrar al correo.
- **No inventa cifras.** Si no encuentra el dato, lo reporta como faltante.
- **Nada de consejo clínico.** Puede decir "muchos veterinarios recomiendan
  revisión anual, según *fuente*"; no puede decir qué hacer con un animal
  enfermo. La distinción está escrita en su instrucción.
- **Terminología vinculante** desde el primer borrador: nunca seguro, póliza,
  cobertura, carencia.

### 3.2 Agente de marca

Toma el material aprobado y arma el correo con las plantillas de marca:

```sql
create table newsletter_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  layout      text not null,        -- HTML con {{bloques}}
  block_types jsonb not null,       -- qué bloques admite y con qué campos
  sample      text,                 -- ejemplo de referencia para el agente
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
```

Las plantillas son **datos**, editables sin desplegar — es la forma en que "se le
alimentan las plantillas de marca al agente". El agente **no escribe HTML**:
llena bloques tipados (encabezado, texto, imagen, tarjeta de consejo, promoción,
llamada a la acción, cierre), y la plataforma los renderiza con el layout. Así el
correo nunca se rompe en un cliente de correo raro y el resultado es predecible.

Usa `brand-voice.ts` — la misma voz de los otros tres agentes — y las
`agent_promos` vigentes, para que las promociones que menciona sean las que están
al aire.

### 3.3 Costo y control

Cada corrida guarda modelo, tokens y costo. Hay tope de costo por edición y por
mes; al pasarlo, se detiene y avisa en lugar de seguir gastando. El modelo es
configurable (`LLM_MODEL`), así que se puede bajar de tier si el volumen crece.

---

## 4. Revisión y aprobación

La pantalla del gerente muestra, lado a lado: el correo renderizado, los
hallazgos con sus fuentes, y qué cambió respecto a la corrida anterior.

Puede: editar cualquier bloque a mano, pedir que se rehaga la redacción con una
instrucción extra, devolver con comentario, o aprobar.

Tres compuertas antes de que se pueda programar, las tres en la base de datos:

1. **Aprobación** de un `gerente_ventas` o arriba.
2. **Prueba enviada** — un envío real a los correos de prueba configurados.
   Aprobar algo que nadie vio en su bandeja es aprobar a ciegas.
3. **Revisión veterinaria** si el tema está marcado como de salud. Lo confirma
   una cuenta con rol de administración; queda quién y cuándo.

Y como en la Sección 4: **editar el contenido después de aprobado borra la
aprobación** y regresa a revisión.

---

## 5. El envío

```sql
create table newsletter_sends (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid not null references newsletter_editions(id) on delete cascade,
  subscriber_id  uuid references newsletter_subscribers(id) on delete set null,
  email          text not null,
  resend_id      text,
  status         text not null default 'encolado'
                   check (status in ('encolado','enviado','entregado','abierto',
                                     'rebotado','fallido','baja')),
  error          text,
  sent_at        timestamptz,
  updated_at     timestamptz not null default now(),
  unique (edition_id, email)
);
```

A la hora programada, la tarea:

1. Arma la lista desde `newsletter_subscribers`, **excluyendo** bajas, rebotes
   duros previos y contactos con DND de correo (Sección 2.3.5).
2. Envía por Resend en lotes, con reintento de los que fallan por causas
   temporales.
3. Los webhooks de Resend actualizan entregado / abierto / rebotado. Un rebote
   duro marca al suscriptor para no volver a intentarlo.
4. Cada correo lleva su enlace de baja con un token propio; darse de baja es un
   clic, sin sesión.
5. Al terminar, resumen al gerente: cuántos salieron, cuántos rebotaron.

`unique (edition_id, email)` es la garantía de que un reintento no manda dos
veces la misma edición a la misma persona. Es el error más visible que puede
tener un boletín.

---

## 6. Interfaz — `/ventas/newsletter`

- **Calendario del año**: los huecos programados con su estado. Se ve de un
  vistazo qué falta por escribir.
- **Tema**: título, brief, qué incluir, qué evitar, fuentes sugeridas, marca de
  "toca salud". Botón *Investigar* (apagado si falta el brief).
- **Edición**: vista previa del correo, panel de hallazgos con fuentes, editor de
  bloques, historial de corridas con su costo.
- **Cola "Requiere revisión"** para el gerente, con contador — la misma
  disposición que la cola del calendario de contenido.
- **Enviados**: lista de ediciones con entregados, aperturas, rebotes y bajas.
- **Plantillas**: alta y edición de plantillas de marca, con vista previa.
- **Móvil 375 px**: la vista previa del correo a ancho completo y el editor de
  bloques apilado.

---

## 7. Permisos

| Acción | `ventas` | `gerente_ventas` | `admin` | `super_admin` |
| --- | :-: | :-: | :-: | :-: |
| Crear y editar temas, escribir el brief | ● | ● | ● | ● |
| Correr investigación y redacción | ● | ● | ● | ● |
| Editar bloques de la edición | ● | ● | ● | ● |
| Enviar prueba | ● | ● | ● | ● |
| **Aprobar** / devolver | ○ | ● | ● | ● |
| Confirmar revisión veterinaria | ○ | ○ | ● | ● |
| Programar el envío | ○ | ● | ● | ● |
| Editar plantillas de marca | ○ | ● | ○ | ● |
| Cambiar topes de costo | ○ | ○ | ○ | ● |

---

## 8. Cómo verificamos que quedó

1. Crear una programación semanal genera los huecos del año con sus fechas.
2. Un tema sin brief no deja correr al investigador.
3. La investigación devuelve hallazgos **con fuentes** y las guarda en el
   registro con su costo.
4. Un hallazgo sin fuente no puede insertarse en el correo.
5. El agente de marca produce un correo con la plantilla elegida y bloques
   válidos; cambiar de plantilla lo vuelve a armar sin perder el contenido.
6. Sin envío de prueba, programar **no** deja (restricción de base de datos).
7. Un tema marcado de salud no se puede aprobar sin la confirmación veterinaria.
8. Editar un bloque después de aprobar regresa la edición a revisión.
9. El envío programado sale a su hora, excluye bajas y DND, y `unique` evita el
   duplicado al reintentar.
10. Los webhooks de Resend mueven los estados; un rebote duro marca al suscriptor.
11. El enlace de baja funciona sin sesión y se refleja en la lista.
12. Con sesión `ventas`: aprobar y programar no aparecen, y las server actions
    rechazan la llamada directa.
13. Un texto con "póliza" o "cobertura" se señala antes de aprobar.
14. Verificado en escritorio y en 375 px.

> En desarrollo, con la llave de prueba de Resend solo llegan los correos a
> direcciones verificadas: un estatus "FALLÓ" con `@example.com` es normal y está
> documentado en `CLAUDE.md`.

---

## 9. Decisiones tomadas y por qué

| Decisión | Por qué |
| --- | --- |
| El brief humano es condición de arranque | "Human in the loop" al final es corrección; al principio es dirección |
| El investigador devuelve material con fuentes, no prosa | Separa "qué sabemos" de "cómo lo decimos"; se puede auditar y rehacer |
| Afirmación sin fuente no entra al correo | Un boletín de salud de mascotas que inventa datos es un problema real |
| El agente de marca llena bloques tipados, no escribe HTML | El correo no se rompe en clientes raros y el resultado es predecible |
| Plantillas de marca como datos | Es la forma de "alimentarle las plantillas" sin desplegar |
| Prueba obligatoria antes de programar | Aprobar sin verlo en una bandeja real es aprobar a ciegas |
| Revisión veterinaria para temas de salud | El mismo criterio que ya rige al bot: acompañamiento, no diagnóstico |
| `unique (edition_id, email)` | El duplicado es el error más visible de un boletín |
| Tope de costo que detiene y avisa | Un agente de investigación sin tope es una factura sorpresa |
| Cada corrida guardada con su costo | Permite rehacer, comparar y entender de dónde salió una frase |

---

## 10. Insumos del cliente

| Insumo | Bloquea |
| --- | --- |
| `ANTHROPIC_API_KEY` (ya prevista en `docs/AGENTES-IA.md`) | Ambos agentes; sin ella corren en modo demostración |
| Al menos una plantilla de marca del boletín (diseño y ejemplo) | El agente de marca |
| Correos de prueba del equipo | La compuerta de prueba obligatoria |
| Quién confirma la revisión veterinaria | Temas de salud |
| SMTP de Resend ya configurado | Envío real |

---

## 11. Fuera de alcance de esta sección

- **Página pública y archivo del boletín en el sitio** (decidido: solo correo).
- **Segmentación avanzada** de la lista. Se manda a todos los suscriptores
  activos; sin segmentos por comportamiento.
- **Pruebas A/B de asunto.**
- **Recuperación de imágenes automática** desde las fuentes investigadas.
- **Traducción a otros idiomas.**
- **Reentrenamiento de los agentes.** La mejora es por instrucciones editables,
  igual que en el resto de la plataforma.
