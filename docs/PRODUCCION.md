# Checklist de salida a producción — Club Pata Amiga

> La plataforma está **completa en funcionalidad** (ver `ESTADO-DEL-PROYECTO.md`).
> Lo que sigue es conectar cuentas reales, datos reales y el dominio.
> Staging funcionando: https://pata-amiga-one.vercel.app (todo en modo prueba).

## 1. Cuentas y llaves (crear en las cuentas del CLIENTE, no personales)

| Servicio | Qué hacer | Sale de ahí |
|---|---|---|
| **Supabase (prod)** | Proyecto nuevo → correr las **9 migraciones** de `supabase/migrations/` en orden (crean tablas, RLS y buckets). | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Supabase Auth** | Site URL + Redirect URLs = dominio final · Google provider con credenciales de producción (Google Cloud Console, dominio final) · decidir si "Confirm email" queda encendido | — |
| **Stripe (live)** | Crear producto "Membresía Club Pata Amiga" con precios reales ($159 mes / $1,699 año) · webhook a `https://<dominio>/api/stripe/webhook` (4 eventos: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed) · crear el cupón + promotion code de la landing · nombre público del negocio | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Verificar el dominio `pataamiga.mx` (DNS: SPF/DKIM) para que los correos no caigan en spam | `RESEND_API_KEY`, `EMAIL_FROM` (ej. `Club Pata Amiga <hola@pataamiga.mx>`) |
| **Anthropic** | API key para la orientación veterinaria 24/7 (hoy corre simulada) | `ANTHROPIC_API_KEY`, `LLM_PROVIDER=anthropic` |
| **Vercel** | Proyecto conectado al repo (ya existe) → cambiar env vars a las de producción → dominio | `NEXT_PUBLIC_SITE_URL=https://<dominio>` |
| **Correo entrante** (portal de ventas) | Decidir el subdominio del buzón compartido (p. ej. `hola@pataamiga.mx`) y apuntar su webhook de entrada a `https://<dominio>/api/canales/email/webhook`, con el secreto en el encabezado `x-webhook-secret` | `EMAIL_WEBHOOK_SECRET` |
| **Tareas programadas** | Los crones de Vercel se autentican solos; el secreto sirve para dispararlos a mano (`/api/cron/carritos`, `/api/cron/cumpleanos`) | `CRON_SECRET` |

**Total de variables de entorno: 15** (las 11 actuales de `vercel-env-staging.txt`, las 2 del LLM
y las 2 del portal de ventas).

> Ojo: las migraciones ya no son 9 sino **25** — el portal de ventas agregó de la
> 20 a la 25. Correrlas en orden.
>
> Sin `EMAIL_WEBHOOK_SECRET` la ruta de correo entrante **solo** acepta llamadas
> locales, así que se puede probar en desarrollo sin dejar el endpoint abierto.

## 2. Dominio (decisión pendiente)

- ¿Todo en `pataamiga.mx`, o la app en `app.pataamiga.mx` como hoy?
- Landing de campaña: opcionalmente `regalo.pataamiga.mx` → `/landings/regalo` (ver `LANDINGS.md`).
- Afecta: DNS en Vercel, Redirect URLs de Supabase, credenciales de Google, webhook de Stripe, `NEXT_PUBLIC_SITE_URL`.

## 3. Datos

- **Migración Memberstack** (por construir, ~1 sesión): necesita el export de miembros actuales (correo, nombre, plan, mascotas) + aprobar el correo "activa tu nueva cuenta". Sin esto los miembros actuales no existen en la plataforma nueva.
- **Sepomex** (por construir, ~1 sesión): importar el catálogo CP→colonia a tabla propia; hoy depende de un espejo externo gratuito (riesgo de caída).
- El proyecto prod arranca limpio — los datos de prueba viven solo en el proyecto dev.

## 4. Contenido (sin código, desde el Admin)

- Palabra **cupón** de la landing (Admin → Landings) + el mismo código en Stripe (manual).
- **Materiales de embajador** reales (pack IG, video, guía de marca, campaña).
- **Fotos finales** de landing si se quieren cambiar (Admin → Sitio web).
- **Destinatarios de notificaciones** del equipo (Admin → Sitio web → Notificaciones).
- Revisar/ajustar las **15 plantillas de correo** (Admin → Comunicados).
- **Convenio asociado** (texto legal faltante) + versiones legales con terminología 2026 (despacho).

## 5. Por construir aún (pequeño, post-cutover posible)

- **Cron de recordatorios** de renovación (Vercel cron, ~½ sesión).
- (Opcional) automatizar corte mensual de comisiones — hoy es botón manual + layout CSV.
- (Opcional, si se decide) integración PAC para emitir CFDI — hoy la plataforma captura los datos fiscales y el contador factura manualmente.
- (Opcional) validación automática del cupón / registro de redención.

## 6. Cutover (día del lanzamiento)

1. Env vars de producción en Vercel + redeploy.
2. Probar registro completo con **tarjeta real** (y reembolsarla).
3. Verificar: correo de bienvenida llega (no spam), webhook activa la membresía, login con Google.
4. Apuntar DNS del dominio a Vercel; apagar Webflow/Memberstack.
5. Correr la migración de miembros + enviar campaña "activa tu cuenta".
6. Monitorear Admin → Resumen → "Salud del sistema" los primeros días (los errores avisan por correo).

## División sugerida del trabajo

- **Coder:** cuentas/llaves (sección 1), dominio/DNS (2), cutover (6).
- **Claude (siguientes sesiones):** migración Memberstack, Sepomex, cron de recordatorios (3 y 5).
- **Equipo/cliente:** contenido y decisiones (2 dominio, 4 completo).
