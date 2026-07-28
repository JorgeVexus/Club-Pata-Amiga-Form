# Diseño: UI V2 y corrección de caracteres en sucursales Wellness

**Fecha:** 2026-07-27
**Estado:** Aprobado para planificación

## Objetivo

Corregir los caracteres mojibake visibles en la configuración de sucursales y actualizar su presentación para que siga la estética V2 del dashboard Wellness.

La mejora se aplicará en:

- `public/widgets/wellness-center-widget.js`.
- `src/components/WellnessForm/WellnessComplementaryForm.tsx`.

## Corrección de contenido

Se reemplazarán los textos corruptos visibles dentro del flujo afectado, incluyendo:

- `Â¿` por `¿`.
- `SÃ­` por `Sí`.
- `ClÃ­nica` por `Clínica`.
- `recepciÃ³n` por `recepción`.
- `Ã¡reas` por `áreas`.
- Otros textos mojibake encontrados en el mismo formulario React.

Las pruebas impedirán que estos patrones vuelvan a introducirse en las superficies modificadas.

## Jerarquía visual

Cada sucursal adicional conservará una tarjeta exterior y organizará su configuración en tres grupos:

1. **Servicios de esta sucursal**
2. **Beneficio para miembros**
3. **Presencia digital**

Cada grupo utilizará una superficie interna suave, encabezado corto y texto de apoyo cuando la decisión implique copiar información desde la sucursal principal.

## Selectores de decisión

Las decisiones Sí/No y las opciones de herencia se presentarán como controles segmentados:

- opción activa con fondo turquesa suave;
- borde e indicador turquesa;
- opción inactiva blanca y de bajo contraste;
- estados hover, active y focus-visible;
- área táctil mínima adecuada;
- disposición horizontal cuando exista espacio y vertical en pantallas pequeñas.

Los radios nativos seguirán presentes para conservar accesibilidad y comportamiento.

## Servicios

Los servicios continuarán como chips seleccionables:

- bordes V2 más ligeros;
- fondo blanco en reposo;
- fondo turquesa y texto blanco al seleccionar;
- espaciado uniforme;
- estados hover, presión y foco;
- ajuste natural en varias líneas.

## Color, superficies y tipografía

Se reutilizarán los tokens V2 existentes:

- crema: `#F8F5EE`;
- blanco: `#FFFFFF`;
- turquesa: `#21BCAF`;
- turquesa profundo: `#1E5D57`;
- turquesa suave: `#E5F5F2`;
- tinta: `#153F3B`;
- cuerpo: `#4E6865`;
- línea: `#ECE7DD`.

La tipografía seguirá usando Fraiche para encabezados y Outfit para controles y texto.

Las sombras serán suaves y teñidas de verde. No se agregarán gradientes ni dependencias visuales nuevas.

## Responsive

En escritorio, cada encabezado de decisión podrá compartir fila con su selector cuando resulte legible.

En móvil:

- encabezado y selector se apilarán;
- las opciones ocuparán el ancho disponible;
- los chips mantendrán ajuste flexible;
- se evitarán desbordamientos horizontales;
- el espacio vertical entre grupos será consistente.

## Interacción

Mostrar u ocultar servicios, beneficio diferente o redes propias conservará la lógica actual.

Se agregarán transiciones breves de color, borde, transformación y opacidad respetando `prefers-reduced-motion`.

No se cambiarán:

- payload;
- persistencia;
- migración;
- reglas de herencia;
- validaciones;
- endpoints.

## Pruebas y verificación

- Prueba fallida inicial para los textos mojibake relevantes.
- Prueba fallida para las nuevas clases y agrupaciones V2.
- Pruebas existentes del widget y formulario React.
- `node --check public/widgets/wellness-center-widget.js`.
- `npm run build`.
- `npm run type-check`.
- `npm run lint`.
