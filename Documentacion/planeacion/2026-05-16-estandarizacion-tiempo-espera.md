# Estandarización de Terminología: Tiempo de Espera

Este plan detalla la normalización de la terminología "Periodo de Carencia" a "tiempo de espera" en los widgets front-end para mejorar la claridad y consistencia del usuario.

## Cambios Propuestos

### Widgets de Usuario (public/widgets/)

- **pet-cards-widget.js**: Actualizar etiquetas en el modal de detalles y explicaciones dinámicas.
- **unified-membership-widget.js**: Reemplazar "periodo de espera" por "tiempo de espera" en badges y explicaciones.
- **solidarity-dashboard.js**: Cambiar estatus "En carencia" a "En espera" y etiquetas de días restantes.
- **solidarity-request-form.js**: Actualizar el estatus visual de las mascotas en el selector.
- **plan-selection-widget.js**: Actualizar mensaje de beneficio de referido.

## Verificación

- [x] Auditoría de código con grep para asegurar que no queden cadenas "Periodo de Carencia" en la interfaz.
- [x] Verificación de que la lógica interna (`calculateCarencia`) se mantiene intacta para evitar regresiones.
- [x] Ejecución de `npm run build`, `npm run type-check` y `npm run lint`.
- [x] Notificación vía Telegram.

## Impacto
- Mejora en la experiencia de usuario con terminología más amigable.
- Cero impacto en la lógica de negocio o cálculos de base de datos.
