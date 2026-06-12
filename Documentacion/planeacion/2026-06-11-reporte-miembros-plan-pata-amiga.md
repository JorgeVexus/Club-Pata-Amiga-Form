# Plan de Implementación: Reporte de Miembros de Plan Pata Amiga

Este plan detalla el diseño técnico y de interfaz de usuario para agregar un nuevo reporte enfocado en los miembros del plan de Memberstack **`pln_club-pata-amiga-9o2k00j6m`** en el panel de administración, bajo la sección de **Reporteo**.

---

## User Review Required

> [!IMPORTANT]
> **Planificación de Campos de Memberstack y Stripe**:
> 1. El ID del plan a consultar será fijado como `pln_club-pata-amiga-9o2k00j6m`.
> 2. Los estatus del plan se mapearán de Memberstack a etiquetas legibles en español:
>    - `active` / `trialing` $\rightarrow$ **Activo** (Verde)
>    - `canceled` / `cancelled` $\rightarrow$ **Cancelado** (Gris/Rojo)
>    - `past_due` / `unpaid` $\rightarrow$ **Requiere Pago** (Naranja)
> 3. El costo y periodicidad se extraerán dinámicamente de `planConnections[].payment.amount` y del intervalo (`interval`), cayendo en un fallback estándar si no vienen definidos (por ejemplo, mensualidad de $159 MXN o anualidad de $1,699 MXN).

---

## Opciones Adicionales y Cruce de Base de Datos (Origen y Modo de Prueba)

Para hacer de este reporte una herramienta de inteligencia verdaderamente premium, cruzaremos la información con la base de datos de Supabase para obtener y filtrar por:

1. **Origen del Registro (Rol/Tipo)**:
   - Identificar si la solicitud proviene de un **Miembro Regular** o de un **Embajador** que pagó la membresía.
   - Esto se determinará verificando si el correo electrónico del miembro existe en la tabla `ambassadors` o si el campo `registration-source` en Memberstack es `'Embajador'`.
2. **Método de Captación (Referido vs. Directo)**:
   - Identificar si el miembro se registró de forma directa o si fue **Referido por un Embajador**.
   - Esto se determinará verificando el campo `users.ambassador_code` (o en la tabla `referrals`). Si contiene un código válido, se marca como "Referido" y se muestra el código/nombre del embajador. De lo contrario, se marca como "Registro Directo".
3. **Identificación de Cuentas y Correos de Prueba (Test Mode)**:
   - Identificar los miembros creados en el **Modo de Prueba** de Memberstack (`isTest: true` o con correos con patrones de prueba como `@example.com`).
   - Cruzar con Supabase para obtener el `crm_contact_id` y mostrar si fueron enviados al CRM LynSales, permitiendo una fácil identificación de las cuentas de prueba antes de eliminarlas.
4. **Detalle de Mascotas**: Mostrar el número total de mascotas registradas por cada miembro, permitiendo verificar si completaron su registro de mascotas.
5. **Detalles de Cancelación**: Para miembros con estatus "Cancelado", consultar la tabla `membership_cancellations` en Supabase para obtener el motivo de cancelación (`cancellation_reason`), la fecha de efectividad y cualquier comentario escrito por el usuario.
6. **Resumen Financiero (KPIs)**: Tarjetas de métricas superiores mostrando el número de miembros activos, cancelados, pendientes de pago, estimación de ingresos mensuales recurrentes (MRR) e ingresos anuales recurrentes (ARR) derivados de este plan específico.

---

## Proposed Changes

### Backend (API Routes)

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/services/memberstack-admin.service.ts)
Añadir el campo `isTest` al tipo `MemberstackMember` para recibirlo de la API de Memberstack:
```typescript
export interface MemberstackMember {
    id: string;
    auth: {
        email: string;
    };
    customFields: Record<string, any>;
    createdAt: string;
    isTest?: boolean; // Campo añadido para test mode
    planConnections?: { ... }[];
}
```

#### [NEW] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/admin/reports/plan-members/route.ts)
Crear un nuevo endpoint que realice lo siguiente:
- Autenticar y validar rol de administrador (usando `getAdminUser`).
- Consultar de forma paginada todos los miembros desde Memberstack usando `memberstackAdmin.listMembers`.
- Filtrar la lista de miembros para quedarse únicamente con aquellos que tengan una suscripción activa o inactiva en el plan `pln_club-pata-amiga-9o2k00j6m`.
- Cruzar información con la base de datos de Supabase:
  - Verificar si el correo del miembro existe en la tabla `ambassadors` para asignarle el tipo/origen **"Embajador"**, o de lo contrario **"Miembro"**.
  - Obtener el `crm_contact_id` y `ambassador_code` de la tabla `users` para determinar si el miembro fue referido y asociar el código y el estado de sincronización del CRM.
  - Contar mascotas registradas por usuario en la tabla `pets`.
  - Cruzar información de cancelación en la tabla `membership_cancellations`.
- Generar agregaciones rápidas:
  - Conteo total de miembros en este plan.
  - Conteo por estatus (Activo, Cancelado, Requiere Pago).
  - Conteo por Origen (Solicitud de Miembro, Embajador).
  - Conteo por Método de Captación (Directo, Referido).
  - Conteo de registros en Modo de Prueba vs Producción.
  - Cálculo de MRR y ARR estimado en base a los montos pagados.
  - Agrupación histórica de registros por mes.
- Retornar la lista enriquecida y las agregaciones en formato JSON.

---

### Frontend (UI Components)

#### [NEW] [PlanMembersReport.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/PlanMembersReport.tsx)
Crear el componente que renderizará el reporte premium de miembros:
- **Tarjetas de Indicadores (KPIs)**: Total Miembros, Activos, Cancelados, Requiere Pago, Ingresos Estimados (MRR/ARR).
- **Filtros Interactivos**:
  - Buscador de texto (por Nombre o Correo).
  - Filtro selector por **Modo de Datos** (Todos, Solo Producción, Solo Pruebas).
  - Filtro selector por **Estatus del Plan** (Todos, Activos, Cancelados, Requiere Pago).
  - Filtro selector por **Origen del Registro** (Todos, Solicitud de Miembro, Embajador).
  - Filtro selector por **Método de Captación** (Todos, Registro Directo, Referido por Embajador).
  - Filtro selector por **Mes de Registro** (Enero, Febrero, etc., dinámico según los datos devueltos).
  - Filtro selector por **Mascotas** (Todos, Con mascotas, Sin mascotas).
- **Tabla de Miembros**:
  - Columnas: Nombre & Correo, Fecha Registro, Origen (Miembro / Embajador), Canal (Directo / Referido), Modo (Producción / Prueba), Sincronización CRM (ID), Estatus, Costo / Plan, Mascotas, Detalles de Cancelación.
  - Los usuarios de prueba tendrán una insignia distintiva (Badge) de color naranja/rojo: **"Modo Prueba"** y un estilo de fila ligeramente opaco o con fondo sutil para identificarlos de un vistazo.
  - Si un usuario tiene `crm_contact_id` se mostrará: `✅ Sincronizado: ID`. De lo contrario, se mostrará: `⚠️ No Sincronizado` (sin botón de re-sincronización manual ya que estas cuentas serán eliminadas).
  - El detalle de cancelación se mostrará mediante un icono de información que, al pasar el cursor o hacer click, revele el motivo y comentario guardado en Supabase.
- **Exportación a CSV**:
  - Un botón de acción "Exportar a CSV" que construya un archivo CSV plano descargable en el navegador con toda la data filtrada actualmente (incluyendo IDs de Memberstack, nombres, correos, origen del registro, canal de captación, código del embajador, estatus del plan, costo, periodicidad, es_prueba, crm_contact_id, conteo de mascotas y motivos de cancelación).

#### [MODIFY] [InteractiveReports.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/InteractiveReports.tsx)
- Modificar el encabezado para incluir un sistema de pestañas (Tabs):
  - **Gráficas Generales**: Contendrá la visualización actual (Crecimiento de miembros, distribución de planes, ingresos, especies).
  - **Miembros Club Pata Amiga**: Nueva pestaña que renderiza el componente `<PlanMembersReport />`.
- Ajustar la estructura de estados para cambiar dinámicamente entre ambas vistas.

#### [MODIFY] [Reports.module.css](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/Reports/Reports.module.css)
- Añadir las clases necesarias para estilizar la nueva pestaña, la tabla de reportes, los campos de filtrado alineados (Search input, Selects), las insignias (Badges) de colores para los estatus del plan, origen, modo de prueba y el tooltip de cancelación.
- Mantener consistencia con el sistema de diseño del dashboard: bordes negros (`2px solid #000`), sombras planas (`box-shadow: 4px 4px 0px #000`), botones redondeados y tipografía `Outfit`.

---

## Plan de Verificación

### Pruebas de Compilación
- Ejecutar `npm run build` para asegurar la compilación estática.
- Ejecutar `npm run type-check` para verificar que no haya problemas de tipos en las respuestas de la API o componentes.
- Ejecutar `npm run lint` para validar consistencia de código.

### Verificación del Flujo
1. Ingresar al panel de administración en la sección **Reporteo > Gráficas interactivas**.
2. Verificar la aparición de la nueva pestaña **"Miembros Club Pata Amiga"**.
3. Seleccionar la pestaña y validar la carga de la tabla e indicadores (KPIs).
4. Probar el filtro selector por **Modo de Datos** para filtrar solo cuentas de prueba y confirmar que aparezca el listado de correos de prueba de Memberstack con su respectiva etiqueta "Modo Prueba" y el ID del contacto en el CRM.
5. Probar el filtro selector por **Origen del Registro** ("Miembro" vs "Embajador") y comprobar que filtre de acuerdo a los roles cruzados de la base de datos.
6. Probar el filtro selector por **Método de Captación** ("Directo" vs "Referido") y comprobar que aísle correctamente a los usuarios que ingresaron con códigos de referido.
7. Probar los filtros por estatus, mes de registro y mascotas, comprobando que la tabla se actualice reactivamente.
8. Digitar en el buscador y verificar el filtro por nombre/correo.
9. Dar click en el botón **"Exportar a CSV"** y validar que el archivo descargado contenga las columnas de "Origen" (Miembro/Embajador), "Canal" (Directo/Referido) y "Modo" (Producción/Prueba) con sus respectivos detalles, en formato UTF-8 (para soportar acentos y caracteres del español).
