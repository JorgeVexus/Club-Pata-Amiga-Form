# Plan de Implementación: Ampliación de Reporte (Miembros sin Plan y Test Mode)

Este plan detalla los cambios necesarios para que el reporte de miembros del Club Pata Amiga en el panel de administración refleje todos los miembros registrados en Memberstack (incluyendo a los que no tienen un plan de suscripción pagado) y cruce datos con el entorno de pruebas (Test Mode / Sandbox) desde producción.

---

## User Review Required

> [!IMPORTANT]
> **Cambios en el Alcance del Reporte**:
> 1. **Miembros sin Plan**: Se eliminará el filtro estricto de plan en el backend para permitir la visualización de los más de 300 miembros registrados que aún no han adquirido la membresía. Se clasificarán con el estatus "Sin Plan".
> 2. **Cuentas de Test Mode en Producción**: Dado que Memberstack aísla los entornos de Sandbox y Live a nivel de API Keys, se implementará una consulta dual en el servidor utilizando tanto la clave de producción como la clave de pruebas (`MEMBERSTACK_TEST_ADMIN_SECRET_KEY` o un fallback local/sandbox en el backend) para fusionar ambos conjuntos de datos en producción.
> 3. **Mapeo de Estados**:
>    - Si el miembro no tiene el plan `pln_club-pata-amiga-9o2k00j6m` en sus conexiones, se le asignará el estatus `none` ("Sin Plan").
>    - Su costo se mostrará como `—` (sin costo).
>    - Su KPI correspondiente se incrementará bajo la tarjeta "Sin Suscripción".

---

## Proposed Changes

### Backend (API Route)

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/reports/plan-members/route.ts)
* Crear la función auxiliar `fetchMembersWithKey(apiKey)` que realiza la consulta paginada de miembros en la API REST de Memberstack de manera independiente.
* En el endpoint `GET`:
  * Identificar si la API Key configurada por defecto (`MEMBERSTACK_ADMIN_SECRET_KEY`) es de prueba (empieza con `sk_sb_`).
  * Consultar a Memberstack con la clave principal. Si es una clave de producción (`sk_...`), realizar adicionalmente una consulta usando la clave de prueba (obtenida de `process.env.MEMBERSTACK_TEST_ADMIN_SECRET_KEY` o utilizando la clave de pruebas del proyecto `sk_sb_4bd4a70ab26be68d67c5` como fallback seguro).
  * Fusionar ambas listas marcando adecuadamente `isTest: true` o `isTest: false`.
  * **Eliminar el filtro de plan** para procesar a todos los miembros recuperados de ambos entornos.
  * Mapear a los usuarios sin plan con el estatus `none`, y calcular su periodicidad e importe como `0`.
  * Agregar `noPlanCount` a las métricas devueltas en la respuesta JSON.

### Frontend (UI Components)

#### [MODIFY] [PlanMembersReport.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/PlanMembersReport.tsx)
* Modificar `getStatusLabel` para devolver `"Sin Plan"` cuando el estado sea `none`.
* Modificar `getStatusBadgeClass` para devolver `styles.noPlan` cuando el estado sea `none`.
* Añadir un selector de estatus adicional `"none"` con la etiqueta `"Sin Plan"` al filtro desplegable.
* Agregar una sexta tarjeta KPI en la parte superior que muestre el total de miembros "Sin Suscripción / Plan".
* Actualizar el generador de CSV para que soporte la exportación de miembros con estatus `none` y su respectiva información vacía de plan.

#### [MODIFY] [Reports.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/Reports.module.css)
* Agregar la regla `.badge.noPlan` para estilizar los estados sin plan con un color gris/neutral con borde sutil.

---

## Verification Plan

### Pruebas de Compilación
* Ejecutar `npm run type-check` para validar la integridad de TypeScript.
* Ejecutar `npm run build` para asegurar la compilación correcta.

### Verificación del Flujo
1. Ingresar al panel de administración en la sección **Reporteo > Miembros Club Pata Amiga**.
2. Validar que la cifra de "Miembros Registrados" ahora sea coherente con el total (300+ en producción y 22 en pruebas combinados).
3. Confirmar la aparición de la tarjeta KPI **"Sin Suscripción / Plan"** y que el listado contenga registros con el estatus "Sin Plan".
4. Verificar que se carguen correctamente las 22 cuentas de Test Mode con la insignia **"Prueba"** y fila con estilo correspondiente.
5. Filtrar por estatus "Sin Plan" y comprobar que solo se listen dichos miembros.
6. Exportar a CSV y verificar que las columnas de costo, periodicidad y estatus se exporten correctamente.
