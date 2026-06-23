# Nuevo Widget de Inicio (Home Widget) - Rediseño Moderno (Figma)

Este documento detalla la actualización del plan técnico para desarrollar el Home Page como widget incrustable en Webflow. Corregiremos el diseño para **alejarnos del estilo neo-brutalista** (sin bordes negros gruesos ni sombras sólidas de desfase) e implementar con precisión el estilo limpio, moderno y de interfaz suave (soft UI/SaaS) definido en Figma.

## User Review Required

> [!IMPORTANT]
> - **Estilo de Diseño**: Se eliminan todas las reglas CSS que inyectan bordes gruesos de `3px solid #1b1b1b` y sombras sólidas `box-shadow: 8px 8px 0px #1b1b1b` en tarjetas, botones y campos de entrada.
> - **Estética Figma**: Se utilizarán bordes delgados de color gris claro (`1px solid rgba(0, 0, 0, 0.05)`), bordes verdes para el plan anual (`2px solid #84d400`), y sombras suaves (`box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05)`).
> - **Botones y Formularios**: Todos los botones tendrán bordes redondeados limpios sin contornos oscuros. Los inputs del formulario serán ovalados con bordes finos y suaves.

## Proposed Changes

---

### [Widgets]

#### [MODIFY] [home-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/home-widget.js)
Modificar la inyección de estilos (`injectStyles()`) y el renderizado HTML para implementar la estética moderna de Figma:
1. **Contenedores y Tarjetas**:
   - Fondo de página suave e integraciones fluidas.
   - Tarjetas blancas con `border-radius: 25px` y sombras difusas (`box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.05)`).
   - Tarjeta anual con borde verde brillante de `2px solid #84d400`.
2. **Botones**:
   - Botón primario en Hero y Pasos: `#FE8F15` (naranja) con bordes redondeados y sombra difusa muy sutil. Sin borde negro.
   - Botón mensual: `#1b1b1b` (negro/gris oscuro) sin bordes.
   - Botón anual: `#84d400` (verde) con texto negro y sin bordes.
   - Efectos de hover suaves basados en opacidad o cambios ligeros de luminosidad (`filter: brightness(0.95)` o `opacity: 0.9`).
3. **Formularios (Centros de Bienestar e Inputs)**:
   - Campos de texto con `border: 1px solid rgba(0, 0, 0, 0.1)`, `border-radius: 50px`, y relleno cómodo.
   - Focus de campos con color de borde `#00BBB4` (turquesa) y sombra suave.
4. **Acordeón FAQ**:
   - Tarjetas de acordeón redondeadas con bordes grises muy delgados, fondo ligeramente verde muy claro (`rgba(132, 212, 0, 0.05)`) cuando están cerradas y transiciones limpias.

---

## Verification Plan

### Automated Tests
- Ejecutar `npm run build` y `npm run type-check` para garantizar la estabilidad de la compilación de producción.

### Manual Verification
- Visualizar `http://localhost:3000/widgets/home-widget-preview.html` y validar que:
  - No existan bordes negros gruesos ni sombras sólidas.
  - Los botones se vean redondos y modernos.
  - Las transiciones del acordeón FAQ y el envío de formularios funcionen correctamente.
