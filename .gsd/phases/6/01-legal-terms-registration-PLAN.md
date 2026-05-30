---
phase: 6
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/data/legal-terms.ts
  - src/components/PlanSelection/PlanSelection.tsx
  - src/app/layout.tsx
  - MEMBERSTACK-FIELDS.md
  - WEBFLOW-WAITING-PERIOD-GUIDE.md
autonomous: true
must_haves:
  truths:
    - "All user-facing Spanish mentions of 'Fondo Solidario' or 'Fondo' in legal terms are replaced with 'Apoyo Económico'"
    - "Plan selection terms check box mentions 'Apoyo Económico'"
  artifacts:
    - "src/data/legal-terms.ts is modified"
    - "src/components/PlanSelection/PlanSelection.tsx is modified"
---

# Plan 6.1: Reemplazo en Términos Legales, Registro y Documentación

<objective>
Reemplazar todas las menciones y referencias al "Fondo Solidario" o "Fondo" por el término "Apoyo Económico" en los textos legales de adhesión, los checks del formulario de selección de planes, el layout principal y la documentación técnica del proyecto.
</objective>

<context>
Load for context:
- src/data/legal-terms.ts
- src/components/PlanSelection/PlanSelection.tsx
- src/app/layout.tsx
- MEMBERSTACK-FIELDS.md
- WEBFLOW-WAITING-PERIOD-GUIDE.md
</context>

<tasks>

<task type="auto">
  <name>Actualizar términos y reglamentos legales</name>
  <files>src/data/legal-terms.ts</files>
  <action>
    Reemplazar todas las ocurrencias en español de "Fondo Solidario" y "Fondo" (dentro del contexto del fondo de asistencia) por "Apoyo Económico" en todo el archivo.
    Actualizar títulos: "REGLAMENTO DEL FONDO SOLIDARIO" -> "REGLAMENTO DEL APOYO ECONÓMICO".
    AVOID: Alterar la estructura o variables en código Javascript/Typescript exportadas de este archivo.
  </action>
  <verify>npm run type-check passes</verify>
  <done>Textos legales actualizados con la terminología de Apoyo Económico</done>
</task>

<task type="auto">
  <name>Actualizar textos del flujo de Selección de Plan</name>
  <files>src/components/PlanSelection/PlanSelection.tsx</files>
  <action>
    Reemplazar "Reglamento del Fondo Solidario" por "Reglamento del Apoyo Económico" en las cláusulas de consentimiento.
    Modificar las descripciones de los planes y referencias a aportaciones ("Aportación al Fondo Solidario" -> "Aportación al Apoyo Económico").
    AVOID: Modificar la estructura de control del componente o el flujo de pago con Stripe.
  </action>
  <verify>npm run build runs clean</verify>
  <done>PlanSelection.tsx actualizado con el nuevo término en checks y descripciones</done>
</task>

<task type="auto">
  <name>Actualizar metadata de layout y documentación</name>
  <files>src/app/layout.tsx, MEMBERSTACK-FIELDS.md, WEBFLOW-WAITING-PERIOD-GUIDE.md</files>
  <action>
    Actualizar la meta descripción en layout.tsx reemplazando "fondo solidario" con "apoyo económico".
    Reemplazar las menciones de "fondo solidario" en MEMBERSTACK-FIELDS.md y WEBFLOW-WAITING-PERIOD-GUIDE.md para mantener la coherencia en la documentación.
  </action>
  <verify>npm run type-check and git diff show expected documentation updates</verify>
  <done>layout.tsx y documentación técnica actualizados</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] build and typecheck pass clean
- [ ] legal-terms.ts references are updated
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
