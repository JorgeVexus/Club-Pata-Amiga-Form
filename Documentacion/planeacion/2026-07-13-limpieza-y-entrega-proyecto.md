# Plan de Trabajo: Limpieza de Estructura y Preparación de Entrega

**Fecha**: 2026-07-13  
**Propósito**: Organizar y limpiar el directorio raíz de archivos obsoletos y temporales, reubicar guías de documentación y scripts SQL para simplificar el entendimiento del proyecto por parte del cliente y futuros desarrolladores.

---

## 📋 Diagnóstico Inicial
- **Código de Aplicación (`src/`)**: 100% saludable (`npm run type-check` y `npm run lint` pasan con éxito).
- **Directorio Raíz**: Saturado con más de 30 archivos que corresponden a borradores HTML, scripts SQL antiguos, pruebas de API de desarrollo y guías de desarrollo. Esto causa ruido visual y dificulta la comprensión del flujo de la aplicación.

---

## 🛠 Acciones Planeadas

### 1. Eliminación de Archivos Temporales de Prueba
- `query_ms_temp.js`
- `test-memberstack-api.ts`

### 2. Organización de Componentes Webflow
Todos los componentes HTML/JS/CSS pensados para Webflow se moverán de la raíz a directorios de soporte:
- **Widget Activo de Carencia**:
  - `waiting-period-panel.html` -> `webflow-components/waiting-period-panel.html`
  - `waiting-period-panel.js` -> `webflow-components/waiting-period-panel.js`
  - `waiting-period-panel.css` -> `webflow-components/waiting-period-panel.css`
- **Mocks y Prototipos Obsoletos**:
  - `index.html` -> `webflow-components/archived/old-registration-form-mock/index.html`
  - `script.js` -> `webflow-components/archived/old-registration-form-mock/script.js`
  - `styles.css` -> `webflow-components/archived/old-registration-form-mock/styles.css`
  - `nuevo-flujo-registro.html` -> `webflow-components/archived/old-registration-form-mock/nuevo-flujo-registro.html`
  - `force-refresh.html` -> `webflow-components/archived/old-registration-form-mock/force-refresh.html`
  - `test-map.html` -> `webflow-components/archived/old-registration-form-mock/test-map.html`
  - `vet-bot-updated.html` -> `webflow-components/archived/old-registration-form-mock/vet-bot-updated.html`
  - `webflow-notifications-widget.html` -> `webflow-components/archived/old-registration-form-mock/webflow-notifications-widget.html`

### 3. Organización de Scripts SQL Manuales
Mover los archivos SQL de soporte (que no forman parte del sistema de migraciones automatizadas de Supabase CLI en `supabase/migrations/`) a una carpeta organizada para evitar confusión sobre su aplicación automática:
- Mover los archivos a `supabase/manual_sql/`:
  - `ambassador_backfill.sql`
  - `ambassador_backfill_utf8.sql`
  - `final_ambassador_backfill.sql`
  - `update_baja_template.sql`
  - `supabase-setup.sql`
  - `supabase-approval-system.sql`
  - `supabase-membership-cancellations.sql`
  - `supabase-webflow-leads.sql`

### 4. Organización de Guías de Documentación
Reubicar las guías funcionales y técnicas del root a la carpeta `Documentacion/guias/` para despejar el directorio raíz:
- Mover los siguientes archivos markdown:
  - `DESIGN.md` y `DESIGN.json`
  - `GSD-STYLE.md`
  - `GUIA-IMPLEMENTACION-PRODUCCION.md`
  - `MEMBERSTACK-FIELDS.md`
  - `MODO-DEMO-GUIA.md`
  - `NUEVO-FLUJO-ACTUALIZADO.md`
  - `NUEVO-FLUJO-INTEGRADO.md`
  - `NUEVO-FLUJO-REGISTRO.md`
  - `PLAN-REESTRUCTURACION-FLUJO.md`
  - `PRODUCT.md`
  - `PROJECT_RULES.md`
  - `RESEND-SETUP.md`
  - `STAGING-GUIDE.md`
  - `TEST_WELLNESS_ROLES.md`
  - `TROUBLESHOOTING-WAITING-PERIOD.md`
  - `UI_UX_USAGE.md`
  - `WEBFLOW-DASHBOARD-GUIDE.md`
  - `WEBFLOW-WAITING-PERIOD-GUIDE.md`
  - `WELLNESS_CENTER_REDIRECTION_UPDATE.md`
  - `plan-fondo-solidario.md`

### 5. Actualización de Documentos Principales de Handover
- Actualizar `README.md` y `DEVELOPER-GUIDE.md` con la nueva estructura de carpetas y agregar una guía sobre cómo usar `graphify` para navegar por el grafo de conocimiento del proyecto.

---

## 🎯 Criterios de Aceptación (QA)
1. `npm run type-check` y `npm run lint` deben pasar con éxito tras la reorganización.
2. `npm run build` debe compilar la aplicación de Next.js sin advertencias críticas de dependencias de archivos eliminados/movidos.
3. El directorio raíz debe quedar exclusivamente con los archivos esenciales de configuración del framework y herramientas de los agentes (`README.md`, `DEVELOPER-GUIDE.md`, `DEPLOYMENT.md`, `package.json`, etc.).
