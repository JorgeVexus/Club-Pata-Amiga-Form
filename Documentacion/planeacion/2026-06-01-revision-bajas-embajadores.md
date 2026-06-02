# Plan de Implementación: Sistema de Bajas para Embajadores

Este plan detalla el análisis de la implementación actual del sistema de embajadores, identifica una fricción crítica donde el botón de "Cancelar solicitud" en el dashboard de Webflow falla con un error 404 debido a la falta del endpoint de backend, y propone la implementación del estado de baja voluntaria (`cancelled`) para los embajadores en base de datos, tipos y APIs.

## Objetivos
1. **Solución del Bug 404:** Crear el endpoint `/api/ambassadors/[id]/cancel` para procesar la baja voluntaria / cancelación del embajador.
2. **Definición de Estados de Baja:** Modificar el constraint en base de datos y actualizar el tipo `AmbassadorStatus` en Next.js para incluir `'cancelled'`.
3. **Persistencia e Historial:** Guardar `cancelled_at` para registrar la fecha en que el embajador se dio de baja.
4. **Sincronización con Memberstack:** Actualizar las propiedades del miembro en Memberstack para cambiar `is-ambassador` a `false` y `ambassador-status` a `cancelled`.
5. **Seguridad y Cierre de Sesión:** Eliminar de inmediato las sesiones activas en la tabla `ambassador_sessions` para revocar accesos al panel.

## Cambios Propuestos

### 1. Base de Datos (Supabase)

#### [NEW] [20260601_add_cancelled_status_to_ambassadors.sql](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/supabase/migrations/20260601_add_cancelled_status_to_ambassadors.sql)
- Crear una migración en `supabase/migrations/` para:
  1. Eliminar la restricción CHECK de estado actual en la tabla `ambassadors`.
  2. Agregar una nueva restricción CHECK que admita `('pending', 'approved', 'rejected', 'suspended', 'cancelled')`.
  3. Agregar la columna `cancelled_at` con tipo `TIMESTAMPTZ` a la tabla `ambassadors`.

---

### 2. Tipos de TypeScript

#### [MODIFY] [ambassador.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/ambassador.types.ts)
- Actualizar `AmbassadorStatus` para incluir `'cancelled'`:
  ```typescript
  export type AmbassadorStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'cancelled';
  ```
- Agregar el campo opcional `cancelled_at?: string;` a la interfaz `Ambassador`.

---

### 3. Backend API Routes

#### [NEW] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/ambassadors/[id]/cancel/route.ts)
- Crear el endpoint de cancelación en la ruta que el widget de Webflow (`ambassador-widget.js`) espera consumir mediante una petición `POST` a `/api/ambassadors/[id]/cancel`.
- Lógica de la API:
  1. Buscar el embajador en Supabase.
  2. Actualizar su `status` a `'cancelled'` y establecer `cancelled_at` a la fecha actual.
  3. Actualizar Memberstack mediante PATCH para cambiar `is-ambassador` a `'false'` y `ambassador-status` a `'cancelled'`.
  4. Eliminar todas las sesiones activas del embajador en `ambassador_sessions` para cerrar su sesión de forma inmediata.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/auth/check-role/route.ts)
- Modificar la validación de estado del embajador para verificar que no esté cancelado (`status !== 'cancelled'`), previniendo accesos indebidos de embajadores dados de baja.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/auth/debug-role/route.ts)
- Actualizar el diagnóstico de roles para excluir embajadores con estado `'cancelled'`.

---

### 4. Admin Dashboard UI

#### [MODIFY] [AmbassadorsTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AmbassadorsTable.tsx)
- Actualizar `getStatusBadge` para soportar el estado `cancelled` con estilos adecuados.

#### [MODIFY] [AmbassadorsTable.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AmbassadorsTable.module.css)
- Agregar la clase `.statusCancelled` para el diseño premium.

#### [MODIFY] [AmbassadorDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AmbassadorDetailModal.tsx)
- Renderizar adecuadamente el estado de baja y la fecha de cancelación.

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` y `npm run build` para garantizar la estabilidad de los tipos y compilación.
- Ejecutar `npm run lint` para el análisis estático.

### Pruebas Manuales
1. Ejecutar la migración SQL en el editor de Supabase.
2. Hacer POST simulado a `/api/ambassadors/[id]/cancel` para comprobar el cambio de estado, inserción de `cancelled_at`, cierre de sesión en `ambassador_sessions` y actualización en Memberstack.
3. Verificar en `/api/referrals/validate-code` que el código del embajador cancelado ya no sea válido.
4. Validar la visualización del estado "Cancelado" en la tabla del panel administrativo.
