# Registro de nueva mascota desde Dashboard V2

## Objetivo

Conectar los accesos de Inicio y Mis peludos con el formulario funcional de alta que ya utiliza `pet-cards-widget.js`, evitando la navegación relativa que produce un 404 en Webflow.

## Implementación

- Sustituir los enlaces por botones que llamen a `openAddPetFormV2()`.
- Respetar el máximo de tres mascotas activas antes de abrir el formulario.
- Reutilizar `window.ManadaWidget.showAddForm()` cuando ya esté disponible.
- Cargar `pet-cards-widget.js` bajo demanda y montarlo en un contenedor auxiliar oculto cuando no esté presente.
- Emitir un evento al completar el registro para que el dashboard unificado recargue sus mascotas sin abandonar la página.
- Mantener el registro y las validaciones existentes en `/api/user/pets/add`.

## Verificación

- Prueba de regresión para ambos accesos, carga bajo demanda, límite de mascotas y actualización posterior.
- Pruebas del Dashboard V2 y Pet Cards.
- TypeScript, lint y build de producción.
