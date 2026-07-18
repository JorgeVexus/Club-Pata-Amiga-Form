# Ocultar código de embajador en el registro v2

## Objetivo

Ocultar temporalmente la sección visual para ingresar un código de embajador en el paso 3 del flujo de registro v2, sin eliminar su implementación ni alterar la compatibilidad con códigos guardados previamente.

## Alcance

- Incorporar una constante local que controle la visibilidad de la sección.
- Establecer la constante como desactivada por defecto.
- Condicionar únicamente el renderizado del bloque visual del código de embajador.
- Conservar los estados, efectos, validación, integración con Memberstack, API de referidos y envío del código al checkout.
- No modificar estilos ni lógica del backend.

## Comportamiento esperado

- Un usuario nuevo no verá el campo de código de embajador en el paso 3.
- El resto de la selección de plan y el checkout seguirá funcionando igual.
- Si un miembro ya tiene un código guardado, la lógica existente podrá seguir recuperándolo y procesándolo.
- Para volver a mostrar el campo bastará con activar la constante de visibilidad.

## Verificación

- Agregar una comprobación automatizada que confirme que la sección está desactivada.
- Ejecutar `npm run build`, `npm run type-check` y `npm run lint`.
- Auditar el diff para confirmar que no se eliminó la lógica de embajadores ni se afectó el checkout.
