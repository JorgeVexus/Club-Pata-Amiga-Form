# Plan de Implementación - Visibilidad del Botón Fondo Solidario (Embed en Webflow)

Este plan detalla la lógica y la integración de un script para Webflow (formato custom code o embed) que muestra de forma dinámica el botón `#fondo` si el miembro con sesión activa tiene al menos una mascota aprobada que haya cumplido su tiempo de espera.

## Objetivo
Implementar un script que pueda colocarse de forma directa en un embed HTML de Webflow o cargarse desde `/widgets/solidarity-button-visibility.js` para realizar el cálculo de carencia del lado del cliente de forma fluida.

## Cambios Propuestos

### [NEW] [solidarity-button-visibility.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-button-visibility.js)
- Escribir el script con soporte para reintentos de inicialización de Memberstack.
- Incluir la lógica unificada de cálculo de carencia (180, 150, 120 o 90 días).
- Validar las condiciones: mascota aprobada (`status === 'approved'`), activa (`is_active !== false`) y sin carencia (`daysRemaining <= 0`).

## Verificación
- Validar tipo y formato mediante:
  - `npm run type-check`
  - `npm run lint`
  - `npm run build`
