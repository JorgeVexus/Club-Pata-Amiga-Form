# Reemplazo de "Fondo Solidario" por "Apoyo Económico"

El objetivo de este plan es reemplazar sistemática y lógicamente todas las menciones y referencias al "Fondo Solidario" o "Fondo" por el término "Apoyo Económico" en las interfaces de usuario (formularios, dashboards, widgets embebidos en Webflow, correos electrónicos, etc.) y documentos del sistema.

## User Review Required

> [!IMPORTANT]
> **Definición del Límite de Cambios (Backend vs. Frontend)**
> Para garantizar la máxima estabilidad y evitar interrupciones o rotura de enlaces en producción, proponemos mantener los identificadores internos y de persistencia intactos:
> 1. **Rutas de API de Next.js**: `/api/solidarity/*` se mantendrán sin cambios. Cambiarlas rompería las llamadas externas de los widgets ya embebidos en Webflow.
> 2. **Base de Datos (Supabase)**: Las tablas como `solidarity_requests`, `solidarity_messages` y `solidarity_documents`, así como sus columnas, mantendrán sus nombres originales para evitar migraciones complejas de base de datos y riesgos de RLS.
> 3. **Nombres de Archivo de Widgets**: Los nombres de archivo en `public/widgets/` (ej. `solidarity-dashboard.js`) se conservarán para no romper la carga de scripts en las páginas de Webflow, pero el texto renderizado en la interfaz dirá "Apoyo Económico".

> [!WARNING]
> **Modificación de Textos Legales (`legal-terms.ts`)**
> Modificaremos el texto de los contratos y reglamentos en `src/data/legal-terms.ts` de "Fondo Solidario" a "Apoyo Económico" (ej. "Reglamento del Fondo Solidario" pasará a ser "Reglamento del Apoyo Económico"). Por favor, confirme si estos cambios requieren alguna revisión legal específica antes de desplegarse a producción.

## Open Questions

> [!IMPORTANT]
> 1. ¿Desea mantener el nombre de las variables internas en código TypeScript que hagan referencia a "solidarity" (por ejemplo, tipos como `SolidarityRequest` o funciones como `getSolidarityPetLifecycleSummary`), o prefiere que cambiemos también el código fuente interno de Next.js, asumiendo el riesgo de tener que refactorizar todo el tipado en la app?
>    * *Nuestra recomendación*: Mantener las variables de código TypeScript y base de datos con "solidarity" por consistencia de desarrollo, y cambiar únicamente el texto visible al usuario final (labels, placeholders, headers, correos y notificaciones).
> 2. ¿El término "Fondo" cuando se use de forma genérica debe cambiarse por "apoyo económico" de manera estricta o adaptando la gramática?
>    * *Ejemplo*: "activación de tu fondo" -> "activación de tu apoyo económico". Nos encargaremos de ajustar la gramática ("el fondo" -> "el apoyo económico", "del fondo" -> "del apoyo económico").

---

## Proposed Changes

### 1. Documentos de Términos Legales y Registro

#### [MODIFY] [legal-terms.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/data/legal-terms.ts)
- Reemplazar todas las menciones de "Fondo Solidario" o "Fondo" (dentro del contexto del fondo) por "Apoyo Económico".
- Ajustar títulos de secciones: "REGLAMENTO DEL FONDO SOLIDARIO" -> "REGLAMENTO DEL APOYO ECONÓMICO".
- Ajustar definiciones de términos como "Aportación al Fondo" -> "Aportación al Apoyo Económico" o similar.

#### [MODIFY] [PlanSelection.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/PlanSelection/PlanSelection.tsx)
- Modificar descripciones de los planes y checks de términos de adhesión.
- Cambiar "(d) el Reglamento del Fondo Solidario" -> "(d) el Reglamento del Apoyo Económico".
- Cambiar "Aportación al Fondo Solidario" -> "Aportación al Apoyo Económico".

#### [MODIFY] [layout.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/layout.tsx)
- Actualizar la meta-description de la aplicación: "...beneficios exclusivos y fondo solidario" -> "...beneficios exclusivos y apoyo económico".

---

### 2. Dashboard de Administración (Admin UI)

#### [MODIFY] [SolidarityDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Solidarity/SolidarityDashboard.tsx)
- Cambiar los encabezados, textos de botón, labels de descarga CSV y referencias en UI de "Fondo Solidario" a "Apoyo Económico".

#### [MODIFY] [SolidarityRequestDetail.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Solidarity/SolidarityRequestDetail.tsx)
- Reemplazar títulos, labels de campos y mensajes de UI para usar "Apoyo Económico" en lugar de "Fondo Solidario".

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Sidebar.tsx)
- Modificar el título de menú lateral de "Fondo Solidario" a "Apoyo Económico".

#### [MODIFY] [MetricCards.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MetricCards.tsx)
- Reemplazar "Fondo Solidario" por "Apoyo Económico" en la tarjeta de métricas.

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
- Actualizar los filtros activos y mapeos de vistas.

#### [MODIFY] [admin.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/admin.types.ts)
- Actualizar `REQUEST_TYPE_LABELS['solidarity-fund']` de `'Fondo Solidario'` a `'Apoyo Económico'`.
- Actualizar `'finance-refunds'` de `'Apoyos (Reembolsos)'` a `'Apoyo Económico (Reembolsos)'` o similar.

#### [MODIFY] [solidarity.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/solidarity.types.ts)
- Actualizar comentarios del archivo.
- Modificar `SOLIDARITY_BENEFIT_LABELS.death` de `'Fallecimiento'` o cualquier label relacionado con el fondo solidario si aplica.

#### [MODIFY] [EmailTemplatePreviewer.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Communications/EmailTemplatePreviewer.tsx)
- Cambiar la plantilla previa en español: "reembolsos de su seguro médico solidario" -> "reembolsos de su apoyo económico".

---

### 3. Public Widgets y Previews (Public folder)

#### [MODIFY] [solidarity-dashboard.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-dashboard.js)
- Reemplazar títulos principales, explicaciones sobre carencia y textos de acceso de "Fondo Solidario" a "Apoyo Económico".
- Cambiar textos como: "fondo solidario activo" -> "apoyo económico activo", "Mascotas con acceso al Fondo Solidario" -> "Mascotas con acceso al Apoyo Económico".

#### [MODIFY] [solidarity-request-form.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-request-form.js)
- Cambiar etiquetas del formulario: "Monto solicitado al fondo" -> "Monto solicitado de apoyo económico".
- Cambiar estados: "Fondo activo" -> "Apoyo activo".

#### [MODIFY] [solidarity-request-detail.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-request-detail.js)
- Reemplazar menciones en el visor de detalles y chat de aclaraciones.

#### [MODIFY] [solidarity-button-visibility.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-button-visibility.js)
- Cambiar logs de consola y lógica de escaneo si se expone texto al usuario (o mantener puramente técnicos los logs internos).

#### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)
- Cambiar textos en las tarjetas de miembros y mascotas.
- "Fondo Activado" -> "Apoyo Económico Activado".
- "...ya puede acceder al fondo solidario" -> "...ya puede acceder al apoyo económico".
- "...para activar tu fondo completo" -> "...para activar tu apoyo económico completo".

#### [MODIFY] [wellness-center-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-center-widget.js)
- "Fondo Solidario" -> "Apoyo Económico".
- "Pago de Fondo Solidario" -> "Pago de Apoyo Económico".
- "Historial de Pagos (Fondo Solidario)" -> "Historial de Pagos (Apoyo Económico)".

#### [MODIFY] [solidarity-preview.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-preview.html)
- Actualizar título HTML.

#### [MODIFY] [solidarity-request-form-preview.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-request-form-preview.html)
- "Módulo de solicitudes de apoyo (Fondo Solidario)" -> "Módulo de solicitudes de apoyo económico".

#### [MODIFY] [solidarity-request-detail-preview.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-request-detail-preview.html)
- Actualizar títulos HTML.

#### [MODIFY] [solidarity-dev-test.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-dev-test.html)
- Actualizar títulos HTML.

---

### 4. Componentes y Vistas Locales de Webflow/HTML

#### [MODIFY] [fondo-solidario.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/webflow-components/fondo-solidario.html)
- Cambiar títulos e introducciones en el componente local.

#### [MODIFY] [pet-cards-section.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/webflow-components/pet-cards-section.html)
- "Fondo solidario disponible" -> "Apoyo económico disponible".
- "Fondo solidario pendiente" -> "Apoyo económico pendiente".

#### [MODIFY] [faq-categorias.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/webflow-components/faq-categorias.html)
- "¿Cómo funciona el fondo solidario?" -> "¿Cómo funciona el apoyo económico?".

#### [MODIFY] [waiting-period-panel.html](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/waiting-period-panel.html)
- "...para activar tu fondo solidario completo" -> "...para activar tu apoyo económico completo".

#### [MODIFY] [waiting-period-panel.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/waiting-period-panel.js)
- "...para activar tu fondo solidario completo" -> "...para activar tu apoyo económico completo".

---

### 5. Notificaciones de Correo y Respuestas de API

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/solidarity/requests/%5Bid%5D/messages/route.ts)
- "💬 Nuevo mensaje de Soporte (Fondo Solidario)" -> "💬 Nuevo mensaje de Soporte (Apoyo Económico)".

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/solidarity/request/route.ts)
- Modificar el campo `type` de la notificación o descripciones si se exponen al panel de notificaciones del miembro.

---

### 6. Documentación del Proyecto

#### [MODIFY] [MEMBERSTACK-FIELDS.md](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/MEMBERSTACK-FIELDS.md)
- Actualizar descripciones: "...para activar el fondo solidario" -> "...para activar el apoyo económico".

#### [MODIFY] [WEBFLOW-WAITING-PERIOD-GUIDE.md](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/WEBFLOW-WAITING-PERIOD-GUIDE.md)
- Actualizar la guía de Webflow con las nuevas etiquetas de HTML.

---

## Verification Plan

### Automated Tests
- Ejecutar `npm run build` para asegurar la compilación completa de Next.js.
- Ejecutar `npm run type-check` para garantizar la integridad de tipos en TypeScript.
- Ejecutar `npm run lint` para chequear el formato y estilo de código.

### Manual Verification
- Cargar localmente el dashboard de administración (`/admin/dashboard`) y verificar que todos los títulos, filtros y pestañas muestren "Apoyo Económico" en vez de "Fondo Solidario".
- Levantar los widgets en modo local (`npm run dev`) y verificar visualmente en los HTML de prueba y scripts que el renderizado de la carencia y el estado de la mascota use "Apoyo Económico".
- Revisar que la simulación de correos y la vista previa muestren el nuevo texto corregido.
