# Corrección de 3 Bugs Críticos — Procedimiento de Membresías
**Fecha:** 2026-07-13  
**Autor:** Antigravity (AI)  
**Tipo:** Bug Fix  

---

## Contexto

Durante la revisión del procedimiento de membresías (orden del día de 13 puntos), se identificaron 3 bugs críticos que afectaban la integridad del ciclo de vida de los miembros.

---

## Bug 1 — Cancelación: `approval_status` prematuro

### Problema
`/api/user/deactivate` cambiaba `approval_status → 'cancelled'` inmediatamente en Supabase, aunque Stripe establece `cancel_at_period_end = true` (el usuario aún tiene cobertura hasta el fin del período pagado).

### Fix
- **`deactivate/route.ts`**: Cambio a `approval_status: 'pending_cancellation'` en Supabase. El mensaje en Memberstack se mantiene como `'cancelled'` por compatibilidad con el dashboard de Webflow.
- **`stripe/webhook/route.ts`**: El evento `customer.subscription.deleted` ahora cierra el ciclo definitivo (`approved_status: 'cancelled'`) en Supabase tanto para cancelaciones voluntarias como para churn por impago.

### UX Admin
- **`RequestsTable.tsx`**: Nuevo badge "🔴 Cancelado / hasta DD/MMM/AAAA" cuando `isCancelled = true` y `membershipEndDate` está disponible (datos de Stripe `cancel_at_period_end`).

---

## Bug 2 — Reingreso: desincronización Supabase

### Problema
`/api/user/reactivate` actualizaba Memberstack y `payment_methods`, pero **nunca actualizaba `users.approval_status`** en Supabase. El endpoint `/api/user/emergency` verifica `approval_status !== 'approved'`, bloqueando al usuario reactivado.

### Fix
- **`reactivate/route.ts`**: Nuevo paso 5b que actualiza `users.approval_status = 'approved'` y `membership_status = 'active'` en Supabase después de actualizar Memberstack.

---

## Bug 3 — Analytics: distribución de planes hardcodeada

### Problema
`/api/admin/reports/analytics` devolvía Plan Básico 45%, Estándar 35%, Premium 20% — valores ficticios inventados durante desarrollo que nunca se actualizaron con datos reales.

### Fix
- **`analytics/route.ts`**: La sección `planDistribution` ahora itera sobre las suscripciones activas de Stripe, mapea por `priceId` real del club (`prc_mensual-452k30jah`, `prc_anual-o9d101ta`) y usa un fallback por monto si el priceId no coincide.

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/api/user/deactivate/route.ts` | `approval_status: 'pending_cancellation'` |
| `src/app/api/stripe/webhook/route.ts` | Cierre de ciclo de cancelación en Supabase |
| `src/app/api/user/reactivate/route.ts` | Sync `users` en Supabase (paso 5b) |
| `src/app/api/admin/reports/analytics/route.ts` | planDistribution real desde Stripe |
| `src/components/Admin/RequestsTable.tsx` | Badge "Cancelado — hasta X fecha" |

---

## Verificaciones

- ✅ `npm run type-check` — sin errores
- ✅ `npm run build` — build limpio
- ✅ `npm run lint` — sin warnings nuevos
