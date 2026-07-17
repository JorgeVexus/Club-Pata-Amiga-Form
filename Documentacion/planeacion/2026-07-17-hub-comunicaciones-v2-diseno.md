# Diseño: Hub de Comunicaciones V2

## Objetivo

Adaptar visualmente todo el Hub de Comunicaciones al estándar del Admin V2 sin modificar sus integraciones, permisos, flujos de envío ni contratos de datos.

## Alcance

- Encabezado del Hub y etiqueta de audiencia.
- Navegación entre Enviar mensaje, Plantillas, Historial y Materiales.
- Flujo completo de envío a miembros, embajadores, centros y audiencia general.
- Gestión de plantillas.
- Historial de comunicaciones.
- Gestión de materiales para embajadores.
- Estados de carga, vacío, error, selección y controles deshabilitados.
- Comportamiento responsive.

## Enfoque aprobado

Se aplicará una adaptación encapsulada por componente. Se conservará la estructura React y se actualizarán los CSS Modules de cada pantalla. No se reemplazarán componentes ni se duplicarán flujos.

## Lenguaje visual

- Fondo general crema `#f8f5ee`.
- Superficies blancas con bordes cálidos de un píxel.
- Verde petróleo para encabezados y texto principal.
- Turquesa como único acento de interacción.
- Outfit para cuerpo, controles y navegación.
- Fraiche únicamente para títulos principales.
- Radios de 12 a 20 píxeles según jerarquía.
- Sombras suaves teñidas; sin bordes negros, sombras desplazadas ni estética brutalista.
- Iconos seguros mediante CSS/SVG o caracteres estables; no se conservarán cadenas con mojibake.

## Arquitectura visual

### Encabezado

Título a la izquierda, descripción breve debajo y etiqueta de audiencia compacta. El encabezado no será una tarjeta adicional.

### Navegación

Las pestañas funcionarán como un control segmentado sobre una superficie clara. La pestaña activa usará fondo turquesa suave, contraste suficiente y foco visible.

### Enviar mensaje

En escritorio se usará una cuadrícula con formulario principal y vista previa lateral. El formulario agrupará búsqueda, modo de mensaje, plantilla, contenido y acciones con una jerarquía vertical clara. En móvil se convertirá en una sola columna.

### Plantillas

Los filtros y acciones se agruparán en una cabecera compacta. Las plantillas se presentarán con superficies ligeras y acciones secundarias discretas, conservando la edición y eliminación actuales.

### Historial

Se mantendrá la tabla y sus datos, normalizando filtros, estados, espaciado y responsive. Los estados conservarán color semántico sin bordes negros.

### Materiales

Se conservarán carga, listado, edición y eliminación. Los bloques adoptarán el mismo sistema de superficies y botones del Admin V2.

## Funcionalidad preservada

- Props `adminName`, `isSuperAdmin`, `prefill` y `audience`.
- Selección de destinatarios.
- Plantillas y mensaje libre.
- Envío de correo y apertura de WhatsApp.
- Historial y filtros.
- Operaciones de materiales para embajadores.
- Restricciones por audiencia y rol.
- Endpoints y llamadas existentes.

## Accesibilidad y responsive

- Foco visible en pestañas, botones, inputs y selects.
- Contraste legible en estados activos y deshabilitados.
- Etiquetas sobre los campos.
- Controles táctiles de al menos 40 píxeles de alto.
- Cuadrícula de una columna por debajo de 768 píxeles.
- Sin desplazamiento horizontal salvo tablas que lo requieran.

## Verificación

- Pruebas de regresión para pestañas, audiencias y montaje de componentes.
- Pruebas estáticas contra estilos brutalistas y mojibake visible.
- Type-check, lint y build completo.
- Revisión local de las cuatro pestañas antes de solicitar commit o push.

## Fuera de alcance

- Cambiar APIs o tablas de base de datos.
- Rediseñar el contenido de correos enviados.
- Alterar permisos administrativos.
- Añadir nuevos canales de comunicación.
- Reescribir el Hub con otra biblioteca de componentes.
