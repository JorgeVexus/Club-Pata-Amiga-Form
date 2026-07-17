# Navegacion movil fija del Dashboard V2

## Objetivo

Replicar en el widget unificado la barra inferior movil del repositorio nuevo para mantener accesibles las secciones durante todo el scroll.

## Implementacion

- Ocultar la barra en escritorio y mostrarla hasta `900px`.
- Fijarla al borde inferior con fondo blanco, borde, sombra y soporte para `safe-area-inset-bottom`.
- Incluir Inicio, Peludos, Reintegros, Vet 24/7 y Centros.
- Mostrar Embajador solamente cuando la cuenta tenga ese rol.
- Marcar como activa la vista interna actual.
- Reservar espacio inferior en el contenido para evitar superposiciones.

## Verificacion

- Prueba de existencia, posicion fija, area segura, estado activo y condicion de Embajador.
- Pruebas del Dashboard V2 y sintaxis del widget.
- TypeScript, build y lint antes de solicitar commit.
