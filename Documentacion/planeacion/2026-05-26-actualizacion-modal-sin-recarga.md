# Plan: Actualización del Dashboard Admin en Tiempo Real (Sin Recarga)

## Objetivo
Optimizar el flujo de trabajo en el panel de administración para que las aprobaciones, rechazos y actualizaciones de información de miembros y mascotas se realicen e impacten la interfaz en tiempo real sin recargar la página (`window.location.reload()`) y sin cerrar el modal de detalles, agilizando el proceso de revisión consecutiva de solicitudes.

---

## Cambios Propuestos

### 1. Sistema de Refresco en Tiempo Real (Prop `refreshKey`)
Implementar una propiedad reactiva `refreshKey` que actúe como trigger de refresco para las tablas de solicitudes y métricas del dashboard sin forzar una recarga total de la ventana.

#### [MODIFY] [RequestsTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/RequestsTable.tsx)
*   Añadir la propiedad opcional `refreshKey?: number` a `RequestsTableProps`.
*   Agregar `refreshKey` a la lista de dependencias del `useEffect` que carga las solicitudes (`loadRequests`) y las estadísticas (`loadStats`).

#### [MODIFY] [WellnessCentersTable.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/WellnessCentersTable.tsx)
*   Añadir la propiedad opcional `refreshKey?: number` a la interfaz `Props`.
*   Agregar `refreshKey` a la lista de dependencias de los `useEffect` que cargan las estadísticas (`loadStats`) y los centros (`fetchCenters`).

---

### 2. Actualización de Acciones en el Dashboard Principal

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/AdminDashboard.tsx)
*   Definir un estado reactivo `const [refreshKey, setRefreshKey] = useState(0)` en `DashboardContent`.
*   Pasar `refreshKey` a `<RequestsTable>` y `<WellnessCentersTable>`.
*   Implementar una función helper `triggerRefresh()` que:
    1.  Incremente `refreshKey` (`setRefreshKey(prev => prev + 1)`).
    2.  Recargue las métricas (`loadMetrics`).
    3.  Recargue el feed de actividades (`loadActivityLogs`).
    4.  Recargue los contadores pendientes (`loadPendingCounts`).
*   Reemplazar las llamadas a `window.location.reload()` en los callbacks de `RequestsTable` (`onApprove`, `onReject`, `onDelete`) por la llamada a `triggerRefresh()`.
*   En `MemberDetailModal`:
    *   Cambiar `onDataChange={() => window.location.reload()}` por `onDataChange={triggerRefresh}`.
    *   En `onApprove`, realizar la petición, y al tener éxito: alertar, ejecutar `triggerRefresh()`, y llamar a `fetchMemberDetails(id, setSelectedMember)` para refrescar los detalles del miembro dentro del modal sin cerrarlo.
    *   En `onReject`, evitar cerrar el modal inmediatamente configurando `setMemberToReject(selectedMember)`.
*   En `RejectionModal`:
    *   En `onConfirm`, al tener éxito: alertar, cerrar el modal de rechazo (`setMemberToReject(null)`), cerrar el modal de detalles (`setSelectedMember(null)`), y refrescar el dashboard con `triggerRefresh()`.

---

### 3. Ajustes de Notificación en el Modal de Detalles

#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)
*   En `sendPetResponse` (línea 293+), llamar a `onDataChange()` si la petición es exitosa para que la tabla principal se actualice en segundo plano cuando se envíe una respuesta de apelación.

---

## Plan de Verificación

### Pruebas Manuales
1.  Abrir el Dashboard Admin y seleccionar un miembro en estado `pending` o `appealed`.
2.  Aprobar o rechazar una mascota individual dentro del modal de detalles.
3.  **Verificar:** El modal permanece abierto, el estado de la mascota cambia visualmente a `Aprobada`/`Rechazada` inmediatamente, y al cerrar el modal manualmente, la tabla de fondo refleja el cambio sin que la página se haya recargado.
4.  Aprobar un miembro completo desde el modal de detalles.
5.  **Verificar:** El miembro se actualiza, la tabla en el fondo se refresca, las métricas se actualizan sin recarga total.
