---
phase: 6
plan: 2
wave: 2
depends_on:
  - "01"
files_modified:
  - src/types/admin.types.ts
  - src/components/Admin/Sidebar.tsx
  - src/components/Admin/MetricCards.tsx
  - src/components/Admin/AdminDashboard.tsx
  - src/components/Admin/Solidarity/SolidarityDashboard.tsx
  - src/components/Admin/Solidarity/SolidarityRequestDetail.tsx
  - src/components/Admin/Communications/EmailTemplatePreviewer.tsx
  - src/app/api/solidarity/requests/[id]/messages/route.ts
  - src/app/api/solidarity/request/route.ts
autonomous: true
must_haves:
  truths:
    - "Sidebar menu item displays 'Apoyo Económico'"
    - "Metrics card displays 'Apoyo Económico'"
    - "Dashboard tabs render Apoyo Económico dashboards"
  artifacts:
    - "src/types/admin.types.ts is updated"
    - "src/components/Admin/Sidebar.tsx is updated"
---

# Plan 6.2: Reemplazo en Dashboard de Administración (Admin UI) y Notificaciones

<objective>
Actualizar todas las etiquetas, títulos de tabla, pestañas de navegación, módulos de métricas y notificaciones dentro del Dashboard de Administración para reflejar el término "Apoyo Económico" en lugar de "Fondo Solidario", manteniendo estables las rutas y variables internas.
</objective>

<context>
Load for context:
- src/types/admin.types.ts
- src/components/Admin/Sidebar.tsx
- src/components/Admin/MetricCards.tsx
- src/components/Admin/AdminDashboard.tsx
- src/components/Admin/Solidarity/SolidarityDashboard.tsx
- src/components/Admin/Solidarity/SolidarityRequestDetail.tsx
- src/components/Admin/Communications/EmailTemplatePreviewer.tsx
- src/app/api/solidarity/requests/[id]/messages/route.ts
- src/app/api/solidarity/request/route.ts
</context>

<tasks>

<task type="auto">
  <name>Actualizar tipos y mapeo de etiquetas del Admin</name>
  <files>src/types/admin.types.ts</files>
  <action>
    Reemplazar el label para `'solidarity-fund'` en `REQUEST_TYPE_LABELS` de `'Fondo Solidario'` a `'Apoyo Económico'`.
    Actualizar `'finance-refunds'` en `REQUEST_TYPE_LABELS` a `'Apoyo Económico (Reembolsos)'`.
    AVOID: Cambiar las claves de tipo literal como `'solidarity-fund'` o `'finance-refunds'` para no romper la compatibilidad de renderizado en otras partes de la app.
  </action>
  <verify>npm run type-check passes</verify>
  <done>Mapeo de etiquetas del admin actualizado con la nueva terminología</done>
</task>

<task type="auto">
  <name>Actualizar componentes de navegación y métricas del Admin</name>
  <files>src/components/Admin/Sidebar.tsx, src/components/Admin/MetricCards.tsx, src/components/Admin/AdminDashboard.tsx</files>
  <action>
    Actualizar el título de la sección de navegación de "Fondo Solidario" a "Apoyo Económico" en Sidebar.tsx.
    Actualizar el label de la tarjeta de métricas en MetricCards.tsx a "Apoyo Económico".
    Revisar filtros y estados de vistas de tabulación en AdminDashboard.tsx.
  </action>
  <verify>npm run build runs clean</verify>
  <done>Sidebar, MetricCards y AdminDashboard actualizados para renderizar 'Apoyo Económico'</done>
</task>

<task type="auto">
  <name>Actualizar vistas de detalle y listado de solicitudes</name>
  <files>src/components/Admin/Solidarity/SolidarityDashboard.tsx, src/components/Admin/Solidarity/SolidarityRequestDetail.tsx, src/components/Admin/Communications/EmailTemplatePreviewer.tsx</files>
  <action>
    Actualizar los encabezados principales, nombres de archivo de descarga CSV, y labels de campos en SolidarityDashboard.tsx.
    Actualizar labels de campo e inputs de texto en SolidarityRequestDetail.tsx (títulos, montos solicitados, etc.).
    Actualizar la plantilla de correo de ejemplo en EmailTemplatePreviewer.tsx: "seguro médico solidario" -> "apoyo económico".
  </action>
  <verify>npm run type-check passes</verify>
  <done>Formularios y listados de administración actualizados en su totalidad</done>
</task>

<task type="auto">
  <name>Actualizar asuntos de notificaciones en rutas de API</name>
  <files>src/app/api/solidarity/requests/[id]/messages/route.ts, src/app/api/solidarity/request/route.ts</files>
  <action>
    Cambiar el asunto de notificación saliente: "💬 Nuevo mensaje de Soporte (Fondo Solidario)" -> "💬 Nuevo mensaje de Soporte (Apoyo Económico)".
    Actualizar títulos descriptivos devueltos en las respuestas JSON si son visibles para el cliente.
    AVOID: Modificar la firma de los métodos o las llamadas a la base de datos Supabase.
  </action>
  <verify>npm run build runs clean</verify>
  <done>Notificaciones vía API actualizadas con la terminología de Apoyo Económico</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] build and typecheck pass clean
- [ ] Admin Sidebar renders 'Apoyo Económico'
- [ ] Rejections and email previewer templates show 'Apoyo Económico'
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
