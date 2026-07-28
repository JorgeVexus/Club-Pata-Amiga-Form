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

## Bug encontrado en pata-amiga (no introducido por esta migración)

- **`src/lib/supabase/middleware.ts`**: la protección de rutas usa
  `path.startsWith("/embajador")`, lo cual también bloquea `/embajadores`
  (la página pública del programa de embajadores) porque
  `"/embajadores".startsWith("/embajador")` es `true`. Un visitante no
  logueado que entra a `/embajadores` es redirigido a `/iniciar-sesion`
  cuando debería ver la landing pública. Fix sugerido: comparar
  `path === "/embajador" || path.startsWith("/embajador/")`.

## Puente de autenticación legacy (Memberstack -> Supabase Auth)

- `src/lib/legacy-auth-bridge.ts` llama a
  `https://client.memberstack.com/member/login` para validar la password
  vieja. **No se pudo confirmar este endpoint contra la documentación
  oficial de Memberstack en esta sesión** (las herramientas de búsqueda web
  fallaron). Antes de confiar en este puente en producción: probar con una
  cuenta legacy real y, si falla, revisar
  https://developers.memberstack.com/rest-api o el Network tab del login
  viejo para confirmar el endpoint/payload correctos.
- Una vez migrado un usuario (`legacy_password_migrated = true`), ya no se
  vuelve a validar contra Memberstack — solo Supabase Auth nativo.

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
- **Autoservicio de miembro**: cambio de plan, actualizar método de pago,
  desactivar/reactivar membresía, fecha fin de cancelación — nuestro repo
  tenía endpoints dedicados (`/api/user/change-plan`, `/payment-method`,
  `/deactivate`, `/reactivate`, `/cancellation-end-date`). No se confirmó
  equivalente en `/app/cuenta` de pata-amiga.
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

## Variables de entorno nuevas sin valor real todavía

`.env.local` ya tiene las variables declaradas (vacías) pero **sin
credenciales reales**: `STRIPE_SECRET_KEY` y relacionadas (el proyecto
anterior no tenía Stripe configurado en este `.env.local` en absoluto),
`ANTHROPIC_API_KEY` (usa `LLM_PROVIDER=mock` mientras tanto),
`META_*`/`WHATSAPP_*`. Sin Stripe real no se pudo probar el flujo de pago
end-to-end en esta sesión.

## Estado de la base de datos

- Proyecto Supabase real (`hjvhntxjkuuobgfslzlf`): las 26 migraciones de
  pata-amiga + columnas puente (`memberstack_id`,
  `legacy_password_migrated`) ya están aplicadas.
- Las tablas legacy en conflicto de nombre viven ahora en el schema
  `legacy` (no en `public`), intactas — nada se borró.
- 443/450 usuarios y 293/327 mascotas migrados a `public.profiles`/`public.pets`.
