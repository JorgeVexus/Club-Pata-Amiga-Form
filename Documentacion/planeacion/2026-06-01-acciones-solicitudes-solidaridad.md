# Plan de Implementación: Acciones y Baja de Solicitudes de Apoyo (Fondo Solidario)

Este plan detalla la propuesta para agregar un panel de acciones rápidas para administradores en el dashboard de Fondo Solidario, permitiéndoles aprobar, rechazar, marcar como pagado, completar o cancelar solicitudes de forma intuitiva. También se define un nuevo estado de cancelación (`cancelled`) y se configuran las notificaciones necesarias.

## 1. Definición de Estados de Solicitud de Apoyo

Para tener un control preciso del ciclo de vida de las solicitudes, utilizaremos los siguientes estados:
- `new` (Nuevo): Solicitud recién creada por el usuario.
- `in_review` (En revisión): Comité/Admin revisando los detalles.
- `needs_info` (Acción Requerida): Solicita más información al usuario.
- `approved` (Aprobado): Aprobado por el comité (monto aprobado asignado).
- `rejected` (Rechazado): Rechazado por el comité por no cumplir las reglas.
- `cancelled` (Cancelado): Cancelado voluntariamente o por error administrativo.
- `paid` (Reembolsado): Pago/reembolso manual registrado con éxito (solo `reimbursement`).
- `scheduled` (Agendado): Cita agendada con la veterinaria aliada (solo `allied_center_appointment`).
- `completed` (Finalizado): Caso cerrado y concluido satisfactoriamente.

---

## Cambios Propuestos

### 1. Tipos de TypeScript

#### [MODIFY] [solidarity.types.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/types/solidarity.types.ts)
- Agregar `'cancelled'` a la unión `SolidarityRequestStatus`.
- Agregar `'cancelled': 'Cancelado'` a `SOLIDARITY_STATUS_LABELS`.

---

### 2. Backend API Routes

#### [MODIFY] [update/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/solidarity/update/route.ts)
- Actualizar el mapeo de notificaciones (`statusMap`) para incluir los nuevos mensajes:
  - `cancelled`: `'ha sido cancelada'`
  - `completed`: `'ha sido finalizada'`
- Enviar notificaciones de manera consistente a la tabla `notifications` según corresponda.

#### [MODIFY] [list/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/solidarity/list/route.ts)
- Ajustar el filtrado por estados agrupados en la API del listado de solicitudes:
  - `status === 'approved'` -> Traer `['approved', 'paid', 'scheduled', 'completed']` (Aprobados, pagados, agendados, finalizados).
  - `status === 'rejected'` -> Traer `['rejected', 'cancelled']` (Rechazados y cancelados).

#### [MODIFY] [balance/route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/solidarity/balance/route.ts)
- Excluir solicitudes con estado `'cancelled'` (además de `'rejected'`) del cálculo del saldo solidario usado de la mascota durante el año actual.

---

### 3. Frontend & Admin Dashboard UI

#### [MODIFY] [SolidarityDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Solidarity/SolidarityDashboard.tsx)
- Actualizar la firma de estados en los tipos internos del componente.
- Añadir el badge visual para el estado `cancelled` en `getStatusBadge` (fondo gris claro, texto gris oscuro).
- Ajustar los filtros dinámicos si se requiere.

#### [MODIFY] [SolidarityRequestDetail.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Solidarity/SolidarityRequestDetail.tsx)
- Actualizar `handleUpdateStatus` para recibir un tercer parámetro opcional `approvedAmount` y enviarlo en el body de la petición POST.
- Reemplazar el select de estado genérico y el botón simple por un **Panel de Acciones del Administrador** en el sidebar (`infoSection`) renderizado de forma elegante:
  * Si el estado es `new`, mostrar: **Iniciar Revisión** (cambia a `in_review`), **Rechazar** (promete motivo, cambia a `rejected`), **Cancelar** (promete motivo, cambia a `cancelled`).
  * Si el estado es `in_review` o `needs_info`, mostrar: **Solicitar Información** (promete mensaje, cambia a `needs_info`), **Aprobar** (promete monto, cambia a `approved`), **Rechazar** (motivo -> `rejected`), **Cancelar** (motivo -> `cancelled`).
  * Si el estado es `approved` y el tipo es `reimbursement` (reembolso), mostrar: **Marcar como Pagado** (cambia a `paid`), **Finalizar Caso** (cambia a `completed`), **Cancelar** (motivo -> `cancelled`).
  * Si el estado es `approved` y el tipo es `allied_center_appointment` (cita), mostrar: **Agendar Cita** (cambia a `scheduled`), **Finalizar Caso** (cambia a `completed`), **Cancelar** (motivo -> `cancelled`).
  * Si el estado es `paid` o `scheduled`, mostrar: **Finalizar Caso** (cambia a `completed`), **Cancelar** (motivo -> `cancelled`).
  * Si el estado es `completed`, `rejected` o `cancelled`, mostrar un mensaje informativo con el estado actual ya cerrado sin botones de acción (excepto el botón de Cerrar).

#### [MODIFY] [SolidarityRequestDetail.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Solidarity/SolidarityRequestDetail.module.css)
- Agregar clases para el contenedor del panel de acciones (`.adminActionsCard`, `.adminActionsLabel`, `.actionButtonGroup`).
- Agregar estilos para los botones Neo-brutalistas individuales según la acción (Aprobar: verde, Rechazar: rojo/rosa, Cancelar: gris oscuro/negro, Pagado: azul, Finalizar: turquesa, etc.).

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` y `npm run build` para asegurar la compilación perfecta.
- Ejecutar `npm run lint` para el análisis de calidad estático.

### Pruebas Manuales
1. Crear una solicitud de apoyo como miembro (tipo reembolso y cita).
2. Abrir la solicitud en el dashboard administrativo y probar las transiciones utilizando los botones:
   - Iniciar Revisión.
   - Solicitar Información (comprobar que agrega el mensaje automático al chat y cambia a Acción Requerida).
   - Aprobar Apoyo (comprobar que solicita el monto, actualiza el valor y estado a Aprobado).
   - Marcar como Pagado (reembolso) o Agendar (cita).
   - Finalizar / Completar.
   - Rechazar o Cancelar.
3. Verificar que cada transición inserte una notificación en la base de datos para el usuario.
4. Validar que la consulta de saldo (`/api/solidarity/balance`) ignore correctamente las solicitudes en estado `cancelled`.
