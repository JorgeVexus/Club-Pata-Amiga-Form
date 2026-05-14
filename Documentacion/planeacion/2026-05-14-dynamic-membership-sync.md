# Plan: Membresía Dinámica para Sincronización CRM

El objetivo es eliminar los valores fallbacks hardcodeados (como "Mensual" y "$159") al sincronizar con el CRM LynSales. En su lugar, extraeremos dinámicamente el nombre del plan y el costo real de las `planConnections` del miembro en Memberstack.

## Cambios Propuestos

### 1. Endpoints de API

#### [MODIFY] [sync-crm/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/[id]/sync-crm/route.ts)
- Implementar una lógica de extracción robusta para `membership_type` y `membership_cost`.
- Priorizar `planName` (buscando "Anual" vs "Mensual") y `payment.amount` de las `planConnections` de Memberstack.
- Mantener los checks por Price ID solo como un fallback secundario.
- Dejar los valores predeterminados finales ("Mensual", "$159") solo como último recurso.

#### [MODIFY] [approve/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/[id]/approve/route.ts)
- Aplicar la misma lógica de extracción dinámica para asegurar consistencia cuando un miembro es aprobado por primera vez.

## Detalles de la Lógica de Extracción
Para un objeto de miembro de Memberstack dado:
1. Buscar la primera `planConnection` con `status === 'ACTIVE'` (o la más reciente).
2. **Tipo**: 
   - Si `planName` contiene "Anual" (ignorando mayúsculas/minúsculas) -> "Anual".
   - Si `planName` contiene "Mensual" (ignorando mayúsculas/minúsculas) -> "Mensual".
   - Fallback a comprobaciones por Price ID.
3. **Costo**:
   - Si existe `payment.amount`, formatearlo (ej. "$1,699").
   - Si falta el monto, usar fallbacks basados en el Tipo detectado.

## Plan de Verificación
### Pruebas Automatizadas
- `npm run build` para asegurar que no haya regresiones de TypeScript.
- `npm run type-check`

### Verificación Manual
- Revisar los logs en Vercel después de que el usuario dispare una sincronización para confirmar que el payload contiene "Anual" y "$1,699" para un miembro anual real.
