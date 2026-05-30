# Plan de Implementación: Motivos de Rechazo Predeterminados en Dashboard de Admin

Este plan detalla los cambios requeridos para añadir una lista de motivos predeterminados al modal de rechazo de miembros en el panel de administración, facilitando al comité redactar la justificación oficial de rechazo.

## User Review Required

> [!NOTE]
> Se propone integrar un menú desplegable (dropdown) con 12 motivos de rechazo predeterminados. Al seleccionar un motivo, el campo de texto se rellenará automáticamente con la estructura formal:
> `"El comité deliberó improcedente tu solicitud debido a [motivo_seleccionado]."`
>
> El administrador podrá seguir editando, agregando o personalizando el texto en la caja de comentarios libremente.

## Open Questions

*Ninguna en este momento, los requerimientos de la plantilla y los 12 motivos están claramente especificados en la solicitud.*

## Proposed Changes

### Admin Dashboard Components

---

#### [MODIFY] [RejectionModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/RejectionModal.tsx)

- Definir la lista de motivos predeterminados (12 opciones) proporcionados en el requerimiento.
- Agregar un elemento `<select>` con estilos coherentes al modal para seleccionar el motivo predeterminado.
- Al cambiar el valor seleccionado, actualizar el estado de `reason` formateando el texto seleccionado en minúsculas en el formato: `"El comité deliberó improcedente tu solicitud debido a [motivo]."`
- Permitir que el admin siga editando libremente el textarea.

#### [MODIFY] [RejectionModal.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/RejectionModal.module.css)

- Agregar estilos para el `<select>` y su contenedor, usando variables de diseño globales (`--gray-200`, `--gray-300`, `--brand-pink`, `--font-body`, etc.) para asegurar una integración visual perfecta.

---

## Verification Plan

### Automated Tests
- Ejecutar verificación de tipos y compilación con:
  - `npm run type-check`
  - `npm run build`
  - `npm run lint`

### Manual Verification
- Abrir el modal de rechazo en el dashboard de administrador localmente.
- Seleccionar una opción predeterminada del dropdown y verificar que el texto del textarea se actualiza correctamente al formato `"El comité deliberó improcedente tu solicitud debido a [motivo]."`
- Editar el texto generado en el textarea y confirmar que se conserva y permite ingresar texto adicional.
- Hacer click en cancelar y confirmar que se limpia el estado.
