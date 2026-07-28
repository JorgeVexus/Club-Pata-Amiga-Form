# Portal de ventas — Sección 4: Calendario de contenido

> **Estado:** propuesta para aprobación.
> **Depende de:** Sección 0. Independiente de las secciones 1, 2 y 3.
> **Regla que manda:** si un contenido no está **aprobado por un gerente**, no se
> publica. Y eso no es una convención de interfaz: es una restricción de base de
> datos.

---

## 1. El circuito

```
Borrador  →  En revisión  →  Aprobado  →  Programado  →  Publicado
                  ↓              ↓                          ↓
            Devuelto con     (aviso al        Falló → aviso + reintento
             comentarios      gerente)         (nunca queda en silencio)
```

Quién mueve cada paso:

| Paso | Quién |
| --- | --- |
| Borrador → En revisión | Quien lo redacta (`ventas` o arriba) |
| En revisión → Aprobado | **Solo `gerente_ventas` o arriba** |
| En revisión → Borrador (devolver) | El gerente, con comentario obligatorio |
| Aprobado → Programado | Quien redacta o el gerente, eligiendo fecha y hora |
| Programado → Publicado | La plataforma (o una persona, en canales asistidos) |

**Aviso con persona en medio, en tres momentos** (lo pediste explícitamente):

1. Cuando algo entra a revisión → correo y campana al gerente.
2. **Antes de publicar**: aviso al aprobador y al autor con la antelación
   configurada (por omisión 2 horas), con enlace para ver o cancelar. Nada sale
   sin que alguien haya tenido oportunidad de detenerlo.
3. Al publicar o al fallar → aviso del resultado con el enlace a la publicación.

---

## 2. La compuerta, en la base de datos

```sql
create table content_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,              -- el copy
  assets        jsonb not null default '[]', -- rutas en Storage
  channels      text[] not null default '{}',
  scheduled_for timestamptz,
  status        text not null default 'borrador'
                  check (status in ('borrador','revision','aprobado',
                                    'programado','publicado','fallido','cancelado')),
  approved_by   uuid references profiles(id),
  approved_at   timestamptz,
  review_note   text,                        -- comentario al devolver
  campaign      text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Compuerta 1: no se puede programar ni publicar sin aprobación.
  constraint aprobacion_obligatoria check (
    status not in ('programado','publicado') or approved_by is not null
  ),
  -- Compuerta 2: programado exige fecha.
  constraint programado_con_fecha check (
    status <> 'programado' or scheduled_for is not null
  )
);
```

Y una tercera capa: **un disparador borra la aprobación si el contenido cambia**.
Si alguien edita el copy o cambia la imagen después de aprobado, el registro
vuelve a `revision`. Aprobar una cosa y publicar otra es exactamente el accidente
que hay que hacer imposible.

Además, la consulta del publicador es:

```sql
select * from content_posts
 where status = 'programado'
   and approved_by is not null
   and scheduled_for <= now();
```

Un error de interfaz no puede saltarse eso, porque la interfaz no participa.

### 2.1 Un resultado por canal

Publicar en tres canales puede salir bien en dos y fallar en uno. Guardar eso en
un solo campo obliga a reintentar todo:

```sql
create table content_post_targets (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references content_posts(id) on delete cascade,
  channel_id    uuid not null references content_channels(id),
  status        text not null default 'pendiente'
                  check (status in ('pendiente','publicado','fallido','asistido')),
  external_id   text,          -- id de la publicación en la red
  external_url  text,
  error         text,
  attempts      int not null default 0,
  published_at  timestamptz,
  unique (post_id, channel_id)
);
```

Se reintenta solo el que falló, con espera creciente y un máximo. Al agotarse,
avisa; no se queda callado.

### 2.2 Cuentas conectadas

```sql
create table content_channels (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null check (platform in
                 ('facebook','instagram','tiktok','linkedin','x')),
  handle       text not null,
  display_name text,
  mode         text not null default 'asistido'
                 check (mode in ('automatico','asistido')),
  credentials  jsonb,          -- tokens; cifrado en reposo, nunca al cliente
  expires_at   timestamptz,
  assignee_id  uuid references profiles(id),  -- a quién avisar en modo asistido
  is_active    boolean not null default true,
  last_error   text
);
```

---

## 3. Publicadores enchufables

`src/lib/content/registry.ts`, con la misma forma que el registro de canales de
la Sección 0.8:

```ts
type Publicador = {
  platform: string;
  modo: "automatico" | "asistido";
  limites: {
    textoMax: number;
    imagenesMax: number;
    videoSegundosMax?: number;
    formatos: string[];
    proporciones: string[];
  };
  validar(post): Problema[];
  publicar(post, canal): Promise<{ externalId: string; url: string }>;
};
```

Agregar TikTok o LinkedIn mañana es un archivo nuevo y una línea en el registro.
El calendario no cambia.

### 3.1 Lo que se automatiza y lo que se asiste

| Plataforma | Modo | Detalle |
| --- | --- | --- |
| **Facebook (página)** | Automático | Graph API. Ya existe la app de Meta; falta el permiso `pages_manage_posts` |
| **Instagram (feed y reels)** | Automático | Cuenta profesional ligada a la página. Requiere `instagram_content_publish` |
| **Instagram Stories** | Asistido | La API no publica historias de forma confiable: se avisa a la persona con el asset listo |
| **TikTok · LinkedIn · X** | Asistido | Sin app aprobada. El calendario programa, empaqueta y avisa |

**Modo asistido**, en concreto: a la hora programada, la persona responsable
recibe correo y campana con el copy listo para copiar de un toque, el archivo
descargable y un botón que abre la app o el sitio de la red. Al volver, marca
"publicado" y pega el enlace. El calendario queda completo aunque la publicación
la haya hecho una persona.

Es la diferencia honesta entre "no lo tenemos" y "lo tenemos con una persona en
medio".

---

## 4. Validación antes de programar

Cuatro revisiones, todas antes de que algo pueda pasar a `programado`:

1. **Límites del canal** — largo del texto, número de imágenes, duración de
   video, formato y proporción. Cada publicador declara los suyos.
2. **Terminología vinculante** — el copy se revisa contra la lista prohibida
   (*seguro, póliza, cobertura, carencia, fondo solidario, respaldo/apoyo
   económico, consulta o diagnóstico por chat*). Si aparece alguna, **no avanza**
   y se señala la palabra. Es barato de implementar y evita el error más caro de
   este proyecto.
3. **Reclamos de salud** — si el copy promete resultados clínicos o da consejo
   veterinario, se marca para revisión adicional.
4. **Activos presentes** — un post programado sin su imagen no llega a la hora
   de publicar y se descubre tarde; se detecta al programar.

Los problemas se muestran como lista, con la posibilidad de que un `super_admin`
pase por encima de 3 y 4 dejando constancia. **La 2 no se puede saltar.**

---

## 5. Interfaz — `/ventas/calendario`

- **Vistas** mes, semana y lista. Arrastrar para reprogramar (solo si sigue
  aprobado; si se cambió el contenido, no).
- **Colores por estado** y sello del canal en cada tarjeta, para leer el mes de
  un vistazo.
- **Cola "Requiere revisión"** arriba, con contador. Es la pantalla del gerente.
- **Filtros** por canal, estado, autor, campaña.
- **Editor**: copy con contador por canal, vista previa por red, activos desde la
  biblioteca (`site_assets`) o subida nueva, canales destino con casillas, fecha
  y hora, y el resultado de las validaciones en vivo.
- **Asistencia de redacción** (opcional): borrador de copy con la voz de marca a
  partir del tema. Nunca publica; solo redacta. Y pasa por las mismas
  validaciones que lo escrito a mano.
- **Duplicar** un post para adaptarlo a otro canal o volver a usarlo.
- **Bitácora** por post: quién lo escribió, quién lo devolvió y por qué, quién lo
  aprobó, qué pasó al publicar.
- **Móvil 375 px**: la vista de lista es la principal; el mes se navega por
  semanas.

---

## 6. El publicador (tarea programada)

Corre cada 5 minutos (`vercel.json`, autenticado como los crones que ya existen):

1. Toma los `programado` + `approved_by` no nulo + `scheduled_for <= now()`.
2. Por cada canal destino, llama a su publicador.
3. Guarda resultado en `content_post_targets`; reintenta los fallidos con espera
   creciente hasta el máximo.
4. El post queda `publicado` si todos sus destinos automáticos salieron;
   `fallido` si alguno se agotó; los asistidos quedan a la espera de la persona.
5. Avisa el resultado y deja actividad.

También corre el **aviso previo**: los que publican dentro de la ventana de
antelación y aún no fueron avisados.

---

## 7. Permisos

| Acción | `ventas` | `gerente_ventas` | `admin` | `super_admin` |
| --- | :-: | :-: | :-: | :-: |
| Redactar, editar borrador propio, enviar a revisión | ● | ● | ● | ● |
| Editar borrador de otra persona | ○ | ● | ● | ● |
| **Aprobar** / devolver | ○ | ● | ● | ● |
| Programar (ya aprobado) | ● | ● | ● | ● |
| Cancelar un programado | ◐ propio | ● | ● | ● |
| Conectar cuentas de redes | ○ | ● | ○ | ● |
| Saltar validaciones 3 y 4 | ○ | ○ | ○ | ● |
| Saltar la validación de terminología | ○ | ○ | ○ | ○ |

Nadie puede aprobar su propio contenido si tiene rol `ventas`; un
`gerente_ventas` sí puede aprobar lo que él mismo escribió (el equipo es chico y
exigir dos gerentes bloquearía el trabajo). Queda en la bitácora que fue la misma
persona.

---

## 8. Cómo verificamos que quedó

1. Un post en `revision` al que le llega su hora **no se publica**, y el intento
   queda registrado.
2. Forzar por SQL `status = 'programado'` sin `approved_by` → **la restricción lo
   rechaza**.
3. Aprobar un post y luego editar el copy → vuelve a `revision` solo, y ya no se
   publica a su hora.
4. Un post aprobado y programado se publica en la página de Facebook de prueba y
   guarda su enlace.
5. Publicación en dos canales donde uno falla: el otro sí sale, y solo reintenta
   el que falló.
6. Un canal asistido genera el aviso con copy y archivo, y al marcarlo publicado
   con su enlace el post queda completo.
7. Un copy con la palabra "seguro" **no** se puede programar, ni por un
   `super_admin`.
8. El aviso previo llega con la antelación configurada y su enlace para cancelar.
9. Cancelar desde ese aviso evita la publicación.
10. Con sesión `ventas`: el botón de aprobar no existe, y la server action de
    aprobar rechaza la llamada directa.
11. Verificado en escritorio y en 375 px.

---

## 9. Decisiones tomadas y por qué

| Decisión | Por qué |
| --- | --- |
| La aprobación es restricción de base de datos | Un botón se puede saltar por un error de interfaz; una restricción no |
| Editar el contenido borra la aprobación | Aprobar una cosa y publicar otra es el accidente a evitar |
| Un resultado por canal, no uno global | Para reintentar solo lo que falló |
| Aviso previo a publicar, con opción de cancelar | Es la persona en medio que pediste, sin volver todo manual |
| Modo asistido en lugar de esperar aprobaciones de API | El calendario sirve desde el día uno, con la red que sea |
| La terminología prohibida no la puede saltar nadie | Es vinculante; un post con "seguro" es un problema legal, no un detalle de estilo |
| El fallo siempre avisa | Un post que no salió y nadie lo supo es peor que uno que no se programó |
| La asistencia de redacción no publica | Redactar es ayuda; publicar es responsabilidad |

---

## 10. Insumos del cliente

| Insumo | Bloquea |
| --- | --- |
| Permisos `pages_manage_posts` e `instagram_content_publish` en la app de Meta, con revisión de Meta (1–3 semanas) | Publicación automática en Facebook e Instagram |
| Cuentas de TikTok / LinkedIn / X y quién es responsable de cada una | Modo asistido en esas redes |
| Antelación deseada del aviso previo | Se usa 2 horas mientras no se decida |

---

## 11. Fuera de alcance de esta sección

- **Comentarios y menciones** de las publicaciones (también limitación de
  GoHighLevel).
- **Analítica de contenido** (alcance, interacción) → Sección 7, y solo con lo
  que la API entregue.
- **Escucha social y análisis de competencia.**
- **Generación de imágenes** dentro del calendario. Los activos se producen fuera
  y se suben (hoy se hacen con Higgsfield y se publican por Admin → Sitio web).
- **Publicación en Google Business Profile.**
- **Cola de publicación por franjas** ("mejores horas"). Se programa a mano.
