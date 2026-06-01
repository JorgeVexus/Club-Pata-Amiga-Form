gsd# Plan de Implementación: Visualizador de Correos en Dashboard de Administración

Este plan propone añadir una nueva sección en el panel de administración ("Plantillas de Correo") que permite a los administradores previsualizar en tiempo real el diseño y contenido de todos los correos electrónicos que el sistema envía, organizados por categoría (Miembros, Embajadores, Centros de Bienestar) y permitiendo parametrizar los datos para ver cómo lucirían.

## Proposed Changes

### 1. [admin.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/admin.types.ts)
#### [MODIFY]
- Agregar `'communications-emails'` a `RequestType`.
- Añadir color de marca y etiqueta en español en `REQUEST_TYPE_COLORS` y `REQUEST_TYPE_LABELS`.

### 2. [Sidebar.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Sidebar.tsx)
#### [MODIFY]
- Agregar `'communications-emails'` a la firma del tipo de `activeFilter` en `SidebarProps`.
- Incorporar la opción `"Plantillas de Correo"` (`{ id: 'communications-emails', label: 'Plantillas de Correo', icon: '📧' }`) en la sección de `"Comunicaciones"`.

### 3. [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
#### [MODIFY]
- Agregar `'communications-emails'` al tipo genérico de `activeFilter`.
- Importar y renderizar el nuevo componente `<EmailTemplatePreviewer />` en `renderContent()`.

### 4. [EmailTemplatePreviewer.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Communications/EmailTemplatePreviewer.tsx)
#### [NEW]
- Crear este componente en React.
- **Selector de Categorías**: Pestañas o dropdowns para alternar entre "Miembros", "Embajadores" y "Centros de Bienestar".
- **Listado de Plantillas**:
  - **Miembros**: Bienvenida, Apelación Aprobada/Rechazada, Documentos Faltantes (Días 0, 10, 13, 14, 15), Solicitud de Información, Aviso de Baja.
  - **Embajadores**: Aprobación de Cuenta, Comisión Ganada, Código de Referido Listo, Código Cambiado, Cambio de Código Habilitado.
  - **Centros de Bienestar**: Aprobación / Rechazo de Solicitud.
- **Formulario de Parámetros**: Inputs interactivos según el correo seleccionado (Nombre del miembro, Nombre de mascota, Razón de rechazo, Saldo de comisión, Código de referido, etc.).
- **Visualizador en Tiempo Real**: Panel derecho con un `iframe` que renderiza el HTML del email usando las funciones constructoras reales del sistema (`buildBrandedEmailHtml`, `buildMissingDocsEmailHtml`, etc.) inyectándole los inputs del formulario en tiempo real.

### 5. [EmailTemplatePreviewer.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Communications/EmailTemplatePreviewer.module.css)
#### [NEW]
- Archivo de estilos con estética premium alineada a la marca (colores HSL, variables globales `:root`, bordes redondeados `radius-container`, fuentes Outfit, layouts de dos columnas responsivos, etc.).

---

## Verification Plan

### Manual Verification
- Iniciar el servidor local (`npm run dev`) y acceder al dashboard de administración (`/admin/dashboard`).
- Navegar a la pestaña "Plantillas de Correo" desde el menú lateral.
- Alternar entre las diferentes plantillas de las tres categorías.
- Editar los inputs del formulario (por ejemplo, cambiar el nombre de la mascota o el monto de la comisión) y verificar que el contenido dentro del `iframe` se actualice en tiempo real.
- Validar el responsive design en layouts móvil y tablet.

### Automated Tests
- Ejecutar `npm run build` y `npm run lint` para garantizar estabilidad de tipos y consistencia estilística.
