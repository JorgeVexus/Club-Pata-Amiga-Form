# Edicion de informacion complementaria en pet-cards-widget

## Objetivo

Permitir que las personas editen desde el modal de `pet-cards-widget.js` la informacion complementaria de cada mascota: genero, color de ojos, color de nariz, color de pelo y cumpleanos.

## Alcance

- Agregar un boton `Editar informacion de {nombre}` dentro de la tarjeta `Informacion General`.
- Mostrar un formulario inline dentro del modal, sin abrir un segundo modal.
- Permitir modificar el cumpleanos aunque ya exista una fecha guardada.
- Reutilizar `/api/user/pets/{petId}/update`, que ya acepta `gender`, `coatColor`, `noseColor`, `eyeColor`, `birthMonth` y `birthYear`.
- Mantener la vista responsive en movil con campos en una columna y botones de ancho completo.

## Archivos

- `public/widgets/pet-cards-widget.js`: UI del modal, formulario inline, guardado y estilos responsive.
- `tests/pet-cards-widget-complementary-edit.test.mjs`: prueba estatica para asegurar que el widget expone el flujo de edicion y envia los campos esperados.

## Plan de implementacion

1. Crear prueba estatica que falle con el widget actual.
2. Agregar estilos para encabezado editable, formulario inline, grilla responsive y acciones de guardado/cancelacion.
3. Reemplazar la edicion limitada de cumpleanos por un formulario de informacion complementaria.
4. Agregar metodos del widget para renderizar, cancelar y guardar el formulario.
5. Validar mes, ano y campos requeridos antes del `fetch`.
6. Refrescar datos y reabrir el modal de la mascota tras guardar.
7. Ejecutar prueba especifica, `npm run build`, `npm run type-check` y `npm run lint`.

## Criterios de aceptacion

- El modal muestra `Editar informacion de {nombre}`.
- La informacion general se ve igual en modo lectura.
- Al editar, se pueden actualizar genero, color de pelo, color de nariz, color de ojos y cumpleanos.
- Cumpleanos se puede cambiar aunque ya tenga mes y ano guardados.
- En movil no hay desbordes horizontales y las acciones son faciles de tocar.
