# Plan de Implementación: Sistema Multi-Roles (Miembros, Embajadores, Centros)

Este plan detalla la reestructuración del sistema de usuarios para permitir que una única cuenta pueda tener múltiples roles de forma simultánea (ej. un Miembro que también es Embajador y tiene un Centro de Bienestar).

## User Review Required

> [!IMPORTANT]
> **Independencia de Aprobación:** Un usuario puede tener múltiples roles con estados distintos. Por ejemplo, puede estar **Aprobado** como Miembro pero **Rechazado** como Embajador. El acceso a las funcionalidades será granular y no se afectarán entre sí.

> [!WARNING]
> **Sincronización con Memberstack:** Para mantener la independencia en el frontend (Webflow/Dashboard), sincronizaremos campos de estado separados: `approval-status` (Miembro), `ambassador-status` (Embajador), y `wellness-status` (Centro).

## Proposed Changes

### 1. Base de Datos (Supabase)

#### [MODIFY] `supabase/migrations/20260512_unify_roles_system.sql`
Se creará una migración que:
- Cree la tabla `roles` (id, name: 'member', 'ambassador', 'wellness_center', 'admin').
- Cree la tabla junction `user_roles` (`user_id`, `role_id`).
- **Estados Independientes:**
    - **Miembro:** Se rige por `users.membership_status`.
    - **Embajador:** Se rige por `ambassadors.status`.
    - **Centro de Bienestar:** Se rige por `wellness_center_profiles.status`.

#### [NEW] `supabase/migrations/20260512_create_wellness_center_tables.sql`
Estructura para el nuevo rol (listo para integrar):
- `id` (UUID)
- `user_id` (FK -> users.id)
- `business_name` (TEXT)
- `rfc` (TEXT)
- `specialties` (TEXT[])
- `status` (TEXT: pending, approved, rejected)
- `full_address` (TEXT)
- `verification_docs_url` (TEXT[])

---

### 2. API & Middleware (Lógica de Acceso)

#### [MODIFY] `src/app/api/auth/check-role/route.ts`
El endpoint retornará el estado detallado de cada rol para permitir acceso selectivo:
```json
{
  "success": true,
  "roles": ["member", "ambassador"],
  "statusByRole": {
    "member": "approved",
    "ambassador": "rejected",
    "wellness_center": "none"
  }
}
```

#### [MODIFY] `src/services/memberstack.service.ts`
- Sincronizar campos específicos:
    - `roles`: "member,ambassador"
    - `approval-status`: "approved" (para Miembro)
    - `ambassador-status`: "rejected" (para Embajador)

---

### 3. Admin Dashboard (Gestión Independiente)

#### [STAY] Categorías Separadas
- El administrador seguirá gestionando cada rol en su respectiva tabla:
    - Si rechaza a alguien en la **Tabla de Embajadores**, solo cambia `ambassadors.status`.
    - Su registro en la **Tabla de Miembros** permanece intacto.
- Al abrir el detalle de un usuario, se mostrarán pestañas o secciones por rol para que el administrador pueda ver el panorama completo pero actuar de forma aislada.

---

### 4. Lógica de Referidos y Estadísticas

#### [STAY] Integridad de Referidos
- La lógica de códigos de referido (`ambassador_code`) y comisiones solo se activará si `ambassadors.status === 'approved'`, independientemente de si el usuario es un Miembro activo o no.

## Verification Plan

### Automated Tests
- **Independent Status Check:** Crear un usuario, aprobarlo como Miembro y rechazarlo como Embajador. Verificar que `/api/auth/check-role` devuelve los estados correctos y no bloquea el acceso total.
- **Wellness Ready:** Verificar que se puede insertar un perfil en `wellness_center_profiles` vinculado a un usuario existente sin errores de integridad.

### Manual Verification
1. Loguearse como un usuario con ambos roles.
2. Como Admin, **Rechazar** el rol de Embajador.
3. Verificar que el usuario **aún puede entrar** a su perfil de Miembro y ver sus mascotas.
4. Verificar que el acceso a la sección de Embajadores muestra un mensaje de "Solicitud Rechazada" pero no cierra la sesión del usuario.
