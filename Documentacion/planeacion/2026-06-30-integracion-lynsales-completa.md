# Integración Lynsales (LeadConnector) — Completar campos y eventos

**Fecha:** 30 de junio de 2026
**Base:** Requerimientos_PataAmiga_v1 + Documentacion/lynsales-api-docs.mc

## Objetivo

Completar la integración existente con Lynsales para cubrir los 7 custom fields
y los 6 eventos del flujo de membresía descritos en el requerimiento.

## Cambios implementados

### Servicio CRM — `src/services/crm.service.ts`
- `CRM_FIELD_IDS`: mapa central con los 7 IDs de custom fields de la agencia.
- `CRM_ACTIVE_TAG = 'miembro activo'`.
- `syncMembership(contactId, data)`: función unificada que envía solo los campos
  presentes (estatus, tipo, costo, fecha_pago, metodo_pago, fecha_renovacion,
  fecha_pago_renovacion) en formato `{ id, value }` + tags opcionales.
- `removeContactTags(contactId, tags)`: `DELETE /contacts/:id/tags` (para quitar
  el tag al cancelar). Best-effort, no bloqueante.

### Helper Stripe — `src/lib/stripe-membership.ts` (nuevo)
- `getStripeMembershipFields(stripe, subscriptionId)`: extrae método de pago,
  fecha de pago y fecha de renovación reales desde la suscripción.
- `mapStripePaymentMethod`: mapea `card→Tarjeta`, `oxxo→OXXO`, etc.
- `toCrmDate`: formatea a `YYYY-MM-DD`.

### Eventos conectados
| # | Evento | Archivo |
|---|--------|---------|
| 1 | Registro → upsert | (ya existía) `user.actions.ts` |
| 2+3 | Pago + aprobación → estatus activo, tag, tipo, costo, fecha_pago, metodo_pago, fecha_renovacion | `api/admin/members/[id]/approve/route.ts` |
| — | Resync manual (admin) | `api/admin/members/[id]/sync-crm/route.ts` |
| — | Aprobación de mascota → miembro activo | `api/admin/members/[id]/pets/[petId]/status/route.ts` |
| 4 | Renovación exitosa → fecha_pago_renovacion + fecha_renovacion | `api/stripe/webhook/route.ts` |
| 5 | Fallo de pago → pendiente_pago; churn por impago → no_renovado | `api/stripe/webhook/route.ts` |
| 6 | Cancelación → cancelado + quitar tag | `api/user/deactivate/route.ts` |

## Configuración requerida para producción

### 1. Variable de entorno (Vercel + .env.local)
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```
(Las de Lynsales — `LYNSALES_API_KEY`, `LYNSALES_LOCATION_ID`, `LYNSALES_API_URL` — ya existen.)

### 2. Registrar el webhook en Stripe Dashboard
- URL: `https://<tu-dominio>/api/stripe/webhook`
- Eventos a escuchar:
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- Copiar el "Signing secret" resultante a `STRIPE_WEBHOOK_SECRET`.

### 3. Prueba local (opcional, con Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

## Notas / supuestos a confirmar con la agencia
- **Formato custom fields:** se usa `{ id, value }` (el que ya funcionaba en producción).
  El ejemplo del doc muestra `{ id, fieldValue, fieldName }`; si la agencia lo exige,
  es un cambio localizado en `buildMembershipCustomFields`.
- **Quitar tag (evento 6):** se asume `DELETE /contacts/:id/tags` de LeadConnector.
  Si el endpoint difiere, ajustar `removeContactTags`.
- **Valores de estatus:** se usa el catálogo de la sección 4
  (`activo | cancelado | no_renovado | pendiente_pago`).
- **No renovado vs cancelado:** la cancelación voluntaria del usuario marca `cancelado`
  desde `deactivate`. El webhook solo marca `no_renovado` cuando Stripe reporta
  `cancellation_details.reason === 'payment_failed'`, para no sobreescribir la cancelación.

## Comportamiento ante errores
Todas las llamadas al CRM son **no bloqueantes**: si Lynsales o Stripe fallan, el flujo
del usuario continúa y el error queda en logs (`[CRM]`, `[Stripe Webhook]`).
El webhook devuelve `200` incluso ante error del CRM para evitar reintentos infinitos de Stripe.
