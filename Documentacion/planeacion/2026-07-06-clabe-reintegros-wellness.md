# Plan - CLABE para reintegros wellness

## Objetivo
Capturar los datos bancarios donde Pata Amiga realizara reintegros al Centro de Bienestar y agregar texto contextual al modal de gestion de citas.

## Alcance
- Agregar `bank_name`, `bank_clabe` y `bank_holder` a `wellness_centers`.
- Mostrar los campos en la pantalla complementaria posterior al registro wellness.
- Mostrar los campos en el formulario editable del widget wellness, usado en revision y aprobado.
- Enviar los datos por `/api/wellness/update`.
- Agregar descripcion al modal de Gestion de Citas.

## Verificacion
- `tests/wellness-bank-details-and-appointments-copy.test.mjs`.
- Pruebas wellness relacionadas.
- `npm run type-check`, `npm run lint` y `npm run build`.
