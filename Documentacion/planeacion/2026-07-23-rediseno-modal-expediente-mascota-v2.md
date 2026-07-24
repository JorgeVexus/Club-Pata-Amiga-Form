# Plan: rediseño v2 del modal de expediente de mascota

## Objetivo

Modernizar el modal que se abre desde "Ver expediente" en las cards de mascotas del dashboard unificado, eliminando el lenguaje visual brutalista y alineándolo con la estética v2 ya usada en el dashboard.

## Alcance

- Mantener la lógica existente de apertura/cierre, chat, acciones de documentos, baja de mascota y notificaciones.
- Añadir clases v2 propias para el modal de expediente.
- Reemplazar las señales visuales antiguas: bordes negros gruesos, sombras duras, botones con borde negro y badges flotantes de estilo brutalista.
- Conservar los ids usados por el flujo actual: `pata-pet-details-modal`, `pata-close-details`, `pata-close-details-btn` y `pata-chat-root`.
- Agregar prueba de regresión en `tests/widgets/unified-membership-dashboard-v2.test.js`.

## Enfoque

1. Crear una prueba que falle mientras el modal no use wrappers v2 y siga mostrando patrones brutalistas.
2. Añadir estilos aislados dentro de `V2_STYLES` para el modal de expediente.
3. Actualizar `renderPetDetailsModal` con la nueva estructura visual sin tocar la lógica de datos.
4. Ejecutar pruebas focalizadas y verificación obligatoria del proyecto antes de pedir autorización de commit/push.

## Riesgos

- El widget público mezcla estilos legacy y v2; por eso el rediseño se encapsula bajo `pata-v2-pet-detail-modal`.
- El chat y las acciones dependen de ids existentes; no se renombran.

## Ajuste responsive posterior

- Sustituir el acordeón móvil duplicado por la ficha general completa y siempre visible.
- Hacer desplazable el panel completo en móvil con una altura máxima basada en `100dvh`.
- Mostrar una sola galería responsive para evitar que las reglas legacy oculten información.
- Modernizar las tarjetas de tiempo de espera e historial de comunicación bajo el mismo lenguaje V2.
- Mantener los ids y eventos del chat, carga de archivos, acciones solicitadas y cierre del expediente.
