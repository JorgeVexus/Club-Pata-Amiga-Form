# Plan: Implementación de 3 Mejoras Importantes — Procedimiento de Membresías

Este plan detalla la implementación de los 3 flujos faltantes del procedimiento de membresías: cambio de plan integrado en el widget de Webflow, correos transaccionales corporativos (con visualización en el panel de administración), y reingreso ágil en caso de suscripciones Stripe borradas.

---

## Cambios a Realizar

### 1. Punto 10 — Cambio de Plan (Upgrade/Downgrade)
*   **Backend**: Endpoint `/api/user/change-plan` (POST). Busca la suscripción activa de Stripe, identifica el ID de suscripción y realiza la actualización al plan solicitado:
    *   **Mensual ➔ Anual (Upgrade)**: Prorratea el saldo a favor y genera el cobro inmediato.
    *   **Anual ➔ Mensual (Downgrade)**: Cambia el precio de renovación sin prorrateo inmediato para el siguiente ciclo.
    *   **Sincronización**: Actualiza Memberstack (`membership-cost`, `plan-name`) y Supabase (`users` y `payment_methods`).
*   **Frontend**: Integración en el widget de perfil `user-settings-widget.js`. Añade un botón "Cambiar de Plan" que abre un modal integrado en Webflow para alternar de forma segura entre las dos membresías de Club Pata Amiga.

### 2. Punto 9 — Emails Transaccionales y Previews
Crearemos 4 correos con diseño e identidad corporativa de Pata Amiga:
- **Aprobación de membresía** (`sendMembershipApprovedEmail`): Disparado en `/api/admin/members/[id]/approve`.
- **Mascota Rechazada / Acción Requerida** (`sendPetStatusEmail`): Disparado en `/api/admin/members/[id]/pets/[petId]/status`.
- **Confirmación de cancelación** (`sendCancellationEmail`): Disparado en `/api/user/deactivate`.
- **Recordatorio de renovación** (`sendRenewalReminderEmail`): Disparado en el webhook de Stripe ante el evento `invoice.upcoming` (3 días antes del cargo).

**Panel de Control Admin**:
- Agregaremos los 4 correos en `src/components/Admin/Communications/EmailTemplatePreviewer.tsx` dentro de `MEMBER_TEMPLATES` para permitir previsualizarlos en vivo en el dashboard administrativo.

### 3. Punto 8 — Reingreso post-expiración total
*   **Backend**: Modificación en `/api/user/reactivate/route.ts` para que si `relevantSubs` está vacío, devuelva un código de error específico `{ success: false, code: 'SUBSCRIPTION_EXPIRED' }`.
*   **Frontend**: En `user-settings-widget.js`, si el reingreso falla con `SUBSCRIPTION_EXPIRED`, alertar al usuario y redirigirlo de inmediato a `https://app.pataamiga.mx/registro?reason=complete_payment` para permitirle elegir una membresía de nuevo con su misma cuenta (forzando paso 3 del stepper).
