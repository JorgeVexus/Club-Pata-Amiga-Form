# Revision del widget home y hero

## Objetivo
- Cambiar la imagen principal del hero en `public/widgets/home-widget.js` por el nuevo asset de Webflow.
- Revisar el widget por problemas inmediatos de optimizacion, responsividad, accesibilidad y seguridad.

## Alcance
- Mantener el comportamiento comercial existente de CTAs, checkout, formularios y navegacion.
- Aplicar solo ajustes de bajo riesgo en el propio widget.
- Verificar con build, type-check y lint antes de solicitar cualquier autorizacion de commit.

## Cambios previstos
- Actualizar `CONFIG.images.hero`.
- Ajustar la proporcion visual del contenedor del hero a las dimensiones reales del nuevo WebP.
- Agregar atributos de carga/decodificacion/referrer a imagenes externas.
- Mejorar foco visible, responsividad en mobile y enlaces externos inseguros detectados.
