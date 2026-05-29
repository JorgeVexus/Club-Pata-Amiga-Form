---
phase: 5
plan: 2
wave: 2
depends_on: ["01"]
files_modified:
  - src/components/Admin/Communications/EmailTemplatePreviewer.tsx
  - src/components/Admin/Communications/EmailTemplatePreviewer.module.css
  - src/components/Admin/AdminDashboard.tsx
autonomous: true
must_haves:
  truths:
    - "EmailTemplatePreviewer displays categories and templates"
    - "Clicking a template renders its HTML layout in an iframe"
    - "Inputs dynamically update the iframe content in real-time"
  artifacts:
    - "src/components/Admin/Communications/EmailTemplatePreviewer.tsx exists"
    - "src/components/Admin/Communications/EmailTemplatePreviewer.module.css exists"
---

# Plan 5.2: Implementación de la Interfaz del Visualizador de Correos

<objective>
Implementar la interfaz de usuario interactiva y de alta calidad para previsualizar los correos del sistema en tiempo real.

Output: Componente EmailTemplatePreviewer y sus estilos CSS, integrados en el dashboard administrativo.
</objective>

<context>
Load for context:
- src/utils/email-builder.ts
- src/app/actions/ambassador-comm.actions.ts
</context>

<tasks>

<task type="auto">
  <name>Crear el componente EmailTemplatePreviewer</name>
  <files>src/components/Admin/Communications/EmailTemplatePreviewer.tsx</files>
  <action>
    Crear el componente de previsualización que organice los correos en 3 categorías: Miembros, Embajadores y Centros de Bienestar.
    Para cada correo, definir un conjunto de variables modificables por formulario (por ejemplo: `memberName`, `petName`, `amount`, `referralCode`).
    Utilizar un `iframe` para renderizar el HTML generado en tiempo real. Utilizar `srcDoc` para inyectar dinámicamente el HTML.
    Importar el builder de emails de miembros (`buildBrandedEmailHtml`), de missing docs (`buildMissingDocsEmailHtml`), info request (`buildInfoRequestEmailHtml`), baja (`buildTerminationEmailHtml`), y recrear localmente el de embajadores (`createEmailTemplate`) y el de centros de bienestar para que no requieran llamadas a backend o envío real.
    AVOID: Ejecutar llamadas de servidor reales para enviar emails. Esto es puramente visual de frontend.
  </action>
  <verify>Visual review of file structure</verify>
  <done>EmailTemplatePreviewer.tsx creado con todos los tipos de emails del sistema y su lógica de inyección en iframe</done>
</task>

<task type="auto">
  <name>Diseñar estilos CSS Premium</name>
  <files>src/components/Admin/Communications/EmailTemplatePreviewer.module.css</files>
  <action>
    Crear estilos alineados con la estética premium del proyecto.
    Utilizar un layout responsivo de dos columnas: columna izquierda con controles e inputs (usando inputs redondeados con opacidad, botones llamativos con bordes negros e interactividad), columna derecha con el panel del `iframe` de previsualización con sombra elegante y diseño de mockup de dispositivo o tarjeta limpia.
    AVOID: Estilos genéricos o no responsivos.
  </action>
  <verify>Build passes successfully</verify>
  <done>Estilos aplicados y validados</done>
</task>

<task type="auto">
  <name>Integrar componente en AdminDashboard</name>
  <files>src/components/Admin/AdminDashboard.tsx</files>
  <action>
    Importar `<EmailTemplatePreviewer />` y reemplazar el placeholder provisional que pusimos en el Plan 5.1 en el método `renderContent()`.
    AVOID: Romper importaciones existentes.
  </action>
  <verify>npm run build and npm run lint pass with zero errors</verify>
  <done>Visualizador integrado completamente y listo para usar</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] build and typecheck pass clean
- [ ] interactive inputs update iframe in real-time
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
