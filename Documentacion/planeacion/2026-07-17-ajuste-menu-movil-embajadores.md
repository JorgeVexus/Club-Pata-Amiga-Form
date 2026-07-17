# Ajuste del menú móvil de embajadores

## Objetivo

Evitar que las cuatro pestañas del dashboard de embajadores se desborden o queden parcialmente ocultas en pantallas móviles.

## Implementación

1. Reproducir el problema mediante una prueba de regresión sobre los estilos responsive.
2. Cambiar únicamente en móvil la navegación horizontal por una cuadrícula de dos columnas iguales.
3. Hacer que cada botón pueda encogerse dentro de su celda y ocupe el ancho disponible.
4. Mantener intacta la navegación horizontal del dashboard en escritorio.
5. Ejecutar pruebas, TypeScript, build y revisión de lint antes de solicitar commit.

## Criterios de aceptación

- Los cuatro botones son visibles sin desplazamiento horizontal a 320 px o más.
- Ningún botón excede el ancho del widget.
- La pestaña activa conserva su estilo y funcionalidad.
- La presentación de escritorio no cambia.
