# Plan de Implementación: Integración Lynsales & Reportes de Ventas

Este plan detalla los cambios requeridos para alinear la integración del CRM Lynsales (LeadConnector) con las especificaciones del cliente y habilitar los datos requeridos por el equipo de ventas en el reporte administrativo.

---

## 1. Cambios en Base de Datos

Para almacenar de manera persistente la fecha de pago y el código de cupón utilizado en Stripe (evitando consultas lentas en lote al API de Stripe al generar reportes), agregaremos la columna `coupon_code` a la tabla `users` en Supabase.
*Nota: La columna `payment_completed_at` ya existe en la base de datos (según las migraciones anteriores), pero actualmente no se pobla ni se lee.*

### Migración SQL (`supabase/migrations/20260714_add_coupon_code_to_users.sql`)
```sql
-- Agregar columna para almacenar el código de cupón de Stripe utilizado
ALTER TABLE users ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
```

---

## 2. Cambios en la Integración con Stripe & CRM

### 2.1 Obtención de Cupones de Stripe
Modificaremos la función helper `getStripeMembershipFields` en `src/lib/stripe-membership.ts` para:
- Expandir el campo `discount.promotion_code` al recuperar la suscripción de Stripe.
- Extraer el código del cupón/promoción utilizado: `subscription.discount?.promotion_code?.code || subscription.discount?.coupon?.id`.
- Agregar `couponCode` a la interfaz de salida.

### 2.2 Guardado de datos en Supabase en el Webhook de Stripe
Actualizaremos el handler de `invoice.payment_succeeded` en `src/app/api/stripe/webhook/route.ts` para:
- Extraer la fecha de pago real (`paidAt`) y el código del cupón (`couponCode`) desde los campos de Stripe.
- Actualizar las columnas `payment_completed_at` y `coupon_code` del usuario en Supabase para **todos** los pagos exitosos (primer pago y renovaciones).
- Mantener la regla de negocio de **solo sincronizar con el CRM Lynsales si es una renovación** (el primer pago es sincronizado en la aprobación).

### 2.3 Sincronización de Tags en Lynsales (Overwrites)
De acuerdo con la sección 5 del documento de requerimientos, el campo `tags` en la API de Lynsales (LeadConnector) sobrescribe completamente las etiquetas existentes del contacto en lugar de acumularlas.
- Actualizaremos la interfaz `MembershipSyncData` y la función `syncMembership` en `src/services/crm.service.ts` para cambiar `addTags?: string[]` a `tags?: string[]`.
- Enviar el campo `tags` directamente en el payload del PUT `/contacts/:id`.
- Al activar o aprobar un miembro: enviar `tags: ['miembro activo']`.
- Al cancelar o expirar un miembro: enviar `tags: ['miembro inactivo']`.
- Eliminar las llamadas redundantes/obsoletas al endpoint de eliminación de tags (`removeContactTags` / `DELETE /contacts/:id/tags`) en `src/app/api/stripe/webhook/route.ts` y `src/app/api/user/deactivate/route.ts`.

### 2.4 Guardado de datos en Supabase en la Aprobación del Administrador
Actualizaremos `/api/admin/members/[id]/approve/route.ts` para que, al aprobar un miembro:
- Recupere los campos de Stripe usando la suscripción activa.
- Guarde en Supabase la fecha del primer pago en `payment_completed_at` y el cupón utilizado en `coupon_code`.

---

## 3. Cambios en el Reporte de Ventas (Admin)

### 3.1 Endpoint de Reporte
Actualizaremos `/api/admin/reports/plan-members/route.ts` para:
- Seleccionar `payment_completed_at` y `coupon_code` de la tabla `users` en Supabase.
- Retornar estos campos en el JSON del reporte enriquecido:
  - `paymentDate`: `dbUser?.payment_completed_at`
  - `couponCode`: `dbUser?.coupon_code`

### 3.2 Interfaz del Reporte y Exportación CSV
Actualizaremos `PlanMembersReport.tsx`:
- Agregar las columnas **Fecha de Pago** y **Cupón** a la tabla del reporte administrativo.
- Incluir en la exportación de CSV los campos requeridos por el equipo de ventas:
  - **Fecha de Pago** (mostrando la fecha real de cobro).
  - **¿Utilizó Cupón?** (`Sí` / `No`).
  - **Cupón Utilizado** (ej. `PET10` o `—`).
- Estilizar la visualización del cupón con un tag distinguido en la interfaz (`.couponBadge`).

---

## Propuesta de Cambios por Archivo

### [MODIFY] [stripe-membership.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/lib/stripe-membership.ts)
- Actualizar la interfaz `StripeMembershipFields` agregando `couponCode?: string`.
- Modificar `getStripeMembershipFields` para expandir y recuperar `discount.promotion_code` y devolver `couponCode`.

### [MODIFY] [crm.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/crm.service.ts)
- Cambiar `addTags` a `tags` en `MembershipSyncData` y `syncMembership`.
- Asegurar que el PUT `/contacts/:id` envíe `tags` para sobrescribir la lista completa.

### [MODIFY] [webhook/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/stripe/webhook/route.ts)
- Guardar `payment_completed_at` and `coupon_code` en Supabase al recibir `invoice.payment_succeeded`.
- Quitar la llamada redundante a `removeContactTags` al recibir cancelaciones, utilizando en su lugar `syncMembership` con `tags: ['miembro inactivo']`.

### [MODIFY] [deactivate/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/user/deactivate/route.ts)
- Quitar la llamada a `removeContactTags` y actualizar la llamada a `syncMembership` enviando `tags: ['miembro inactivo']`.

### [MODIFY] [approve/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/%5Bid%5D/approve/route.ts)
- Guardar `payment_completed_at` y `coupon_code` en la base de datos de Supabase al procesar la aprobación.

### [MODIFY] [plan-members/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/reports/plan-members/route.ts)
- Seleccionar y retornar `payment_completed_at` y `coupon_code` de Supabase.

### [MODIFY] [PlanMembersReport.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/PlanMembersReport.tsx)
- Agregar columnas correspondientes a la tabla.
- Integrar campos en la lógica de generación del archivo CSV de exportación.

### [MODIFY] [Reports.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/Reports.module.css)
- Agregar clase `.couponBadge`.

### [NEW] [20260714_add_coupon_code_to_users.sql](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/supabase/migrations/20260714_add_coupon_code_to_users.sql)
- Crear script SQL de migración.

---

## Plan de Verificación

1. **Pruebas de Compilación y Tipado**:
   - Ejecutar `npm run type-check` y `npm run build` para asegurar la estabilidad estructural de TypeScript.
2. **Auditoría de Cambios**:
   - Verificar localmente que la estructura del reporte y el mapeo del payload a enviar a Lynsales cumplan estrictamente las directrices del PDF/Especificación.
