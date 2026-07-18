# Bajas de mascotas y ciclo anual del Fondo Solidario — Plan de implementación

> **Para agentes de implementación:** usar `superpowers:executing-plans` y ejecutar cada tarea en orden. Este proyecto trabaja directamente en `main`; no crear ramas ni worktrees. Ningún commit o push se realiza sin autorización expresa del usuario después del QA completo.

**Objetivo:** incorporar aprobación administrativa para las bajas de mascotas y calcular el saldo anual del Fondo Solidario desde el aniversario real del primer pago.

**Arquitectura:** `pet_unsubscriptions` será una entidad con estados y conservará compatibilidad con el historial existente. La resolución administrativa reutilizará un servicio único para sincronizar Supabase y Memberstack. El Fondo Solidario usará una fecha ancla inmutable (`first_payment_at`) y un helper puro para determinar el ciclo vigente.

**Stack:** Next.js App Router, TypeScript, React, Supabase service role, Memberstack Admin, widgets JavaScript API-first, Node Test Runner, CSS Modules.

---

## Mapa de archivos

### Crear

- `supabase/migrations/20260718_pet_unsubscription_workflow_and_solidarity_cycle.sql`: columnas, backfill e índices.
- `src/services/pet-unsubscription.service.ts`: creación y resolución centralizada de solicitudes.
- `src/app/api/admin/pet-unsubscriptions/route.ts`: listado administrativo.
- `src/app/api/admin/pet-unsubscriptions/[id]/route.ts`: aprobar o rechazar.
- `src/components/Admin/PetUnsubscriptionsTable.tsx`: cola administrativa.
- `src/components/Admin/PetUnsubscriptionsTable.module.css`: diseño V2 de la cola.
- `src/utils/solidarity-cycle.js`: cálculo puro de aniversarios.
- `tests/pet-unsubscription-workflow.test.mjs`: reglas de estados y compatibilidad.
- `tests/solidarity-cycle.test.mjs`: fechas del ciclo, límites y 29 de febrero.
- `tests/widgets/pet-unsubscription-widget-v2.test.js`: presentación y cupos del widget.
- `tests/widgets/solidarity-insufficient-balance-v2.test.js`: aviso dinámico y bloqueo del formulario.
- `tests/admin/pet-unsubscriptions-admin.test.mjs`: contrato API/UI administrativo.

### Modificar

- `src/utils/pet-lifecycle.js`: distinguir solicitudes pendientes, rechazadas e históricas.
- `src/app/api/user/pets/unsubscribe/route.ts`: crear solicitud pendiente para miembros; conservar baja inmediata administrativa/sistema.
- `src/app/actions/user.actions.ts`: incluir metadata de solicitud en las mascotas retornadas.
- `src/app/api/solidarity/stats/route.ts`: seleccionar estado de solicitudes de baja.
- `src/app/api/stripe/webhook/route.ts`: asignar `first_payment_at` solo si está vacío.
- `src/app/api/solidarity/balance/route.ts`: filtrar por ciclo de aniversario y devolver renovación.
- `public/widgets/unified-membership-widget.js`: badge, bloqueo de acción, cupos y fecha dinámica.
- `public/widgets/dashboard-v2-preview.html`: datos de preview para ambos estados.
- `src/components/Admin/Sidebar.tsx`: entrada y contador de bajas de mascotas.
- `src/components/Admin/AdminDashboard.tsx`: montar la cola y refrescar contadores.
- `src/components/Admin/V2/AdminOverview.tsx`: acceso a pendientes desde resumen.
- `src/components/Admin/MemberDetailModal.tsx`: mostrar estado pendiente y dirigir las resoluciones al flujo nuevo.

---

## Tarea 1: migración y contrato de estados

**Archivos:**

- Crear `supabase/migrations/20260718_pet_unsubscription_workflow_and_solidarity_cycle.sql`.
- Crear `tests/pet-unsubscription-workflow.test.mjs`.

- [ ] **Paso 1: escribir la prueba que exige el contrato SQL**

La prueba debe leer la migración y verificar:

```js
assert.match(sql, /ADD COLUMN IF NOT EXISTS status text/);
assert.match(sql, /CHECK \(status IN \('pending', 'approved', 'rejected'\)\)/);
assert.match(sql, /WHERE status = 'pending'/);
assert.match(sql, /ADD COLUMN IF NOT EXISTS first_payment_at timestamptz/);
assert.match(sql, /UPDATE public\.pet_unsubscriptions[\s\S]*status = 'approved'/);
```

- [ ] **Paso 2: ejecutar la prueba y confirmar RED**

```powershell
node --test tests/pet-unsubscription-workflow.test.mjs
```

Resultado esperado: falla porque la migración aún no existe.

- [ ] **Paso 3: crear la migración mínima**

La migración debe:

```sql
ALTER TABLE public.pet_unsubscriptions
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS review_notes text;

UPDATE public.pet_unsubscriptions
SET status = 'approved',
    requested_at = COALESCE(requested_at, created_at),
    reviewed_at = COALESCE(reviewed_at, created_at)
WHERE status IS NULL;

ALTER TABLE public.pet_unsubscriptions
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN requested_at SET DEFAULT now(),
  ADD CONSTRAINT pet_unsubscriptions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_unsubscriptions_one_pending_pet
ON public.pet_unsubscriptions(pet_id)
WHERE status = 'pending' AND pet_id IS NOT NULL;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_payment_at timestamptz;

UPDATE public.users
SET first_payment_at = COALESCE(payment_completed_at, created_at)
WHERE first_payment_at IS NULL;
```

- [ ] **Paso 4: ejecutar la prueba y confirmar GREEN**

```powershell
node --test tests/pet-unsubscription-workflow.test.mjs
```

Resultado esperado: todas las aserciones del contrato SQL pasan.

## Tarea 2: compatibilidad del ciclo de vida

**Archivos:**

- Modificar `src/utils/pet-lifecycle.js`.
- Modificar `tests/pet-lifecycle-utils.test.mjs`.

- [ ] **Paso 1: añadir pruebas RED para estados no terminales**

Casos obligatorios:

```js
assert.equal(isApprovedUnsubscription({ status: 'pending' }), false);
assert.equal(isApprovedUnsubscription({ status: 'rejected' }), false);
assert.equal(isApprovedUnsubscription({ status: 'approved' }), true);
assert.equal(isApprovedUnsubscription({}), true); // historial legado
```

Además, `enrichPetsWithLifecycle` debe conservar activa una mascota con solicitud `pending` y adjuntar:

```js
{
  unsubscription_request_status: 'pending',
  unsubscription_request_id: 'request-id'
}
```

- [ ] **Paso 2: ejecutar y confirmar RED**

```powershell
node --test tests/pet-lifecycle-utils.test.mjs
```

- [ ] **Paso 3: implementar el filtro terminal**

Agregar y exportar:

```js
function isApprovedUnsubscription(item = {}) {
  return !item.status || item.status === 'approved';
}
```

`buildLatestUnsubscriptionMap` debe construir por separado el último registro aprobado y la última solicitud pendiente. Solo el aprobado participa en `inactiveByUnsubscription`; el pendiente se adjunta como metadata.

- [ ] **Paso 4: confirmar GREEN y ejecutar toda la suite de lifecycle**

```powershell
node --test tests/pet-lifecycle-utils.test.mjs tests/solidarity-pet-eligibility.test.mjs
```

## Tarea 3: servicio central de solicitudes y resoluciones

**Archivos:**

- Crear `src/services/pet-unsubscription.service.ts`.
- Ampliar `tests/pet-unsubscription-workflow.test.mjs`.

- [ ] **Paso 1: añadir pruebas de contrato RED**

Verificar que el servicio exponga:

```ts
createPetUnsubscriptionRequest(input)
approvePetUnsubscription(input)
rejectPetUnsubscription(input)
```

Y que contenga protecciones de transición condicional `status = pending`, compensación de Memberstack y códigos de conflicto.

- [ ] **Paso 2: implementar tipos explícitos**

```ts
export type PetUnsubscriptionStatus = 'pending' | 'approved' | 'rejected';

export interface CreatePetUnsubscriptionInput {
  memberstackId: string;
  petId: string;
  petIndex: number;
  petName: string;
  reason: string;
  description?: string;
}
```

- [ ] **Paso 3: implementar creación idempotente**

La función debe verificar propietario, `is_active !== false`, ausencia de otra solicitud pendiente e insertar sin tocar `pets` ni Memberstack. Una violación del índice parcial se traduce a conflicto `409` en la ruta.

- [ ] **Paso 4: implementar aprobación**

Secuencia:

1. Reclamar condicionalmente la solicitud pendiente.
2. Actualizar `pet-N-is-active = false` en Memberstack.
3. Actualizar `pets.status`, `is_active` y campos de baja.
4. Completar metadata de revisión.
5. Si falla Memberstack o Supabase, restaurar las fuentes ya modificadas y devolver error sin notificar éxito.

- [ ] **Paso 5: implementar rechazo**

Solo actualiza la solicitud pendiente a `rejected`; nunca modifica `pets` ni Memberstack.

- [ ] **Paso 6: ejecutar pruebas y confirmar GREEN**

```powershell
node --test tests/pet-unsubscription-workflow.test.mjs
```

## Tarea 4: endpoint del miembro sin liberación anticipada

**Archivos:**

- Modificar `src/app/api/user/pets/unsubscribe/route.ts`.
- Ampliar `tests/pet-unsubscription-workflow.test.mjs`.

- [ ] **Paso 1: prueba RED del comportamiento del miembro**

La ruta no debe contener una actualización incondicional a `is_active: false`. Debe distinguir:

```ts
if (adminUser || isDeathSolidarity) {
  // baja inmediata aprobada
} else {
  // solicitud pendiente
}
```

- [ ] **Paso 2: implementar la bifurcación**

Para miembros, llamar `createPetUnsubscriptionRequest`. Para admin y fallecimiento, reutilizar `approvePetUnsubscription` con un registro aprobado inmediato y conservar compatibilidad con los consumidores existentes.

- [ ] **Paso 3: normalizar respuestas**

Solicitud:

```json
{ "success": true, "status": "pending", "message": "Tu solicitud de baja está en revisión." }
```

Baja inmediata:

```json
{ "success": true, "status": "approved", "message": "Mascota dada de baja exitosamente." }
```

- [ ] **Paso 4: ejecutar pruebas**

```powershell
node --test tests/pet-unsubscription-workflow.test.mjs
```

## Tarea 5: APIs administrativas y notificaciones

**Archivos:**

- Crear `src/app/api/admin/pet-unsubscriptions/route.ts`.
- Crear `src/app/api/admin/pet-unsubscriptions/[id]/route.ts`.
- Crear `tests/admin/pet-unsubscriptions-admin.test.mjs`.

- [ ] **Paso 1: escribir pruebas RED del contrato**

GET debe aceptar `status`, paginar y unir mascota/miembro. PATCH debe aceptar exclusivamente:

```ts
{ action: 'approve' | 'reject', reviewNotes?: string }
```

El rechazo requiere `reviewNotes`; ambos endpoints deben usar `getAdminUser`.

- [ ] **Paso 2: implementar GET autenticado**

Devolver:

```ts
{
  success: true,
  requests: Array<{
    id: string;
    status: PetUnsubscriptionStatus;
    reason: string;
    description: string | null;
    requested_at: string;
    pet: { id: string; name: string };
    member: { memberstack_id: string; first_name: string; last_name: string; email: string };
  }>;
  total: number;
}
```

- [ ] **Paso 3: implementar PATCH idempotente**

Resolver mediante el servicio. Solicitudes no pendientes devuelven `409`. Después del éxito, crear notificación con `metadata.action = 'open_pet'` y `petId`.

- [ ] **Paso 4: ejecutar pruebas**

```powershell
node --test tests/admin/pet-unsubscriptions-admin.test.mjs tests/pet-unsubscription-workflow.test.mjs
```

## Tarea 6: cola de bajas en el dashboard administrativo

**Archivos:**

- Crear `src/components/Admin/PetUnsubscriptionsTable.tsx`.
- Crear `src/components/Admin/PetUnsubscriptionsTable.module.css`.
- Modificar `src/components/Admin/Sidebar.tsx`.
- Modificar `src/components/Admin/AdminDashboard.tsx`.
- Modificar `src/components/Admin/V2/AdminOverview.tsx`.
- Ampliar `tests/admin/pet-unsubscriptions-admin.test.mjs`.

- [ ] **Paso 1: escribir pruebas RED de integración estática**

Verificar entrada `pet-unsubscriptions`, uso de `/api/admin/pet-unsubscriptions`, filtros y llamadas PATCH para aprobar/rechazar.

- [ ] **Paso 2: crear la tabla V2**

La vista debe tener filtros `pending`, `approved`, `rejected`, `all`; skeleton, estado vacío, error con reintento y actualización local después de resolver.

- [ ] **Paso 3: implementar acciones seguras**

- Aprobar: modal de confirmación con nombre de mascota y advertencia de liberación de cupo.
- Rechazar: modal/campo obligatorio para motivo.
- Deshabilitar ambos botones durante la petición.

- [ ] **Paso 4: conectar navegación y contador**

Añadir `Bajas de mascotas` dentro de Gestión General, inmediatamente después de Miembros. `loadPendingCounts` consultará `GET /api/admin/pet-unsubscriptions?status=pending&limit=1` y usará `total` para Sidebar y AdminOverview, sin crear otro endpoint de métricas.

- [ ] **Paso 5: ajustar MemberDetailModal**

Cuando una mascota tenga solicitud pendiente, mostrar “Baja solicitada”. La baja directa del administrador permanece disponible como acción explícita administrativa, diferenciada de resolver una solicitud del miembro.

- [ ] **Paso 6: ejecutar pruebas y type-check**

```powershell
node --test tests/admin/pet-unsubscriptions-admin.test.mjs
npm run type-check
```

## Tarea 7: metadata y presentación del widget del miembro

**Archivos:**

- Modificar `src/app/actions/user.actions.ts`.
- Modificar `src/app/api/solidarity/stats/route.ts`.
- Modificar `public/widgets/unified-membership-widget.js`.
- Modificar `public/widgets/dashboard-v2-preview.html`.
- Crear `tests/widgets/pet-unsubscription-widget-v2.test.js`.

- [ ] **Paso 1: escribir pruebas RED**

Verificar:

- `pending` renderiza “Baja solicitada”.
- No se aplica escala de grises.
- La mascota sigue contando como activa.
- No aparece un nuevo cupo antes de aprobación.
- El modal sustituye el botón por “Estamos revisando tu solicitud de baja”.

- [ ] **Paso 2: exponer metadata en APIs**

Todas las consultas a `pet_unsubscriptions` usadas para enriquecer mascotas deben seleccionar `id,status,requested_at,reviewed_at` además de los campos históricos.

- [ ] **Paso 3: adaptar el estado visual**

`getV2Status` debe priorizar `unsubscription_request_status === 'pending'` y devolver:

```js
{ key: 'unsubscribe_pending', label: 'BAJA SOLICITADA' }
```

Agregar estilo cálido/neutral coherente con V2, sin rojo terminal ni gris.

- [ ] **Paso 4: adaptar submit y refresh**

Después de solicitar, actualizar metadata local o volver a cargar mascotas. El mensaje de éxito debe indicar que el cupo se libera únicamente tras aprobación.

- [ ] **Paso 5: actualizar preview**

Incluir una mascota aprobada con solicitud pendiente para comprobar badge, conteo 3/3 y modal bloqueado.

- [ ] **Paso 6: ejecutar pruebas**

```powershell
node --test tests/widgets/pet-unsubscription-widget-v2.test.js tests/widgets/unified-membership-dashboard-v2.test.js tests/pet-lifecycle-utils.test.mjs
```

## Tarea 8: helper de aniversario del Fondo Solidario

**Archivos:**

- Crear `src/utils/solidarity-cycle.js`.
- Crear `tests/solidarity-cycle.test.mjs`.

- [ ] **Paso 1: escribir pruebas RED con fechas deterministas**

Casos:

```js
getSolidarityCycle('2026-07-14T12:00:00Z', '2026-07-18T00:00:00Z')
// start 2026-07-14, end 2027-07-14

getSolidarityCycle('2026-07-14T12:00:00Z', '2027-07-14T12:00:00Z')
// start 2027-07-14, end 2028-07-14

getSolidarityCycle('2024-02-29T12:00:00Z', '2025-02-20T00:00:00Z')
// end 2025-02-28
```

También probar fecha inválida y formato `es-MX` con zona UTC estable.

- [ ] **Paso 2: confirmar RED**

```powershell
node --test tests/solidarity-cycle.test.mjs
```

- [ ] **Paso 3: implementar helper puro**

Exportar:

```js
getSolidarityCycle(anchor, now)
formatSolidarityRenewalDate(date)
```

No usar `setFullYear` directamente sobre 29 de febrero sin normalizar el último día válido del mes.

- [ ] **Paso 4: confirmar GREEN**

```powershell
node --test tests/solidarity-cycle.test.mjs
```

## Tarea 9: persistir el primer pago sin romper el último pago

**Archivos:**

- Modificar `src/app/api/stripe/webhook/route.ts`.
- Ampliar `tests/solidarity-cycle.test.mjs` o crear prueba específica del webhook.

- [ ] **Paso 1: escribir prueba RED**

El webhook debe conservar:

```ts
payment_completed_at: paidAt
```

y asignar `first_payment_at` solo cuando el valor actual sea nulo. La consulta del usuario debe seleccionar `first_payment_at`.

- [ ] **Paso 2: implementar actualización condicional**

Leer `id,first_payment_at`; incluir `first_payment_at` en `updateData` únicamente cuando no exista. No sobrescribirlo en renovaciones ni cambios de plan.

- [ ] **Paso 3: ejecutar pruebas**

```powershell
node --test tests/solidarity-cycle.test.mjs tests/stripe-webhook-crm-sync.test.mjs
```

## Tarea 10: saldo por ciclo y copy dinámico

**Archivos:**

- Modificar `src/app/api/solidarity/balance/route.ts`.
- Modificar `public/widgets/unified-membership-widget.js`.
- Modificar `tests/solidarity-balance.test.mjs`.
- Modificar `tests/widgets/unified-membership-dashboard-v2.test.js`.

- [ ] **Paso 1: escribir pruebas RED del límite temporal**

La ruta debe seleccionar `first_payment_at, payment_completed_at, created_at`, calcular el ciclo y consultar:

```ts
.gte('created_at', cycleStart)
.lt('created_at', cycleEnd)
```

La respuesta debe incluir `cycleStart`, `cycleEnd` y `renewalDate`.

- [ ] **Paso 2: implementar la API**

Usar prioridad `first_payment_at || payment_completed_at || created_at`. Si ninguna fecha es válida, devolver error controlado y no asumir enero.

- [ ] **Paso 3: adaptar las tarjetas**

Eliminar el año calculado con `new Date().getFullYear()` y el literal “tu saldo se renueva en enero”. Renderizar:

```js
const renewalLabel = this.formatDateLongV2(this.solidarity.balance.renewalDate);
```

Copy final:

```text
Usaste $X de $Y MXN — tu saldo se renueva el 14 de julio de 2027.
```

- [ ] **Paso 4: actualizar datos del preview**

Sembrar `renewalDate: '2027-07-14T00:00:00.000Z'` para validar visualmente día, mes y año.

- [ ] **Paso 5: ejecutar pruebas**

```powershell
node --test tests/solidarity-cycle.test.mjs tests/solidarity-balance.test.mjs tests/widgets/unified-membership-dashboard-v2.test.js
```

## Tarea 11: aviso dinámico por fondos insuficientes

**Archivos:**

- Modificar `public/widgets/unified-membership-widget.js`.
- Modificar `src/app/api/solidarity/request/route.ts`.
- Crear `tests/widgets/solidarity-insufficient-balance-v2.test.js`.
- Modificar `tests/solidarity-balance.test.mjs`.

- [ ] **Paso 1: escribir pruebas RED del estado inicial**

Comprobar que el formulario no renderice el aviso anterior de revisión y que el contenedor de error de saldo esté oculto inicialmente.

```js
assert.doesNotMatch(source, /Revisaremos que tu peludo cumpla/);
assert.match(source, /data-insufficient-balance-notice/);
assert.match(source, /hidden/);
```

- [ ] **Paso 2: escribir pruebas RED de mensajes por categoría**

El widget debe mapear:

```js
{
  medical_emergency: 'fondo de emergencias',
  annual_vaccination: 'fondo de vacunas',
  death: 'fondo por fallecimiento'
}
```

y construir “Tu solicitud no puede ser procesada como la ingresaste debido a que no cuentas con fondos suficientes en tu …”.

- [ ] **Paso 3: implementar comparación reactiva**

En cambios de `requestedAmount` o `benefitType`:

1. Leer `available` desde `this.solidarity.balance.balances[benefitType]`.
2. Mostrar el aviso solo cuando `requestedAmount > available`.
3. Deshabilitar el submit por insuficiencia sin interferir con el bloqueo existente por falta de mascotas elegibles.
4. Ocultar el aviso al corregir el monto o cambiar de categoría.

- [ ] **Paso 4: escribir prueba RED del backend autoritativo**

La ruta debe volver a calcular saldo con solicitudes del ciclo vigente y responder:

```ts
return NextResponse.json({
  error: dynamicMessage,
  code: 'INSUFFICIENT_SOLIDARITY_BALANCE',
  benefitType,
  available,
}, { status: 409 });
```

- [ ] **Paso 5: implementar la validación antes del insert**

Usar el mismo helper de ciclo anual y `getSolidarityAvailableAmount`. La validación debe ocurrir después de validar propietario/categoría y antes de subir o insertar la solicitud.

- [ ] **Paso 6: ejecutar pruebas y confirmar GREEN**

```powershell
node --test tests/widgets/solidarity-insufficient-balance-v2.test.js tests/solidarity-balance.test.mjs tests/widgets/unified-membership-dashboard-v2.test.js
```

## Tarea 12: QA sistemático y revisión local

**Archivos:** todos los anteriores.

- [ ] **Paso 1: auditoría de regresiones**

Comprobar manualmente que:

- Una baja pendiente no cambia `is_active`.
- Una baja aprobada libera un solo slot.
- Una baja rechazada no modifica Memberstack.
- Fallecimiento y baja directa administrativa siguen siendo inmediatos.
- Las solicitudes antiguas sin `status` continúan como bajas terminales.
- Reintegros anteriores al inicio del ciclo no consumen saldo.

- [ ] **Paso 2: ejecutar suites focalizadas**

```powershell
node --test tests/pet-lifecycle-utils.test.mjs tests/pet-unsubscription-workflow.test.mjs tests/admin/pet-unsubscriptions-admin.test.mjs tests/widgets/pet-unsubscription-widget-v2.test.js tests/widgets/solidarity-insufficient-balance-v2.test.js tests/solidarity-cycle.test.mjs tests/solidarity-balance.test.mjs tests/widgets/unified-membership-dashboard-v2.test.js
```

- [ ] **Paso 3: ejecutar gate completo**

```powershell
npm run build
npm run type-check
npm run lint
```

Resultado esperado: cero errores; documentar por separado advertencias históricas.

- [ ] **Paso 4: entregar previews locales**

Entregar enlaces para:

- Dashboard miembro con “Baja solicitada”.
- Fondo Solidario con renovación en julio de 2027.
- Dashboard admin en “Bajas de mascotas”.

- [ ] **Paso 5: solicitar autorización de commit y push**

Mostrar resumen, archivos, pruebas y migración requerida. No ejecutar Git hasta recibir autorización explícita para estos cambios.

## Tarea 13: despliegue de migración y código

- [ ] **Paso 1: aplicar primero la migración de Supabase**

Confirmar columnas, constraint, índice parcial y backfill antes de desplegar APIs que dependan de ellas.

- [ ] **Paso 2: publicar código autorizado**

Commit sugerido:

```text
feat: add pet cancellation approvals and anniversary balances
```

- [ ] **Paso 3: actualizar changelog después del push**

Registrar commit, impacto funcional, migración, pruebas y resultado del build en `changelogs/2026-07-18.md`.

---

## Criterios de finalización

- El miembro ve “Baja solicitada” sin obtener un cupo anticipado.
- Administración puede aprobar o rechazar desde una cola funcional.
- Solo aprobar cambia Supabase y Memberstack a inactivo.
- Rechazar restaura la presentación “Aprobado” y permite una nueva solicitud.
- Los registros históricos siguen funcionando.
- El saldo anual se filtra por aniversario del primer pago.
- Las tarjetas muestran la fecha exacta de renovación.
- Build, type-check, lint y pruebas terminan sin errores.
