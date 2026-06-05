# Plan de Implementación: División de Planes de Suscripción en Memberstack

Este documento describe la estrategia, el análisis de impacto y los pasos técnicos necesarios para cambiar la configuración de un solo plan con dos precios (mensual/anual) en Memberstack a dos planes individuales ("Club Pata Amiga Mensual" y "Club Pata Amiga Anual"). 

Este cambio permitirá aplicar códigos de descuento de Stripe únicamente al plan mensual, solucionando la limitación de Stripe que impide aplicar cupones a precios específicos dentro de un mismo producto de suscripción.

---

## Análisis de Impacto y Diagnóstico

Hemos analizado exhaustivamente la base de código del proyecto para identificar todas las referencias a los IDs de precios de suscripción actuales. 

Actualmente, el sistema utiliza dos IDs de precios de Memberstack:
- **Mensual**: `prc_mensual-452k30jah`
- **Anual**: `prc_anual-o9d101ta`

A continuación, detallamos el impacto del cambio por componente del sistema:

### 1. Flujo de Registro V2 e Interfaces de Usuario
- **`src/components/RegistrationV2/steps/Step3PlanSelection.tsx`**: Contiene la configuración de los planes en el arreglo `PLANS` (líneas 22-52) con sus respectivos IDs y precios hardcodeados. **Requiere actualización de IDs**.
- **`src/components/PlanSelection/PlanSelection.tsx`**: Utilizado en el flujo alternativo. Contiene el objeto `PLANS` (líneas 9-22) con los IDs de precio. **Requiere actualización de IDs**.

### 2. Widgets Externos (Webflow Integration)
- **`public/widgets/plan-selection-widget.js`**: Contiene la configuración de planes `CONFIG.plans` (líneas 13-44) incrustada para su renderizado en Webflow. **Requiere actualización de IDs**.
- *Nota*: Widgets como `unified-membership-widget.js` y `user-profile-widget.js` no tienen los IDs de precios hardcodeados; consultan dinámicamente el estado del miembro en Memberstack.

### 3. Dashboard Admin e interfaces de Administración
- **`src/components/Admin/MemberDetailModal.tsx`**: No depende de IDs hardcodeados. Utiliza heurísticas dinámicas para identificar si un plan es anual basándose en la respuesta directa de Stripe (ej. si `interval === 'year'` o si el monto del pago inicial es mayor a `$1,000 MXN`). **No requiere cambios**.

### 4. API Routes y Server Actions
- **`src/app/api/admin/members/[id]/sync-crm/route.ts`**: Utiliza el ID mensual y anual como coincidencia principal para clasificar la membresía en el CRM (líneas 122-127). También tiene fallbascs para palabras clave en el nombre del plan ("anual", "año", "annual") y el monto del pago (> 1000). **Requiere actualizar/agregar soporte para los nuevos IDs manteniendo compatibilidad con los viejos para miembros existentes**.
- **`src/app/api/admin/members/[id]/approve/route.ts`**: Lógica idéntica al endpoint de sync-crm (líneas 100-105). **Requiere actualizar/agregar soporte para los nuevos IDs manteniendo compatibilidad con los viejos**.
- **`src/app/actions/user.actions.ts` (`getMemberStripeDetails`)**: Utiliza heurísticas de Stripe (intervalos y cantidades > 100000 centavos) para determinar si la suscripción es anual. **No requiere cambios**.

### 5. Integración con CRM (LynSales)
- **`src/services/crm.service.ts`**: El servicio CRM utiliza IDs de campos personalizados de LynSales (`UDXQDTApGP4lWS7tFrOa` y `oRTpCwaPnVxwYgAN5WlJ`) para almacenar las cadenas de texto del tipo de plan ("Mensual"/"Anual") y el costo ("$159"/"$1,699"). Está totalmente desacoplado de los IDs de Memberstack. **No requiere cambios**.

### 6. Vet Bot e Integraciones
- **`src/app/api/integrations/vet-bot/context/route.ts`**: El bot veterinario consulta el estado de la membresía (`membership_status`) y el estado de carencia de las mascotas en Supabase. No tiene dependencias directas con los IDs de Memberstack. **No requiere cambios**.

### 7. Base de Datos Supabase
- Las tablas (`users`, `pets`, etc.) registran el estado de aprobación (`approval_status`) y el estado de membresía (`membership_status`), pero no almacenan ni validan los IDs de precio de Memberstack. **No requiere cambios ni migraciones de base de datos**.

---

## Propuesta de Configuración en Memberstack y Stripe

Para lograr la separación y el correcto funcionamiento de los cupones, se debe configurar lo siguiente:

1. **En Stripe**:
   - Crear un producto: **"Club Pata Amiga Mensual"** con un precio recurrente de **$159 MXN / mes**.
   - Crear un producto: **"Club Pata Amiga Anual"** con un precio recurrente de **$1,699 MXN / año**.
   - Crear los códigos de promoción en Stripe asociados únicamente al producto "Club Pata Amiga Mensual".

2. **En Memberstack**:
   - Crear dos planes individuales:
     - **Plan 1**: "Club Pata Amiga Mensual" (asociado al precio de Stripe correspondiente).
     - **Plan 2**: "Club Pata Amiga Anual" (asociado al precio de Stripe correspondiente).
   - Configurar en ambos planes la opción para permitir códigos de promoción (`allowPromotionCodes: true` en el código frontend).
   - Obtener los nuevos IDs de precio generados por Memberstack (ej. `prc_mensual_new...` y `prc_anual_new...`).

---

## Cambios Propuestos en Código

### 1. `src/components/RegistrationV2/steps/Step3PlanSelection.tsx`
Actualizar el arreglo `PLANS` con los nuevos IDs de precios asignados en Memberstack:
```typescript
const PLANS = [
    {
        id: 'NUEVO_ID_PRECIO_MENSUAL', // ej: prc_mensual-nuevo
        name: 'Mensual',
        // ...resto de campos iguales
    },
    {
        id: 'NUEVO_ID_PRECIO_ANUAL', // ej: prc_anual-nuevo
        name: 'Anual',
        // ...resto de campos iguales
    }
];
```

### 2. `src/components/PlanSelection/PlanSelection.tsx`
Actualizar la constante `PLANS` con los nuevos IDs de precios:
```typescript
const PLANS = {
    MONTHLY: {
        id: 'NUEVO_ID_PRECIO_MENSUAL',
        name: 'Mensualidad',
        // ...
    },
    ANNUAL: {
        id: 'NUEVO_ID_PRECIO_ANUAL',
        name: 'Anualidad',
        // ...
    }
};
```

### 3. `public/widgets/plan-selection-widget.js`
Actualizar `CONFIG.plans` con los nuevos IDs de precios:
```javascript
        plans: [
            {
                id: 'NUEVO_ID_PRECIO_MENSUAL',
                name: 'Mensual',
                // ...
            },
            {
                id: 'NUEVO_ID_PRECIO_ANUAL',
                name: 'Anual',
                // ...
            }
        ]
```

### 4. `src/app/api/admin/members/[id]/sync-crm/route.ts` y `src/app/api/admin/members/[id]/approve/route.ts`
Modificar las condiciones para dar soporte tanto a los nuevos IDs como a los viejos (compatibilidad con miembros históricos):
```typescript
const isAnnualPlan = priceId === 'prc_anual-o9d101ta' || 
                     priceId === 'NUEVO_ID_PRECIO_ANUAL' || 
                     isAnnualKeyword || 
                     amount > 1000;

const isMonthlyPlan = priceId === 'prc_mensual-452k30jah' || 
                      priceId === 'NUEVO_ID_PRECIO_MENSUAL' || 
                      (amount > 0 && amount <= 1000);
```

---

## Plan de Verificación

### Pruebas de Compilación
- Ejecutar `npm run build` y `npm run type-check` para garantizar que no existan errores de compilación ni de TypeScript.
- Ejecutar `npm run lint` para validar la calidad del código.

### Verificación del Flujo
- Iniciar un flujo de registro de prueba localmente en `/usuarios/registro`.
- Seleccionar el plan mensual y verificar que redirija al Checkout de Stripe de Memberstack con el nuevo ID y permita ingresar códigos de descuento.
- Verificar que tras realizar un pago de prueba, el usuario avance al paso 4 (Completar Perfil).
- Sincronizar un usuario de prueba en el Dashboard Admin y verificar en LynSales que las etiquetas ("miembro activo") y campos personalizados (`membershipType` y `membershipCost`) se llenen correctamente con "Mensual" / "$159" o "Anual" / "$1,699".
