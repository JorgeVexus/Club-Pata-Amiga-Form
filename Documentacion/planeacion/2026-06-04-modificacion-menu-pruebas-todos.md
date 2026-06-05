# Plan de Implementación: Modificación del Menú 'Pruebas / Todos', Buscador de Usuarios y Logs de Eliminación

Este plan detalla los cambios para modificar la sección de "Pruebas / Todos" (`all-members`) en el panel de administración para que no muestre la lista de usuarios por defecto, sino que proporcione un buscador por correo que consulte la base de datos de Supabase (excluyendo administradores) y permita eliminar a cualquier usuario tanto de Supabase como de Memberstack de manera robusta. Además, registraremos todas las eliminaciones en los logs de actividad ("Tu actividad" y "Actividad reciente").

## User Review Required

> [!IMPORTANT]
> - **Exclusión de Administradores**: La búsqueda excluirá automáticamente a usuarios con el rol `admin` o `super_admin` en Supabase para evitar eliminaciones accidentales de personal administrativo.
> - **Eliminación Robusta**: Se modificará el endpoint de eliminación para permitir pasar tanto el `memberstack_id` como el `id` interno de Supabase, resolviendo fallas cuando un usuario de la base de datos no está correctamente enlazado en Memberstack o ya fue eliminado parcialmente.
> - **Historial de Auditoría**: Se creará una tabla `member_deletions` para almacenar de forma persistente qué administrador eliminó a qué miembro (nombre y correo) y en qué fecha/hora exacta. Esto es necesario debido a que al borrar el registro principal de la base de datos y de Memberstack, no se podría reconstruir esta información de otro modo.

## Open Questions

No hay preguntas abiertas. La especificación técnica está clara y alineada con los requerimientos.

## Proposed Changes

---

### [Database Setup & Migrations]

#### [NEW] [20260604_create_member_deletions.sql](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/supabase/migrations/20260604_create_member_deletions.sql)
Crear la tabla `member_deletions` para registrar las eliminaciones de usuarios:
- `id` UUID PRIMARY KEY
- `member_id` TEXT (ID de Memberstack o Supabase del usuario eliminado)
- `member_name` TEXT (Nombre completo del usuario eliminado)
- `member_email` TEXT (Correo electrónico del usuario eliminado)
- `deleted_by_name` TEXT (Nombre del administrador que realizó la eliminación)
- `deleted_by_id` TEXT (ID de Memberstack del administrador que realizó la eliminación)
- `created_at` TIMESTAMPTZ DEFAULT NOW()

---

### [Backend Endpoints]

#### [NEW] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/search/route.ts)
Crear un nuevo endpoint para buscar usuarios por correo en la base de datos de Supabase:
- Valida que el solicitante sea administrador.
- Realiza una búsqueda parcial/insensible a mayúsculas (`ilike`) por correo en la tabla `users` de Supabase.
- Excluye usuarios con rol `admin` y `super_admin`.
- Obtiene la cantidad de mascotas asociadas a cada usuario en la base de datos.
- Intenta obtener la información complementaria de Memberstack si el usuario posee un `memberstack_id`.
- Retorna la información enriquecida con la estructura que el componente `RequestsTable` espera.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/[id]/delete/route.ts)
Robustecer el endpoint de eliminación y registrar en logs:
- Validar la autenticación del administrador.
- Permitir la búsqueda del usuario a eliminar tanto por `memberstack_id` como por su `id` (UUID de Supabase).
- Obtener su nombre y correo antes del borrado.
- Insertar un registro en la tabla `member_deletions` con los detalles del usuario eliminado y los datos del administrador.
- Manejar de forma tolerante el borrado en Memberstack: si la API de Memberstack retorna un error de tipo "Not Found" (404), continuar con la eliminación de Supabase con éxito en lugar de abortar y retornar un error HTTP 500.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/members/bulk-delete/route.ts)
Robustecer y añadir autenticación y registros:
- Validar la autenticación del administrador utilizando `getAdminUser(request)`.
- Registrar cada eliminación en la tabla `member_deletions` individualmente para auditar correctamente las eliminaciones masivas.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/activity/route.ts)
Enriquecer los logs de actividad:
- Consultar los registros de la tabla `member_deletions` ordenados descendentemente.
- Mapearlos y agregarlos al array de logs de actividad (`activityLogs`) como tipo `'deleted'`, categoría `'member'`, con el título "Usuario Eliminado" y descripción "Eliminó permanentemente al usuario [Nombre] ([Correo])".
- Filtrar para que aparezca en "Tu actividad" (si lo borró el admin actual) y en la "Actividad reciente" (que ve el super admin).

---

### [Frontend Dashboard UI]

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
Corregir la propiedad `requestType` que se le pasa a `RequestsTable` para la pestaña `all-members`:
- Cambiar `requestType={activeFilter === 'all-members' ? 'all' : ...}` a `requestType={activeFilter === 'all-members' ? 'all-members' : ...}` para que el componente `RequestsTable` detecte correctamente este estado.

#### [MODIFY] [RequestsTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/RequestsTable.tsx)
Actualizar la tabla de solicitudes para la pestaña de todos los miembros:
- Evitar cargar datos o estadísticas automáticamente en el montaje si `requestType` es `'all-members'`.
- Mostrar un campo de búsqueda centralizado con un botón de "Buscar" y un texto descriptivo.
- Al buscar, consultar `/api/admin/members/search?email=...`.
- Mostrar los resultados de la búsqueda usando las tarjetas y tablas existentes para mantener la coherencia estética.
- Permitir abrir el modal de detalles (`onViewDetails`) y realizar la eliminación (`onDelete`).

---

## Verification Plan

### Automated Tests
- Ejecutar `npm run build` y `npm run type-check` para asegurar la integridad de tipos de TypeScript.

### Manual Verification
1. Ingresar al Dashboard de Administración como Super Admin.
2. Navegar a la pestaña **Ajustes Master > Pruebas / Todos**.
3. Verificar que no se carguen usuarios por defecto y que aparezca el prompt de búsqueda.
4. Buscar un correo de prueba existente en Supabase (ej. `test@example.com`).
5. Confirmar que se muestran los detalles, cantidad de mascotas, y estado.
6. Probar la eliminación de un usuario y asegurar que se borre de Supabase, Storage y Memberstack (si existía).
7. Ir al feed de actividad del dashboard principal y verificar que aparezca la acción: *"Eliminó permanentemente al usuario [Nombre] ([Correo])"* con la fecha y hora correctas en "Tu actividad" y "Actividad reciente".
