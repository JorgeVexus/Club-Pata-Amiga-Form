# Diseño del registro V2 de Centros de Bienestar

## Objetivo

Adaptar `/bienestar/registro` al sistema visual aprobado para el registro V2 de membresías y el registro de Embajadores, sin modificar la lógica funcional del alta de Centros de Bienestar.

## Alcance

La adaptación cubre las cuatro vistas que ya administra `WellnessForm`:

1. Solicitud inicial del centro.
2. Confirmación de solicitud enviada.
3. Captura de información complementaria.
4. Confirmación de información completa.

También incluye validaciones, estados de carga, mensajes de error, selector de servicios, términos, uploads, mapa, sucursales y comportamiento responsive.

## Dirección visual aprobada

- Fondo crema `#FAF7F1` en toda la ruta.
- Navbar blanca compacta con identidad de Pata Amiga.
- Contenedor centrado de ancho moderado y tarjeta blanca de radio `20px`.
- Tipografía Fraiche para títulos y Outfit para interfaz y contenido.
- Turquesa `#1CBCAD` como acción principal y verde oscuro `#1E5350` para encabezados.
- Bordes cálidos `#E4DFD3`, sombras tenues y ausencia de bordes negros o sombras duras.
- Indicador de progreso común para Solicitud, Información del centro y Revisión.
- Inputs de altura consistente, radio medio, foco visible y mensajes inline.
- Selector de servicios con estados normal, hover, focus y seleccionado.
- Botones con estados hover, pressed, loading y disabled.
- En móvil, progreso segmentado, tarjeta compacta y controles de ancho completo.

## Arquitectura de presentación

La página será responsable del fondo, navbar, encabezado y superficie principal. `WellnessForm` continuará administrando sus vistas y estado interno, pero expondrá la etapa actual mediante una composición visual consistente dentro del mismo componente.

Los cambios de JSX se limitarán a elementos presentacionales y semánticos necesarios para encabezados, progreso, agrupación de contenido y accesibilidad. Los estilos permanecerán en los CSS Modules existentes.

## Protección funcional

- Mantener `checkWellnessEmailAvailability` y `/api/wellness` sin cambios.
- Mantener payloads, validaciones, callbacks y transiciones de vista.
- Mantener `TermsModalEnhanced` y su aceptación automática.
- Mantener `WellnessComplementaryForm`, uploads, Google Maps, sucursales y persistencia.
- Mantener la ruta de inicio de sesión existente.
- No agregar librerías ni dependencias.

## Estados y errores

- La validación seguirá mostrándose junto al campo correspondiente.
- La verificación de correo conservará indicadores de carga y disponibilidad.
- Los errores generales aparecerán en un bloque accesible dentro de la tarjeta.
- Los botones conservarán su bloqueo durante envíos para evitar duplicados.
- Las confirmaciones utilizarán la misma superficie, tipografía y progresión del flujo.

## Verificación

- Pruebas de caracterización para proteger endpoints, validaciones y transiciones.
- Auditoría de diff para descartar cambios funcionales accidentales.
- Revisión visual local de las cuatro vistas en escritorio y móvil.
- `npm run build`.
- `npm run type-check`.
- `npm run lint`.

## Criterios de aceptación

El registro de Centros de Bienestar debe sentirse parte del mismo flujo que Registro V2 y Embajadores. Todas las capacidades existentes deben seguir disponibles y la experiencia debe ser clara y responsive desde la solicitud inicial hasta la confirmación final.
