# Plan de Implementación: Normalización de Terminología y Ajustes UI

Este plan detalla los cambios realizados para estandarizar el término "Periodo de Carencia" a "tiempo de espera" en toda la plataforma y realizar ajustes estéticos en el chat del widget unificado.

## Objetivos
1. Reemplazar todas las menciones de "Periodo de Carencia" por "tiempo de espera" en etiquetas orientadas al usuario.
2. Mantener la integridad de la lógica interna y nombres de funciones (ej. `calculateCarencia`).
3. Mejorar la legibilidad del chat en el modal de detalles del widget unificado agregando espaciado entre el mensaje del administrador y las acciones solicitadas.

## Cambios Propuestos

### Componentes UI y Widgets
- **`public/widgets/unified-membership-widget.js`**:
  - Actualizar etiquetas en el dashboard de detalles de mascotas.
  - Actualizar mensajes de estado de membresía.
  - Agregar un salto de línea (`<br>`) en el componente de chat para separar el mensaje del administrador de los botones de acción.
- **`src/app/registro-v1/confirmacion/page.tsx`**:
  - Cambiar "El período de carencia comienza hoy" por "El tiempo de espera comienza hoy".
- **`src/app/reporte-mvp/page.tsx`**:
  - Actualizar descripciones del flujo de registro y estados de protección.
- **`src/app/test-notifications/page.tsx`**:
  - Actualizar etiquetas de botones de prueba de notificaciones.

### Lógica de Negocio y Servicios
- **`src/services/pet.service.ts`**:
  - Actualizar comentarios de JSDoc y documentación interna.
  - Normalizar mensajes generados por el servidor para notificaciones y explicaciones.

## Verificación
- Revisión manual de las etiquetas en los widgets.
- Verificación visual del espaciado en el chat del modal.
- Asegurar que no se hayan renombrado variables de base de datos o funciones críticas.
