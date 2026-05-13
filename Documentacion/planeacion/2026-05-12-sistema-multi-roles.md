# Plan de Implementación: Sistema Multi-Roles (Miembros, Embajadores, Centros)

Este plan detalla la reestructuración del sistema de usuarios para permitir que una única cuenta pueda tener múltiples roles de forma simultánea (ej. un Miembro que también es Embajador y tiene un Centro de Bienestar).

## User Review Required

> [!IMPORTANT]
> Se propone unificar la autenticación exclusivamente a través de **Memberstack**. Actualmente los Embajadores tienen un sistema de login separado (`password_hash` en tabla `ambassadors`). Esta unificación simplifica la experiencia del usuario pero requiere migrar a los embajadores existentes a Memberstack.

> [!WARNING]
> La tabla `ambassadors` actual se convertirá en una tabla de perfil (`ambassador_profiles`) vinculada a la tabla `users` central.

## Proposed Changes

### 1. Base de Datos (Supabase)

#### [NEW] `supabase/migrations/20260512_unify_roles_system.sql`
Se creará una migración que:
- Cree la tabla `roles` (Miembro, Embajador, Centro de Bienestar, Admin).
- Cree la tabla junction `user_roles` (M:M).
- Transforme la estructura de perfiles:
    - **`ambassador_profiles`**: Contendrá campos específicos como `instagram`, `payment_method`, `commissions`, etc.
    - **`wellness_center_profiles`**: Contendrá campos para centros (Nombre del negocio, servicios, dirección física, documentos legales).
- Agregue flags de conveniencia en la tabla `users` (`is_member`, `is_ambassador`, `is_wellness_center`).

#### [NEW] `supabase/migrations/20260512_create_wellness_center_tables.sql`
Estructura propuesta:
- `id` (UUID)
- `user_id` (FK -> users.id)
- `business_name` (TEXT)
- `rfc` (TEXT)
- `specialties` (TEXT[])
- `verification_status` (pending, approved, rejected)
- `location_coords` (POINT)
- `full_address` (TEXT)

---

### 2. Integración Memberstack

#### [MODIFY] `src/services/memberstack.service.ts`
- Actualizar `mapFormDataToCustomFields` para incluir un campo `roles`.
- Implementar `syncUserRoles(memberstackId: string, roles: string[])` para mantener sincronizados los roles en Memberstack.

---

### 3. API & Middleware

#### [MODIFY] `src/app/api/auth/check-role/route.ts`
- Cambiar la respuesta de un solo string `role` a un array `roles`.
- Ejemplo de respuesta: `{ success: true, roles: ['member', 'ambassador'], primaryRole: 'member' }`.

#### [NEW] `src/app/api/user/roles/route.ts`
- Endpoint para que un usuario autenticado solicite un nuevo rol (ej. "Quiero ser Embajador").

---

### 4. Admin Dashboard

#### [MODIFY] `src/components/Admin/Sidebar.tsx`
- Unificar la sección de "Usuarios" con filtros por rol en lugar de páginas separadas si es posible, o mantener accesos directos que filtren la tabla principal.

#### [MODIFY] `src/components/Admin/RequestsTable.tsx`
- Soporte para mostrar qué roles tiene un usuario y gestionar aprobaciones por rol de forma independiente.

## Verification Plan

### Automated Tests
- Script de migración: Verificar que los datos de `ambassadors` se mueven correctamente a `ambassador_profiles` y se vinculan a un `user` central.
- API Test: Llamar a `/api/auth/check-role` con un ID que tenga 3 roles y verificar el array.

### Manual Verification
1. Registrarse como Miembro.
2. Ir a la sección "Ser Embajador" y completar el formulario.
3. Verificar en Admin que el usuario ahora aparece con ambos roles.
4. Verificar en Memberstack que el campo custom `roles` tiene "member,ambassador".
