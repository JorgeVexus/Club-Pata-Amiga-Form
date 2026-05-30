---
phase: 5
plan: 3
wave: 3
depends_on: ["02"]
files_modified:
  - src/app/api/admin/pets/[petId]/bypass-carencia/route.ts
  - src/components/Admin/SettingsPanel.tsx
autonomous: true
must_haves:
  truths:
    - "Super Admin puede buscar miembros y ver sus mascotas en Ajustes"
    - "Hacer clic en 'Forzar Fin de Carencia' aprueba la mascota y pone fin a su tiempo de espera"
    - "Usuarios no super-admins reciben código de error 401 al invocar la API"
  artifacts:
    - "src/app/api/admin/pets/[petId]/bypass-carencia/route.ts exists"
---

# Plan 5.3: Bypass de Período de Carencia para Super Admins

<objective>
Implementar la opción de bypass de período de carencia (tiempo de espera) para mascotas en el panel de configuración (Ajustes) accesible únicamente para Super Administradores, facilitando las pruebas de flujos de Fondo Solidario.

Output: Nueva API de admin y controles de interfaz de usuario en SettingsPanel.
</objective>

<context>
Load for context:
- src/components/Admin/SettingsPanel.tsx
- src/app/api/admin/members/[id]/pets/[petId]/status/route.ts
</context>

<tasks>

<task type="auto">
  <name>Crear API de bypass de carencia</name>
  <files>src/app/api/admin/pets/[petId]/bypass-carencia/route.ts</files>
  <action>
    Crear la ruta POST `/api/admin/pets/[petId]/bypass-carencia` para realizar el bypass.
    Verificar que el admin logueado tenga rol de `super_admin` con getAdminUser(request) y rechazar con 401 si no.
    Actualizar la mascota en Supabase estableciendo:
    - status = 'approved'
    - waiting_period_start = hace 180 días (para asegurar que transcurrió el tiempo de carencia estándar)
    - waiting_period_end = fecha y hora actuales (para que se considere completado hoy)
    Invocar `updateMemberStatusFromPets` local para sincronizar el estado del miembro en Supabase.
    AVOID: Permitir que administradores estándar (no super admins) ejecuten este endpoint.
  </action>
  <verify>Visual review of file structure and role check logic</verify>
  <done>Ruta de API creada con filtros de seguridad y persistencia en Supabase</done>
</task>

<task type="auto">
  <name>Implementar UI de bypass de carencia en panel de Ajustes</name>
  <files>src/components/Admin/SettingsPanel.tsx</files>
  <action>
    Añadir una sección premium dentro de SettingsPanel (debajo de skip-payment).
    Incluir un campo de búsqueda de miembros y cargarlos dinámicamente o listar miembros existentes mediante `/api/admin/members?status=all&paidOnly=false`.
    Al seleccionar un miembro de la lista, fetch de sus mascotas mediante `/api/user/pets?userId=${memberId}`.
    Listar las mascotas del miembro con un botón "Forzar Fin de Carencia".
    Al pulsar el botón, invocar la nueva API usando `adminFetch` y recargar la lista de mascotas al completarse.
    AVOID: Estilos toscos o inconsistencias visuales con skip-payment.
  </action>
  <verify>Build passes successfully</verify>
  <done>Interfaz de bypass de carencia totalmente funcional y estilizada en SettingsPanel.tsx</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] build and typecheck pass clean
- [ ] bypass carencia API results in 0 remaining days and approved pet status
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
