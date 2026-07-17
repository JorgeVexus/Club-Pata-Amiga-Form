# Elegibilidad de mascotas en Reintegros

## Objetivo

Alinear el formulario de Reintegros con el tiempo de espera mostrado en Mis peludos.

## Regla

Una mascota solo puede seleccionarse si:

1. no esta dada de baja;
2. su estado es aprobado;
3. `calculateCarencia(pet).isWaiting` es falso.

Las mascotas en tiempo de espera permanecen visibles, deshabilitadas y muestran cuantos dias faltan. Si no existe ninguna mascota elegible, el formulario no selecciona mascota y deshabilita el envio.

## Defensa en profundidad

La API `/api/solidarity/request` conserva su validacion con `isPetActive`, por lo que una manipulacion manual del formulario tampoco permite saltarse el tiempo de espera.

## Verificacion

- Prueba de regresion para la regla visual.
- Prueba de estado `Faltan N dias`.
- Prueba de codificacion para impedir que `d&iacute;as` se muestre como texto literal despues de `escapeHtml`.
- Prueba de envio deshabilitado sin mascotas elegibles.
- Pruebas de widgets, sintaxis, type-check, build y lint.
