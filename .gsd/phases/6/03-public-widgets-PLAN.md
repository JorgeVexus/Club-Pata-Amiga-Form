---
phase: 6
plan: 3
wave: 2
depends_on:
  - "01"
files_modified:
  - public/widgets/solidarity-dashboard.js
  - public/widgets/solidarity-request-form.js
  - public/widgets/solidarity-request-detail.js
  - public/widgets/solidarity-button-visibility.js
  - public/widgets/unified-membership-widget.js
  - public/widgets/wellness-center-widget.js
autonomous: true
must_haves:
  truths:
    - "All user-facing Spanish text in public scripts render 'Apoyo Económico'"
    - "Widgets embedded in Webflow show 'apoyo económico' for active and pending pet states"
  artifacts:
    - "public/widgets/solidarity-dashboard.js is updated"
    - "public/widgets/solidarity-request-form.js is updated"
---

# Plan 6.3: Reemplazo en Widgets de Webflow y Scripts Públicos JS

<objective>
Reemplazar de forma lógica todas las leyendas, textos de interfaz, modales de carencia y labels en los widgets públicos de Webflow (archivos Javascript) para mostrar "Apoyo Económico" en vez de "Fondo Solidario" o "Fondo".
</objective>

<context>
Load for context:
- public/widgets/solidarity-dashboard.js
- public/widgets/solidarity-request-form.js
- public/widgets/solidarity-request-detail.js
- public/widgets/solidarity-button-visibility.js
- public/widgets/unified-membership-widget.js
- public/widgets/wellness-center-widget.js
</context>

<tasks>

<task type="auto">
  <name>Actualizar textos en widgets públicos JS</name>
  <files>public/widgets/solidarity-dashboard.js, public/widgets/solidarity-request-form.js, public/widgets/solidarity-request-detail.js, public/widgets/solidarity-button-visibility.js, public/widgets/unified-membership-widget.js, public/widgets/wellness-center-widget.js</files>
  <action>
    Buscar y reemplazar todas las menciones en español de "Fondo Solidario", "fondo solidario", "fondo activo", "acceso al fondo" por "Apoyo Económico", "apoyo económico", "apoyo activo", "acceso al apoyo económico" en los textos de renderizado HTML inyectados por los scripts de los widgets.
    AVOID: Modificar nombres de archivo de los scripts, URLs de llamadas de API (`fetch('/api/solidarity/...')`) o identificadores CSS/DOM (`id="fondo"`, `.fondo`) para no romper el CSS ni la carga de scripts en Webflow.
  </action>
  <verify>Scripts load and don't produce syntax errors; text replacement is verified via grep</verify>
  <done>Todos los widgets JS actualizados en sus literales de interfaz de usuario</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] JS scripts render 'Apoyo Económico' tags
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
