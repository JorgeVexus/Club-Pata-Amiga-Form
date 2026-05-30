# Plan de Implementación: Bypass del Período de Carencia de Mascotas para Pruebas

Este documento detalla el plan para añadir una sección en el panel de configuración del dashboard de administración (visible solo para super admins) que permite finalizar de manera inmediata el período de carencia de cualquier mascota aprobada. Esto facilitará las pruebas de visibilidad y envío de solicitudes al Fondo Solidario.

## Cambios Propuestos

### 1. Nueva API de Admin: `POST /api/admin/pets/[petId]/bypass-carencia`
*   **Archivo**: `src/app/api/admin/pets/[petId]/bypass-carencia/route.ts` (Nuevo)
*   **Comportamiento**:
    *   Verificar autenticación del administrador a través de `getAdminUser(request)`.
    *   Asegurar que el rol del administrador sea estrictamente `super_admin`.
    *   Obtener la mascota por `petId` y cambiar su estado (`status`) a `approved`.
    *   Establecer `waiting_period_start` a hace 180 días (para asegurar que haya transcurrido la carencia estándar completa).
    *   Establecer `waiting_period_end` a la fecha actual (`now`).
    *   Actualizar el estatus general del miembro de la mascota en Supabase usando `updateMemberStatusFromPets` para asegurar consistencia del usuario.
    *   Retornar una respuesta de éxito.

### 2. Panel de Administración: Sección de Bypass de Carencia en `SettingsPanel`
*   **Archivo**: `src/components/Admin/SettingsPanel.tsx` (Modificar)
*   **Comportamiento**:
    *   Añadir una nueva tarjeta/sección dentro de `SettingsPanel` titulada: `⚡ Bypass de Período de Carencia (Tiempo de Espera)`.
    *   Mostrar una barra de búsqueda para filtrar miembros de Memberstack por nombre o correo electrónico.
    *   Al escribir en la barra de búsqueda, listar los miembros que coincidan.
    *   Al hacer clic en un miembro:
        *   Cargar dinámicamente sus mascotas llamando a la API `/api/user/pets?userId=${memberId}`.
        *   Listar las mascotas de dicho miembro con su raza, estado de aprobación actual y días restantes de carencia.
        *   Para cada mascota, proporcionar un botón de acción destacada: `⚡ Forzar Fin de Carencia`.
        *   Al hacer clic en el botón, llamar a la nueva API `POST /api/admin/pets/[petId]/bypass-carencia` utilizando `adminFetch` (que pasa el `x-admin-memberstack-id` header de forma automática).
        *   Mostrar un mensaje de éxito/error al finalizar y recargar el estado de las mascotas.

## Plan de Verificación

### Pruebas Manuales
1.  **Validación de Roles**: Intentar consumir la nueva API con un token de administrador estándar y comprobar que retorne `401 Unauthorized` / error de permisos.
2.  **Búsqueda e Interfaz**: Ingresar al panel de configuraciones con una sesión de `Super Admin` y verificar la visualización estética de la sección. Buscar un miembro de prueba, seleccionarlo y comprobar la carga de sus mascotas.
3.  **Bypass de Carencia**: Hacer clic en `Forzar Fin de Carencia` para una mascota en estado pendiente o en carencia y verificar que su estado cambie a aprobada y sus días restantes pasen a 0 (Completado).
4.  **Integración en Webflow**: Verificar que, tras realizar el bypass, el widget de Webflow de Fondo Solidario muestre correctamente el botón `#fondo` para el usuario correspondiente, y que la API `/api/solidarity/request` acepte solicitudes para dicha mascota.
