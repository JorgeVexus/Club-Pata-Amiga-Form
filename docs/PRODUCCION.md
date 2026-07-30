# Checklist de salida a producción — Club Pata Amiga

> La plataforma está **completa en funcionalidad** (ver `ESTADO-DEL-PROYECTO.md`).
> Lo que sigue es conectar cuentas reales, datos reales y el dominio.

> ## ⚠️ Antes que nada: el plan de Vercel tiene que subir a Pro
>
> **La cuenta está hoy en Hobby, y ahí el proyecto ya no despliega.** Hobby
> permite **2 tareas programadas y solo con horario diario**; `vercel.json`
> declara **8**, cuatro de ellas cada 5, 10, 10 y 15 minutos. Vercel rechaza el
> despliegue completo por eso (el enlace de error de cada commit apunta a
> [Cron Jobs — Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)).
>
> Es una decisión ya tomada y consciente: **no se recortan los crones**. Son
> funcionalidad viva — mensajes programados, escalaciones y publicación del
> calendario — y el código se deja listo para producción, donde la cuenta sí va
> a estar en Pro. Subir el plan es el **paso 0** del cutover: sin eso no hay
> despliegue, por más que todo lo demás esté configurado.
>
> **Consecuencia mientras tanto: staging está congelado.** El último despliegue
> que pasó fue el commit `58cf99a` (27-jul-2026 19:41, sección F2b). Todo lo
> posterior vive en GitHub y corre en local, pero **no está en
> https://pata-amiga-one.vercel.app**. No uses staging para revisar nada nuevo:
> levanta el proyecto en local (`npm run build && npm start`) o mira el repo.
>
> ### Qué desbloquea exactamente el upgrade (importa para planear)
>
> **En Vercel el plan es de la cuenta/equipo, no del proyecto.** De ahí salen dos
> caminos distintos:
>
> - **Si `pata-amiga-one` vive en la cuenta que sube a Pro:** staging se
>   descongela solo, sin tocar una línea. El siguiente push despliega los ~10
>   commits pendientes y ahí se verifica todo lo que hoy solo corre en local.
> - **Si producción se monta en OTRA cuenta (la del cliente):** el proyecto de
>   staging se queda en Hobby y sigue congelado. En ese caso no hay que
>   arreglarlo: se crea el proyecto de producción en la cuenta nueva **desde el
>   día uno del Pro**, apuntando al mismo repo, con las llaves de PRUEBA y una URL
>   temporal de Vercel. Se verifica ahí, y en el cutover solo se cambian las env
>   vars a las llaves live y se apunta el DNS. El mismo plan Pro cubre los dos
>   proyectos.
>
> ### Lo que NO se puede dar por bueno sin un ambiente desplegado
>
> Todo el código está verificado en local, pero hay fallas que **solo existen
> desplegado**, y no conviene descubrirlas con clientes y dinero real adentro:
>
> 1. **Vercel corre en UTC.** La plataforma cuenta los días en hora de México
>    (`src/lib/zona-horaria.ts`, con prueba que corre igual bajo `TZ=UTC`), pero
>    la prueba cubre la aritmética, no que se hayan encontrado todos los lugares
>    que la usan. Un despliegue real es la única forma de confirmarlo.
> 2. **Las tareas programadas nunca han corrido por horario.** En local se
>    disparan a mano con `CRON_SECRET`.
> 3. **Los webhooks con URL real y verificación de firma**: Stripe, Resend y
>    correo entrante. En local se prueban con cargas simuladas.
> 4. **Entrega de correo con dominio verificado.** Hoy la llave de Resend solo
>    entrega al correo de la cuenta.
> 5. **Env vars faltantes**: en local muchas tienen respaldo silencioso; en
>    producción una que falte apaga una función sin avisar (ver sección 1).
>
> Por eso el orden recomendado es: **Pro → ambiente desplegado con llaves de
> prueba → verificar los cinco puntos de arriba → cutover.** Saltar del local a
> producción se puede, pero cada uno de esos cinco pasa a ser un riesgo del día
> del lanzamiento.

## 1. Cuentas y llaves (crear en las cuentas del CLIENTE, no personales)

| Servicio | Qué hacer | Sale de ahí |
|---|---|---|
| **Supabase (prod)** | Proyecto nuevo → correr las **36 migraciones** de `supabase/migrations/` en orden (crean tablas, RLS y buckets). | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Supabase Auth** | Site URL + Redirect URLs = dominio final · Google provider con credenciales de producción (Google Cloud Console, dominio final) · decidir si "Confirm email" queda encendido | — |
| **Stripe (live)** | Crear producto "Membresía Club Pata Amiga" con precios reales ($159 mes / $1,699 año) · webhook a `https://<dominio>/api/stripe/webhook` (4 eventos: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed) · crear el cupón + promotion code de la landing · nombre público del negocio | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Verificar el dominio `pataamiga.mx` (DNS: SPF/DKIM) para que los correos no caigan en spam | `RESEND_API_KEY`, `EMAIL_FROM` (ej. `Club Pata Amiga <hola@pataamiga.mx>`) |
| **Anthropic** | API key para la orientación veterinaria 24/7 (hoy corre simulada) | `ANTHROPIC_API_KEY`, `LLM_PROVIDER=anthropic` |
| **Vercel** | **Subir el plan a Pro ANTES que nada** (ver el aviso de arriba: en Hobby el proyecto no despliega por el límite de crones) → proyecto conectado al repo (ya existe) → cambiar env vars a las de producción → dominio | `NEXT_PUBLIC_SITE_URL=https://<dominio>` |
| **Correo entrante** (portal de ventas) | Decidir el subdominio del buzón compartido (p. ej. `hola@pataamiga.mx`) y apuntar su webhook de entrada a `https://<dominio>/api/canales/email/webhook`, con el secreto en el encabezado `x-webhook-secret` | `EMAIL_WEBHOOK_SECRET` |
| **Tareas programadas** | Los crones de Vercel se autentican solos; el secreto sirve para dispararlos a mano (`/api/cron/carritos`, `/api/cron/cumpleanos`) | `CRON_SECRET` |

### Variables de entorno: las 22 que el código lee

Sacadas del código (`grep process.env`), no de memoria. **La llave publicable de
Stripe ya no se usa** (el checkout se arma en el servidor y redirige a Stripe),
así que no hay que darla de alta aunque la pidiera este checklist antes.

**Sin estas 12 la plataforma no funciona:**

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` | Base de datos y sesiones |
| `STRIPE_SECRET_KEY` · `STRIPE_PRICE_MONTHLY` · `STRIPE_PRICE_ANNUAL` · `STRIPE_WEBHOOK_SECRET` | Cobro y activación de membresía |
| `RESEND_API_KEY` · `EMAIL_FROM` | Todos los correos |
| `NEXT_PUBLIC_SITE_URL` | Enlaces de correo, redirecciones y webhooks |
| `LLM_PROVIDER=anthropic` · `ANTHROPIC_API_KEY` | Orientación 24/7 y los agentes. **Sin ellas todo corre en modo demostración y lo dice en pantalla** |

**Estas 10 apagan una función cada una, en silencio si nadie revisa:**

| Variable | Qué se apaga si falta |
|---|---|
| `CRON_SECRET` | Disparar una tarea programada a mano (los crones de Vercel se autentican solos) |
| `EMAIL_WEBHOOK_SECRET` | Correo entrante: sin ella la ruta **solo** acepta llamadas locales (a propósito, para no dejar el endpoint abierto) |
| `RESEND_WEBHOOK_SECRET` | El webhook de Resend acepta eventos **sin verificar la firma** |
| `META_VERIFY_TOKEN` · `META_APP_SECRET` | Webhooks de Facebook/Instagram y la verificación de su firma |
| `META_PAGE_ACCESS_TOKEN` | Responder por Facebook e Instagram |
| `WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_ACCESS_TOKEN` | Enviar WhatsApp |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocompletado de direcciones (hay respaldo manual) |
| `LLM_MODEL` | Solo si se quiere fijar un modelo distinto al de omisión |

## 2. Dominio (decisión pendiente)

- ¿Todo en `pataamiga.mx`, o la app en `app.pataamiga.mx` como hoy?
- Landing de campaña: opcionalmente `regalo.pataamiga.mx` → `/landings/regalo` (ver `LANDINGS.md`).
- Afecta: DNS en Vercel, Redirect URLs de Supabase, credenciales de Google, webhook de Stripe, `NEXT_PUBLIC_SITE_URL`.

## 3. Datos

- **Migración Memberstack** (por construir, ~1 sesión): necesita el export de miembros actuales (correo, nombre, plan, mascotas) + aprobar el correo "activa tu nueva cuenta". Sin esto los miembros actuales no existen en la plataforma nueva.
- **Sepomex** (por construir, ~1 sesión): importar el catálogo CP→colonia a tabla propia; hoy depende de un espejo externo gratuito (riesgo de caída).
- El proyecto prod arranca limpio — los datos de prueba viven solo en el proyecto dev.

## 4. Contenido (sin código, desde el Admin)

- Palabra **cupón** de la landing: ya se crea desde Ventas → Membresías → Cupones,
  que lo da de alta en Stripe y lo deja en la landing en un solo paso. Solo falta
  que el equipo decida la palabra (ya no hay que entrar a Stripe).
- **Materiales de embajador** reales (pack IG, video, guía de marca, campaña).
- **Fotos finales** de landing si se quieren cambiar (Admin → Sitio web).
- **Destinatarios de notificaciones** del equipo (Admin → Sitio web → Notificaciones).
- Revisar/ajustar las **15 plantillas de correo** (Admin → Comunicados).
- **Convenio asociado** (texto legal faltante) + versiones legales con terminología 2026 (despacho).
- **Cuentas de redes** del calendario (Ventas → Calendario → Cuentas) y quién es
  responsable de cada una en modo asistido.
- **Antelación del aviso previo** del calendario (`contenido_aviso_horas` en
  Admin → Sitio). Sin ajuste son 2 horas.
- **Boletín**: plantilla de marca (Ventas → Boletín → Plantillas), correos de
  prueba y precios/topes de la IA (Ajustes de IA), y quién confirma la revisión
  veterinaria de los temas de salud.
- **Webhook de Resend** dado de alta a `https://<dominio>/api/webhooks/resend`,
  con su palabra secreta en `RESEND_WEBHOOK_SECRET`. Sin ella el endpoint
  acepta eventos sin verificar la firma.
- **Agente demo**: cargar los ejemplos revisados y decidir cuándo encenderlo
  (Ventas → Agentes IA). Sale **apagado** a propósito: una demostración mal
  calibrada le habla a todos los prospectos a la vez.
- **Reportes**: destinatarios en Sitio web → Notificaciones y la cadencia del
  reporte de ventas automático (`no` · `semanal` · `mensual`).
- ~~**Histórico de LynSales**~~: **hecho el 29-jul en dev** (452 contactos con su
  fecha de alta real; las 543 filas sin correo ni teléfono se descartan por
  acuerdo con el cliente). En producción hay que **volver a importarlo**, porque
  el proyecto prod arranca limpio: misma pantalla, mismo archivo, ~11 minutos.
  Ver `docs/portal-ventas/HANDOFF.md`, punto 3.2.

### Decisión pendiente: publicar los planes en Stripe

Las versiones vigentes de plan (las que creó la migración inicial) **no** están
publicadas en Stripe, así que el checkout usa los precios de
`STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`. Funciona, pero ese precio
pertenece a otro producto de Stripe, y por eso un cupón restringido a un plan
no aplicaría (el portal lo detecta y lo explica en lugar de crear un cupón
inútil).

Publicarlas desde Ventas → Membresías crea sus precios propios y cierra el
cabo. Ojo: **cambia el precio que ve una alta nueva**, así que es decisión del
equipo. Los miembros existentes no se mueven — los precios de Stripe son
inmutables y cada suscripción sigue apuntando al suyo.

## 5. Por construir aún (pequeño, post-cutover posible)

- **Cron de recordatorios** de renovación (Vercel cron, ~½ sesión).
- (Opcional) automatizar corte mensual de comisiones — hoy es botón manual + layout CSV.
- (Opcional, si se decide) integración PAC para emitir CFDI — hoy la plataforma captura los datos fiscales y el contador factura manualmente.
- (Opcional) validación automática del cupón / registro de redención.

## 6. Cutover (día del lanzamiento)

0. **Antes del día:** plan Pro y un ambiente desplegado con llaves de prueba,
   con los cinco puntos del aviso de arriba ya verificados. Si esto se salta,
   los pasos 2 y 3 dejan de ser una comprobación y se vuelven la primera vez.
1. Env vars de producción en Vercel + redeploy.
2. Probar registro completo con **tarjeta real** (y reembolsarla).
3. Verificar: correo de bienvenida llega (no spam), webhook activa la membresía, login con Google.
4. Apuntar DNS del dominio a Vercel; apagar Webflow/Memberstack.
5. Correr la migración de miembros + enviar campaña "activa tu cuenta".
6. Importar el histórico de LynSales en el proyecto nuevo (~11 min).
7. Monitorear Admin → Resumen → "Salud del sistema" los primeros días (los errores avisan por correo).

## División sugerida del trabajo

- **Coder:** cuentas/llaves (sección 1), dominio/DNS (2), cutover (6).
- **Claude (siguientes sesiones):** migración Memberstack, Sepomex, cron de recordatorios (3 y 5).
- **Equipo/cliente:** contenido y decisiones (2 dominio, 4 completo).
