# Fix siguiente cobro Stripe en dashboard admin

## Contexto

En el menu de administracion `Pagos y facturacion > Estado de pago`, las suscripciones ya aparecen desde Stripe y la fuente se marca correctamente, pero varias suscripciones activas siguen mostrando `Pendiente` en la columna `Siguiente cobro`.

## Hallazgo inicial

El endpoint `src/app/api/admin/finance/stripe-data/route.ts` calcula `nextBilling` usando solo `sub.current_period_end`, `sub.trial_end` y `sub.cancel_at`. En Stripe API reciente, el fin del periodo puede venir en `sub.items.data[0].current_period_end`, patron que el proyecto ya maneja en `src/app/api/user/payment-method/route.ts`.

## Plan de implementacion

1. Crear una utilidad pura para resolver el timestamp de siguiente cobro desde el objeto de suscripcion de Stripe.
2. Cubrir con pruebas los casos de `items.data[0].current_period_end`, fallback por trial/cancelacion y calculo desde `billing_cycle_anchor`.
3. Usar la utilidad en el endpoint del dashboard admin para poblar `nextBilling`.
4. Ejecutar verificacion: prueba enfocada, `npm run build`, `npm run type-check` y `npm run lint`.
5. Notificar por Telegram que el trabajo quedo listo para revision.

## Impacto esperado

Las suscripciones activas que Stripe expone con el periodo dentro del item dejaran de mostrarse como `Pendiente` y mostraran la fecha real del siguiente cobro.
