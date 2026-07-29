# Gaps y pendientes tras la migración a pata-amiga

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
- Pendiente: probar el puente con una cuenta legacy real (password
  correcta) contra el proyecto de producción el día del cutover — en esta
  sesión solo se verificó que el flujo no truena y usa el endpoint
  correcto (con password incorrecta responde bien "credenciales
  inválidas").

## Datos que no se migraron automáticamente (quedaron en el schema `legacy`)

- **7 cuentas con email duplicado** entre múltiples registros legacy
  (`cipatli.martinez@pataamiga.mx` x3, `cipatli.martinez@rabadoub.com.mx`
  x2, `asahi00@gmail.com` x2, `asahi01@gmail.com` x2, más 1 usuario sin
  email) no tienen `auth.users`/`profiles` — Supabase Auth exige email
  único. Parecen cuentas de prueba del equipo, pero requieren revisión
  manual antes de decidir qué hacer (fusionar, descartar, o crear con un
  email alternativo).
- **21 mascotas sin `pet_type` reconocible** (ni "dog" ni "cat") no se
  migraron a `public.pets` porque `species` es `NOT NULL` en el esquema
  nuevo. Siguen en `legacy.pets`, requieren asignarles especie manualmente.
- **Ambassadors y wellness_centers legacy** (schema `legacy.ambassadors`,
  `legacy.wellness_centers`) **todavía no se migraron** a las tablas nuevas
  `public.ambassadors`/`public.wellness_centers` — solo se migraron
  usuarios y mascotas. Falta escribir el mapeo (columnas ya identificadas
  en el plan de migración) y correrlo, igual que se hizo con pets.
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
  migraciones de pata-amiga + columnas puente (`memberstack_id`,
  `legacy_password_migrated`) aplicadas limpio. Aquí es donde se sigue
  desarrollando y probando (`.env.local` apunta aquí). Contiene datos de
  prueba (cuentas `*-staging@example.com`, `test-embajador@example.com`,
  `test-centro@example.com`, `admin-staging@example.com`), no datos
  reales de miembros.
- Portales verificados de punta a punta en staging: registro, login,
  pago Stripe, cambio de plan, cancelación, reingreso, login de
  embajador (dashboard con código/comisiones), login de centro aliado
  (dashboard propio), panel admin (métricas, cola de aprobaciones,
  listado de miembros).
