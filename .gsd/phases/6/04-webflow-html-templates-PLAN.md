---
phase: 6
plan: 4
wave: 2
depends_on:
  - "01"
files_modified:
  - public/widgets/solidarity-preview.html
  - public/widgets/solidarity-request-form-preview.html
  - public/widgets/solidarity-request-detail-preview.html
  - public/widgets/solidarity-dev-test.html
  - webflow-components/fondo-solidario.html
  - webflow-components/pet-cards-section.html
  - webflow-components/faq-categorias.html
  - waiting-period-panel.html
  - waiting-period-panel.js
autonomous: true
must_haves:
  truths:
    - "HTML templates render 'Apoyo Económico' headers"
    - "Waiting period panels render 'apoyo económico' instead of 'fondo solidario'"
  artifacts:
    - "webflow-components/fondo-solidario.html is updated"
    - "waiting-period-panel.html is updated"
---

# Plan 6.4: Reemplazo en Plantillas HTML y Vistas de Pruebas de Webflow

<objective>
Reemplazar todas las menciones en español de "Fondo Solidario" o "Fondo" por "Apoyo Económico" en los títulos, encabezados, párrafos y scripts embebidos de las plantillas HTML locales y páginas de previsualización estáticas.
</objective>

<context>
Load for context:
- public/widgets/solidarity-preview.html
- public/widgets/solidarity-request-form-preview.html
- public/widgets/solidarity-request-detail-preview.html
- public/widgets/solidarity-dev-test.html
- webflow-components/fondo-solidario.html
- webflow-components/pet-cards-section.html
- webflow-components/faq-categorias.html
- waiting-period-panel.html
- waiting-period-panel.js
</context>

<tasks>

<task type="auto">
  <name>Actualizar plantillas HTML y vistas de pruebas</name>
  <files>public/widgets/solidarity-preview.html, public/widgets/solidarity-request-form-preview.html, public/widgets/solidarity-request-detail-preview.html, public/widgets/solidarity-dev-test.html, webflow-components/fondo-solidario.html, webflow-components/pet-cards-section.html, webflow-components/faq-categorias.html, waiting-period-panel.html, waiting-period-panel.js</files>
  <action>
    Reemplazar menciones en los títulos HTML (`<title>`), encabezados (`<h1>`, `<h2>`), párrafos y scripts embebidos locales.
    Ejemplos: "¿Cómo funciona el fondo solidario?" -> "¿Cómo funciona el apoyo económico?", "Fondo solidario disponible" -> "Apoyo económico disponible".
    AVOID: Alterar la estructura de clases CSS o atributos `data-` para evitar fallos de maquetación en Webflow.
  </action>
  <verify>Visual review of HTML code shows terms replaced</verify>
  <done>HTML de componentes locales y páginas de prueba actualizados</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] static templates render 'Apoyo Económico'
- [ ] waiting-period-panel renders correctly with 'apoyo económico'
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
