# Plan de Refinamiento del Widget de Membresía Unificado

Este plan aborda la inconsistencia en los banners de alerta, restaura la funcionalidad del botón de carga de documentos y optimiza el diseño del modal de actualización para alinearlo con el sistema neo-brutalista del proyecto.

## Cambios Propuestos

### Componente Unified Membership Widget

#### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)

1.  **Refinar Lógica de Alertas (`renderAlertBanners`)**:
    *   Utilizar `this.isSenior(pet)` para determinar si una mascota requiere certificado médico (10+ años).
    *   Asegurar que si faltan ambos (foto y certificado), se muestren ambos puntos en la lista.
    *   Mejorar el estilo del banner `pata-orange-alert` para que sea más "premium" y neo-brutalista.
    *   Garantizar que el botón "subir documentos ahora" tenga el ID correcto y sea prominente.

2.  **Optimizar Modal de Actualización (`renderUpdateModal`)**:
    *   Aplicar bordes de 4px (`var(--pata-border-thick)`) y radios de 50px.
    *   Constreñir los previews de las imágenes (`.pata-upload-preview`) para que no excedan el tamaño del modal.
    *   Mejorar la disposición de los campos de carga para que sean consistentes con el resto del sitio.

3.  **Corrección de Eventos (`attachEvents`)**:
    *   Asegurar que el listener para `pata-btn-open-update-cert` se asigne correctamente cada vez que se renderice el dashboard.

4.  **Sincronización de Métodos Auxiliares**:
    *   Actualizar `checkMissingDocs` para incluir la validación de certificado médico para mascotas senior, manteniendo la consistencia en todo el widget.

## Plan de Verificación

### Pruebas Manuales
1.  **Simulación de Mascota Senior sin Documentos**: Verificar que aparezcan ambos avisos (foto y certificado) y el botón de acción.
2.  **Interacción con Modal**: Abrir el modal, subir una imagen y un PDF, verificar que el preview no rompa el diseño y que el botón de cerrar funcione.
3.  **Flujo de Guardado**: Completar la carga y verificar que se llame a los endpoints `/api/upload/pet-photo` y `/api/user/pets/.../update`.
4.  **Validación de Edad**: Cambiar la edad de la mascota a menos de 10 años y verificar que el aviso de certificado médico desaparezca.

## Documentación
*   Actualizar el changelog diario después de completar los cambios.
*   Notificar por Telegram una vez que los cambios estén listos para revisión.
