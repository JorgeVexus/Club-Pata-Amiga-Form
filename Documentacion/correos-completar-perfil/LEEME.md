# Correos "Completa el perfil de tu peludo" · Club Pata Amiga

Rediseño en la identidad actual (Dirección A "Manada fresca") de los 12 mailings
que entregó la agencia (carpeta de Drive `BOLD_MAILING_MAYO_*`). **Solo diseño** —
no están conectados a la plataforma; son archivos editables para usar en
cualquier herramienta de envío (Resend, ESP, workflows de agentes, etc.).

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | Vista previa de los 12 correos en una sola página (ábrelo en el navegador) |
| `correo-<día>-<variante>.html` | Los 12 correos (4 días × 3 variantes) |
| `generar_correos.py` | Generador: edita textos/colores ahí y corre `python generar_correos.py` para regenerar todo |
| `assets/` | Arte de marca generado (héroes, huella, footer con la familia) |
| `assets/recortes/` | Recortes PNG transparentes de las mascotas (reutilizables para más piezas) |

## El journey (cuenta regresiva para completar el perfil)

Secuencia original de la agencia: recordatorios para subir **la foto** y **el
certificado médico** del peludo antes del cierre.

- **día 15** — bienvenida: "tu perfil está a nada de quedar completo"
- **día 3** — quedan 3 días
- **día 2** — quedan 2 días (muy cerca del cierre)
- **día 1** — último día

Cada día tiene **3 variantes** (se envía solo la que aplique al perfil):

- `ambos` → faltan foto **y** certificado (tarjeta teal)
- `foto` → solo falta la foto (tarjeta amarilla)
- `certificado` → solo falta el certificado (tarjeta naranja)

## Variables

Los HTML usan el mismo formato `{{variable}}` que las plantillas de la
plataforma (/admin/comunicados):

- `{{nombre}}` — nombre de la persona
- `{{nombre_peludo}}` — nombre de la mascota
- `{{url_completar}}` — link al panel para completar el perfil

Asuntos sugeridos:

- día 15: `El perfil de {{nombre_peludo}} está a nada de quedar completo 🐾`
- día 3: `Quedan 3 días para completar el perfil de {{nombre_peludo}}`
- día 2: `⏰ 2 días — deja listo el perfil de {{nombre_peludo}} hoy`
- día 1: `Último día para completar el perfil de {{nombre_peludo}} 💛`

## Cambios de copy vs. los originales (importante)

1. **Terminología vinculante**: los originales decían "puedes contar con el
   **respaldo** de la manada" y "brindarte el **apoyo** correcto/adecuado"
   (prohibido por sonar a respaldo económico/seguro). Se cambió a
   *"contar con tu manada"*, *"acompañarte"* y *"reaccionar a tiempo"*.
2. Se corrigieron typos de los originales ("Solo faltan este detalle",
   "perfl ahora", "aun paso", "Estás aun paso de activarlo").
3. "Estás a un paso de **activarlo**" → "de **dejarlo listo**" (la membresía ya
   está activa; "activar" podía confundir).
4. Footer con línea de cumplimiento: *"Pata Amiga es una membresía de salud
   para mascotas. No es un seguro."*

## Notas de diseño / técnica

- **600 px, tablas + estilos inline** — formato apto para clientes de correo
  (mismo patrón que `src/lib/email/templates.ts` de la plataforma).
- **Tipografías**: Fraiche no se puede incrustar en correos; los títulos usan
  **Baloo 2** (Google Fonts, se parece mucho) y el cuerpo **Outfit**, con
  respaldo Arial. Gmail/Outlook mostrarán Arial: es esperado y se ve bien.
- **Imágenes con ruta relativa** (`assets/...`): para envíos reales hay que
  hospedarlas (p. ej. el bucket público `site-assets` de Supabase, como ya se
  hace con `email-header.png`) y reemplazar los `src`.
- Los emojis de los iconos (📷 🩺) se pueden cambiar por PNGs de iconos si se
  quiere el estilo de línea de los originales.
- El acento rosa `#F23D6D` marca la cuenta regresiva ("ÚLTIMO DÍA", "2 DÍAS").
- Paleta: crema `#FAF7F1` · teal `#1CBCAD` · teal oscuro `#1E5350` · amarillo
  `#FFC20E` · naranja `#F7941D` · rosa `#F23D6D`.

## Pendientes / decisiones abiertas

- ¿El "cierre" del que hablan los correos es el fin del período de espera del
  peludo? Confirmar con el equipo qué dispara la secuencia (día 15/3/2/1) antes
  de conectarla a un workflow.
- El correo del día 15 menciona "desde tu panel" — el CTA debe apuntar al panel
  real (`/app`) cuando se use.
- Los originales de la agencia (JPG + .ai + PSDs) siguen en el Drive compartido.
