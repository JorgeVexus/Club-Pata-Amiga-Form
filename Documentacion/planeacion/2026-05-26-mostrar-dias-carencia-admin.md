# Plan de Implementación: Mostrar días de carencia de mascotas en dashboard admin

Añadir al modal de detalles de miembros (`MemberDetailModal.tsx`) del dashboard de administración la visualización del tiempo de carencia (período de carencia) de cada mascota, de forma dinámica, consistente con las reglas de negocio centralizadas en `carencia.utils.ts` y contando los días a partir de `waiting_period_start`.

## Proposed Changes

### Admin Component

#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)
- Importar las utilidades de carencia `getPetCarenciaDate`, `getDaysUntilActive` y `getDaysElapsed` de `@/utils/carencia.utils`.
- Extender la interfaz `Pet` para incluir opcionalmente `waiting_period_start?: string | null;`.
- En el renderizado de cada mascota, calcular y mostrar:
  1. **Inicio de carencia**: Fecha legible a partir de `waiting_period_start` (si existe).
  2. **Tiempo de carencia (Duración)**: Total de días (e.g. 180, 150, 120, 90 días) según las reglas de negocio y si el usuario tiene código de embajador.
  3. **Días transcurridos**: Si la carencia ya inició (i.e. `waiting_period_start` existe), calcular los días transcurridos.
  4. **Días restantes**: Si la carencia ya inició, calcular los días restantes hasta la activación.

## Verification Plan

### Automated Tests
- Ejecutar `npm run type-check` para verificar que la tipificación TypeScript de la interfaz `Pet` y la integración con las utilidades de carencia sea correcta.
- Ejecutar `npm run build` para garantizar que la compilación de producción de Next.js se realice correctamente sin errores.

### Manual Verification
- Abrir el panel de administración, abrir el modal de detalles de un miembro que tenga mascotas registradas.
- Verificar que en el listado de mascotas se muestre la información de carencia:
  - Si tiene `waiting_period_start`, se debe mostrar: Inicio de carencia, Tiempo de carencia total, Días transcurridos y Días restantes.
  - Si no tiene `waiting_period_start` (aún pendiente), se debe estimar el tiempo de carencia total correspondiente según su tipo, adopción y código de embajador.
