# Plan de Implementación - Corrección de Sincronización LynSales CRM

Este plan aborda el problema donde el tipo de membresía y el costo no se envían correctamente al CRM LynSales durante la aprobación de un miembro.

## Cambios Propuestos

### 1. Servicio CRM (`src/services/crm.service.ts`)
- [MODIFY] [crm.service.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/crm.service.ts)
    - Aumentar el logging detallado para ver el payload exacto enviado y la respuesta recibida.
    - Validar que los valores de `membershipType` y `membershipCost` no sean undefined o vacíos.

### 2. API de Aprobación (`src/app/api/admin/members/[id]/approve/route.ts`)
- [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/%5Bid%5D/approve/route.ts)
    - Mejorar la detección del plan activo desde Memberstack.
    - Asegurar que si el plan no se detecta correctamente en Memberstack, se use la información guardada en Supabase (si existe).

## Plan de Verificación

### Pruebas Manuales
1. Aprobar un miembro de prueba en el dashboard de admin.
2. Verificar los logs del servidor para confirmar que se envió el payload correcto a LynSales.
3. Confirmar con el usuario si los campos ahora aparecen en el CRM.
