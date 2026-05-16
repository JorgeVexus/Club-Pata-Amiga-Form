# Plan de Implementación: Sistema de Baja de Mascotas

Este plan detalla la implementación de la funcionalidad de "Solicitar Baja" para mascotas en los widgets de membresía y el dashboard administrativo, incluyendo la lógica de automatización para casos de fallecimiento en el Fondo Solidario.

## Cambios Propuestos

### 1. Tipos y Modelos de Datos

#### [MODIFY] [pet.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/pet.types.ts)
- Agregar campos `unsubscriptionReason`, `unsubscriptionDescription` y `unsubscriptionDate` a la interfaz `PetFormData`.

### 2. Backend / API

#### [NEW] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/user/pets/unsubscribe/route.ts)
- Crear endpoint para procesar la baja de una mascota.
- Validar sesión del usuario.
- Actualizar campos en Memberstack:
    - `pet-X-is-active`: "false"
    - `pet-X-unsubscription-reason`: Razón seleccionada.
    - `pet-X-unsubscription-description`: Descripción adicional (si aplica).
    - `pet-X-unsubscription-date`: Fecha actual.
- Opcionalmente, registrar en una tabla de auditoría en Supabase si se desea historial detallado.

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/solidarity/update/route.ts)
- Al aprobar una solicitud (`status === 'approved'`) de tipo fallecimiento (`benefit_type === 'death'`), invocar automáticamente la lógica de baja para la mascota asociada.

### 3. Widgets (Frontend)

#### [MODIFY] [pet-cards-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/pet-cards-widget.js)
- **UI**: Agregar botón "Solicitar baja de este peludito" en el modal de detalle de la mascota.
- **Flujo de Baja**:
    1. Mostrar modal de selección de razón (Fallecimiento, Ya no vive conmigo, Otra).
    2. Si selecciona "Otra", mostrar campo de texto.
    3. Mostrar mensaje de confirmación emocional: *"¿Proceder a confirmar baja de [Nombre]? Recuerda que el tiempo de espera es por peludo y que con esta acción podrás proteger a otro de tus peludos"*.
    4. Llamar al nuevo API de unsubscription.
- **Visual**: 
    - Aplicar filtro CSS `grayscale(100%)` a la foto si la mascota no está activa.
    - Deshabilitar interacciones en mascotas inactivas.
    - Habilitar el slot vacío ("Add Pet") si hay espacio disponible tras la baja.

#### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)
- Sincronizar la lógica de visualización de mascotas inactivas (fotos en B/W).
- Agregar el botón de baja si es pertinente en este widget también.

#### [MODIFY] [solidarity-dashboard.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/solidarity-dashboard.js)
- Asegurar que las mascotas dadas de baja se visualicen correctamente y no permitan nuevas solicitudes de apoyo.

## Plan de Verificación

### Pruebas Manuales
1. **Flujo de Usuario**: 
    - Entrar al dashboard de mascotas.
    - Seleccionar una mascota y hacer clic en "Solicitar Baja".
    - Completar el flujo y verificar que la foto se vuelve blanco y negro.
    - Verificar que aparece un nuevo espacio para agregar otra mascota.
2. **Flujo Administrativo (Fallecimiento)**:
    - Crear una solicitud de apoyo por fallecimiento en el dashboard solidario.
    - Desde el panel de admin, aprobar la solicitud.
    - Regresar al dashboard de usuario y verificar que la mascota se dio de baja automáticamente.

### Verificación Técnica
- Validar en el dashboard de Memberstack que los campos `pet-X-is-active` se actualizan correctamente.
- Verificar que los estilos CSS de `grayscale` se aplican correctamente en mobile y desktop.
