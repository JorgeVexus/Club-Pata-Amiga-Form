# Plan de Implementación: Visualización de Información en el Panel del Centro de Bienestar

Actualizar la tarjeta "Información del Centro" en el panel del Centro de Bienestar para mostrar de forma detallada, visual y atractiva (premium) toda la información registrada del establecimiento (logo, datos de contacto, dirección con mapa, promoción de miembros y redes sociales), manteniendo la capacidad de editar la información a través de un modal.

## Review Requerido por el Usuario

> [!NOTE]
> Este cambio solo afecta la representación visual del panel del aliado (Centro de Bienestar) y no tiene impacto en la estructura de base de datos ni en el flujo de autenticación.

## Cambios Propuestos

### Componente del Widget

#### [MODIFY] [wellness-center-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/wellness-center-widget.js)

- **Añadir SVG Utilitarios**:
  - `INSTAGRAM_SVG`, `FACEBOOK_SVG`, `TIKTOK_SVG`, `WEBSITE_SVG` para representaciones vectoriales limpias de los enlaces sociales.
- **Ampliar Diseño CSS**:
  - Agregar estilos premium a `STYLES` (`.wc-info-card-content`, `.wc-info-header`, `.wc-info-logo-large`, `.wc-info-placeholder-logo`, `.wc-info-grid`, `.wc-info-section`, `.wc-info-item`, `.wc-info-promo-box`, `.wc-info-socials`, `.wc-info-social-btn`, etc.).
- **Modificar `renderDashboard(container, center)`**:
  - Definir `const social = center.social_links || {};` al inicio de la función.
  - Reestructurar el contenedor `Información del Centro` para reemplazar el texto genérico con una vista detallada que muestre:
    - Logo o inicial del centro de bienestar en un marco circular/redondeado premium.
    - Nombre del establecimiento.
    - Sección de Contacto (Teléfono con link `tel:`, Email con link `mailto:` y Dirección con botón para abrir Google Maps usando las coordenadas si están presentes).
    - Sección de Beneficios Especiales para Miembros (dentro de una caja estilizada tipo ticket con borde discontinuo).
    - Botones de Redes Sociales con diseño interactivo (hover transitions y colores temáticos).
  - Mantener el botón `btn-edit-profile` vinculado al modal de edición.

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run build` para asegurar la compatibilidad general.
- Ejecutar `npm run type-check` para garantizar que no haya regresiones en TypeScript.
- Ejecutar `npm run lint` para revisar consistencia de estilos y reglas de código.

### Verificación Manual
1. Abrir la página del panel de aliados en local.
2. Iniciar sesión con un usuario de Centro de Bienestar aprobado.
3. Observar la nueva interfaz detallada de la tarjeta "Información del Centro".
4. Hacer clic en "Editar Información", cambiar algunos campos (ej: redes sociales, beneficio, teléfono) y guardar.
5. Confirmar que la tarjeta se actualiza en tiempo real reflejando los nuevos datos.
6. Probar los enlaces dinámicos de redes sociales y de Google Maps.
