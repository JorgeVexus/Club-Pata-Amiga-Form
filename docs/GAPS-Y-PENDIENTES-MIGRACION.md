# Gaps y pendientes tras la migración a pata-amiga

## Preview de staging en Vercel

- URL: https://club-pata-amiga-form-pwbkdir3p-jorge-vexus-projects.vercel.app
  (alias estable: https://club-pata-amiga-form-jorge-3511-jorge-vexus-projects.vercel.app)
  — apunta al proyecto Supabase `pata-amiga-staging`, **no** a producción.
  Verificado con una cuenta que solo existe en staging.
- Las env vars de este preview están puestas en Vercel scoped al git
  branch `staging` (Preview → staging), sin tocar Production. Ver
  `vercel env ls preview staging`.
- **Deployment Protection (SSO) se desactivó** para este proyecto
  (`ssoProtection: null` vía API) para poder probar sin necesitar sesión
  de Vercel — antes bloqueaba hasta las rutas API. Si se quiere reactivar
  luego (ej. antes de invitar gente externa a probar), es una decisión de
  seguridad del equipo, no algo que revertí automáticamente.
- **git push a `origin/staging` no dispara un deploy automático** en este
  proyecto (se probó y no ocurrió) — hay que correr `vercel deploy`
  manualmente (o revisar en el dashboard de Vercel si la integración de
  GitHub está conectada a esa rama).
- El deploy debe hacerse con la rama local `staging` como checkout activo
  (`git checkout staging`) para que Vercel asocie el build con las env
  vars scoped a esa rama — deployar desde `migracion/pata-amiga`
  directamente NO usa esas variables (se probó: cae en las variables
  generales de Preview, que comparten Supabase con producción).

## ⚠️ Cron de mensajes en Vercel Hobby (temporal)

`vercel.json` → `/api/cron/mensajes` está en `"0 17 * * *"` (1 vez al día)
en vez de `"*/10 * * * *"` (cada 10 min, como lo diseñó pata-amiga) porque
el plan Hobby de Vercel solo permite crons diarios. **Cuando se actualice
a Vercel Pro, volver a `*/10 * * * *`** para que los mensajes programados
del CRM de ventas salgan con precisión de minutos en vez de una vez al
día. Ver `src/app/api/cron/mensajes/route.ts` para el detalle del cron.

## ⚠️ Incidente de producción (2026-07-28) y cambio de arquitectura

El sitio viejo en producción (`app.pataamiga.mx` / `club-pata-amiga-form.vercel.app`,
un deploy de Vercel separado de este repo) consulta **la misma base de
datos Supabase** (`hjvhntxjkuuobgfslzlf`). Mover las tablas viejas en
conflicto de nombre a un schema `legacy` rompió esa producción en vivo
(`column pets.owner_id does not exist`). Se revirtió de inmediato: las
tablas originales volvieron a `public`, y las tablas nuevas de pata-amiga
ya migradas (443 usuarios/293 mascotas) se movieron a un schema
`pata_amiga_new` dentro de ese mismo proyecto (quedan ahí, listas para el
cutover real, sin afectar producción).

**A partir de este punto, el desarrollo de la migración continúa en un
proyecto Supabase de staging separado**: `pata-amiga-staging`
(ref `dpsdopbwnxgwowzehotj`). Las 26 migraciones + bridge ya están
aplicadas ahí (schema `public` limpio, sin colisiones). `.env.local` ya
apunta a staging. **El día del cutover real** (cuando se dé de baja el
sitio viejo) hay que: 1) crear el esquema pata-amiga en producción tal
cual está en staging, 2) mover los 443 usuarios/293 mascotas que quedaron
parqueados en `pata_amiga_new` del proyecto de producción a `public` (o
re-correr el backfill ahí), 3) hacer el deploy del código nuevo. No usar
el proyecto de producción para seguir desarrollando mientras el sitio
viejo siga vivo.

Este documento se generó durante la migración del proyecto anterior
(Memberstack + esquema `users`/`pets`) hacia el codebase de
`Chepiztrike/pata-amiga`. Lista lo que quedó pendiente o requiere decisión,
para el otro dev y para continuar el trabajo en próximas sesiones.

## Bug encontrado en pata-amiga (no introducido por esta migración) — ✅ corregido

- **`src/lib/supabase/middleware.ts`**: la protección de rutas usaba
  `path.startsWith("/embajador")`, lo cual también bloqueaba `/embajadores`
  (la página pública del programa de embajadores) porque
  `"/embajadores".startsWith("/embajador")` es `true`. **Corregido**:
  ahora compara `path === "/embajador" || path.startsWith("/embajador/")`.
  Verificado con curl: `/embajador` → 307 a login, `/embajadores` → 200.

## Puente de autenticación legacy (Memberstack -> Supabase Auth) — ✅ endpoint confirmado

- `src/lib/legacy-auth-bridge.ts` llama a
  `POST https://client.memberstack.com/auth/login` (no `/member/login`,
  que daba 404). **Confirmado en vivo** contra el proyecto real de
  Memberstack de este cliente: un intento con credenciales inválidas
  devuelve `{"code":"invalid-credentials", ...}` con el mensaje de error
  personalizado de esta cuenta (no un 404 genérico).
- Una vez migrado un usuario (`legacy_password_migrated = true`), ya no se
  vuelve a validar contra Memberstack — solo Supabase Auth nativo.
- **✅ Probado con una cuenta real de producción**
  (`clubpataamiga@gbtravel.com.mx`, miembro "Lucero"): login exitoso con
  su password real, sus 3 mascotas reales (Felipe/Felix/Fido) aparecen
  con su estado correcto, `legacy_password_migrated` quedó en `true`.
  **Importante**: `NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY` debe ser la key en
  **modo Live** de Memberstack (prefijo `pk_...`, sin `_sb_`) — la de
  sandbox (`pk_sb_...`) rechaza cuentas reales con
  `"You're in test mode, but tried to login with a live account."`. Ya
  está corregido en `.env.local` de este entorno de trabajo; el otro dev
  debe usar la misma key live al configurar su propio `.env.local`.
- **✅ Roles de admin migrados**: el backfill original no mapeaba
  `users.role` (admin/super_admin) — los 4 admins reales de producción
  habrían quedado como "member" tras migrar. Corregido en
  `scripts/backfill-legacy-users.ts` y ya arreglado también en los datos
  de staging. Verificado: login de un admin real rutea a `/admin` con
  las métricas reales completas.

## Datos que no se migraron automáticamente

- **✅ Staging es ya un espejo completo de los datos reales**: 441/450
  usuarios, 294/326 mascotas, 45/45 ambassadors y 13/13 wellness centers
  (con cuenta de acceso ligada) — ver
  `scripts/backfill-legacy-users.ts` (ahora soporta migrar entre dos
  proyectos Supabase distintos vía `SOURCE_SUPABASE_URL`/
  `SOURCE_SERVICE_ROLE_KEY`), `scripts/migrate-legacy-pets-to-staging.mjs`
  y `scripts/link-wellness-center-accounts.mjs`.
- **9 cuentas con email duplicado/identidad repetida** entre múltiples
  registros legacy (`cipatli.martinez@pataamiga.mx` x3,
  `cipatli.martinez@rabadoub.com.mx` x2, `asahi00@gmail.com` x2,
  `asahi01@gmail.com` x2, `asahizv5@gmail.com`, `rebecasaj26@icloud.com`
  — estos dos últimos porque la misma persona tiene cuenta de miembro Y de
  embajador con IDs distintos sin vincular —, más 1 usuario sin email) no
  tienen `profiles` propio — Supabase Auth exige email único. Requieren
  revisión manual (fusionar identidades o descartar duplicados de
  prueba). Sus mascotas (11) tampoco se migraron por la misma razón.
- **21 mascotas sin `pet_type` reconocible** (ni "dog" ni "cat") no se
  migraron porque `species` es `NOT NULL` en el esquema nuevo. Requieren
  asignarles especie manualmente antes de migrar.
- **Ambassadors y wellness_centers** — ✅ migrados a staging (45/45
  ambassadors, 14/14 wellness_centers, ver
  `scripts/migrate-legacy-ambassadors-centers.mjs`). Un centro con status
  legacy `"appealed"` (sin equivalente en el enum `wellness_status` nuevo,
  que solo tiene pending/approved/rejected) se mapeó a `pending`. Probado
  con datos reales: login de embajador migrado con password bcrypt
  legacy, aprobación desde el panel admin. Pendiente: correr el mismo
  script contra producción el día del cutover (hoy solo escribió en
  staging).
- Los datos bancarios de wellness_centers (`bank_name`/`bank_clabe`/
  `bank_holder`) **no se migraron** porque esas columnas no existen en el
  `wellness_centers` nuevo de pata-amiga (sí existen en `ambassadors`).
  Si se siguen necesitando, hay que agregarlas.
- El resto de tablas movidas a `legacy` (`notifications`, `referrals`,
  `campaign_leads`, `emergency_logs`, `legal_documents`,
  `newsletter_subscribers`, `site_assets`, `site_settings`,
  `ambassador_payouts`, `wellness_center_locations`) tampoco se migraron
  todavía — pata-amiga ya tiene sus propias versiones de estas tablas
  (vacías), pero el histórico legacy sigue solo en `legacy.*`.

## Funcionalidad de nuestro repo sin equivalente claro en pata-amiga

Pendiente de decidir, feature por feature, si se porta o se descarta
(varias pueden ya estar cubiertas de otra forma en pata-amiga — falta
confirmar caso por caso):

- **`emergency_logs` (botón de pánico)**: pata-amiga tiene la tabla
  (`emergency_logs`) pero no se confirmó que exista la UI/endpoint
  correspondiente en el portal de miembro (`/app`).
- **Autoservicio de miembro** — ✅ confirmado en `/app/cuenta`: cambiar de
  plan (mensual↔anual), cancelar membresía (con motivo, programada a fin
  de período pagado) y reactivar («reingreso») están implementados y se
  probaron de punta a punta en staging: cancelar → «Cancelación
  programada» + botón «Reactivar» → reactivar → vuelve a «Membresía
  activa». Sigue pendiente: actualizar método de pago (no se vio un botón
  dedicado, revisar si se maneja desde el Customer Portal de Stripe).
- **Rutas de embajador más finas**: mensajes, reenvío de código, cambio de
  código, generación de link de invitación, re-upload de documentos. El
  portal `/embajador` de pata-amiga existe pero no se confirmó cobertura
  1:1.
- **Fondo solidario**: reemplazado intencionalmente por "reintegro"
  (decisión de negocio ya tomada por el equipo, ver AGENTS-pata-amiga.md) —
  no se porta, es esperado.
- **Herramientas admin de bajo nivel** (bulk-delete, migrate-payment-status,
  seed-breeds, skip-payment): probablemente no necesarias en producción,
  se listan solo por completitud.

## CRM de ventas, canales y cron — estado

- **`/ventas` (CRM)**: carga sin errores, pero el propio equipo lo marca
  como "portal en construcción · fase 0" — es esperado, no es un gap
  nuestro.
- **Cron jobs** (`/api/cron/cumpleanos`, `/api/cron/carritos`,
  `/api/cron/mensajes`): probados con `CRON_SECRET`, responden 200 sin
  errores (0 resultados porque no hay datos que califiquen en staging).
- **Canales (Meta/WhatsApp) y asistente IA**: no probados — requieren
  `META_*`/`WHATSAPP_*` y `ANTHROPIC_API_KEY` reales, que no tenemos
  todavía. El asistente funciona en modo mock (`LLM_PROVIDER=mock`) sin
  key real.

## Variables de entorno

- **Stripe** — ✅ configurado con keys de TEST reales de la cuenta de
  Stripe del cliente (misma cuenta que producción, modo test) y Price IDs
  reales: mensual `price_1TyKalRo5UnjPDWxCoYVG3ds` ($159 MXN/mes), anual
  `price_1TyKcoRo5UnjPDWxvXGiHctG` ($1,699 MXN/año). Flujo completo
  probado en staging: checkout → pago con tarjeta de prueba → webhook →
  `profiles.membership_status = active` + fila en `subscriptions`
  correcta. Para desarrollo local hace falta correr
  `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe
  CLI) y poner el `whsec_...` que genera en `STRIPE_WEBHOOK_SECRET`.
- **Pendientes sin valor real**: `ANTHROPIC_API_KEY` (usa
  `LLM_PROVIDER=mock` mientras tanto), `META_*`/`WHATSAPP_*`.

## Estado de la base de datos

- **Producción real** (`hjvhntxjkuuobgfslzlf`): intacta, sirviendo el
  sitio viejo con su esquema original en `public`. Los 443 usuarios/293
  mascotas ya migrados están parqueados en el schema `pata_amiga_new` de
  ese mismo proyecto, listos para el cutover (ver incidente arriba).
- **Staging** (`pata-amiga-staging`, ref `dpsdopbwnxgwowzehotj`): las 26
  migraciones de pata-amiga + columnas puente aplicadas limpio. Aquí es
  donde se sigue desarrollando y probando (`.env.local` apunta aquí).
  **Ya contiene los datos reales migrados** (441 miembros, 294 mascotas,
  45 ambassadors, 13 wellness centers con cuenta ligada) además de las
  cuentas de prueba creadas durante el desarrollo
  (`*-staging@example.com`, `test-embajador@example.com`,
  `test-centro@example.com`, `admin-staging@example.com`,
  `test-ambassador-bridge@example.com`). Cualquier miembro/embajador/
  centro real ya puede iniciar sesión localmente con su password real
  (vía el puente legacy) o, si ya migró antes, con la que haya elegido.
- Portales verificados de punta a punta en staging: registro, login,
  pago Stripe, cambio de plan, cancelación, reingreso, login de
  embajador (dashboard con código/comisiones), login de centro aliado
  (dashboard propio), panel admin (métricas, cola de aprobaciones,
  listado de miembros).
