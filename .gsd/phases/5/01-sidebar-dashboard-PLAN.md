---
phase: 5
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/types/admin.types.ts
  - src/components/Admin/Sidebar.tsx
  - src/components/Admin/AdminDashboard.tsx
autonomous: true
must_haves:
  truths:
    - "Sidebar contains the new 'Plantillas de Correo' menu item under Communications section"
    - "Clicking 'Plantillas de Correo' changes the active tab/filter to communications-emails"
  artifacts:
    - "src/types/admin.types.ts is updated with communications-emails"
---

# Plan 5.1: Integración del Visualizador de Correos en la Estructura del Admin Dashboard

<objective>
Integrar la opción de visualización de correos electrónicos en el dashboard administrativo añadiendo los tipos necesarios, el menú lateral y la lógica de renderizado en el dashboard principal.

Output: Tipos modificados, Sidebar actualizado y AdminDashboard preparado para renderizar el visualizador de plantillas.
</objective>

<context>
Load for context:
- src/types/admin.types.ts
- src/components/Admin/Sidebar.tsx
- src/components/Admin/AdminDashboard.tsx
</context>

<tasks>

<task type="auto">
  <name>Actualizar tipos del admin</name>
  <files>src/types/admin.types.ts</files>
  <action>
    Añadir el literal 'communications-emails' al tipo RequestType.
    Añadir la etiqueta en español 'Visualizador de Plantillas' a REQUEST_TYPE_LABELS.
    Asignar un color de marca en REQUEST_TYPE_COLORS.
    AVOID: Modificar otros tipos existentes para no romper la compatibilidad con componentes del dashboard.
  </action>
  <verify>npm run type-check passes without errors</verify>
  <done>RequestType, labels y colors actualizados con 'communications-emails'</done>
</task>

<task type="auto">
  <name>Agregar opción en Sidebar</name>
  <files>src/components/Admin/Sidebar.tsx</files>
  <action>
    Agregar 'communications-emails' al tipo activeFilter en SidebarProps.
    Añadir el ítem `{ id: 'communications-emails', label: 'Plantillas de Correo', icon: '📧' }` dentro del array de ítems de la sección 'comunicaciones' del menú lateral.
    AVOID: Alterar los otros menús o secciones existentes para no interferir con las operaciones regulares del admin.
  </action>
  <verify>Visual review of code + build passes</verify>
  <done>Sidebar actualizado con la nueva opción en la sección de Comunicaciones</done>
</task>

<task type="auto">
  <name>Actualizar AdminDashboard para renderizar plantilla</name>
  <files>src/components/Admin/AdminDashboard.tsx</files>
  <action>
    Actualizar el tipo del estado activeFilter para soportar 'communications-emails'.
    En renderContent(), añadir el caso para 'communications-emails' que retorne provisionalmente un elemento placeholder `<div>Visualizador de Correos</div>` (luego lo reemplazaremos con el componente real).
    AVOID: Cambiar la lógica de autenticación o los flujos de redirección del dashboard.
  </action>
  <verify>npm run build runs clean</verify>
  <done>AdminDashboard listo y cargando el placeholder de visualizador de correos</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] build and typecheck pass clean
- [ ] Sidebar renders the option
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
