# Plan de Implementación: Corrección de Swapping de Slots de Mascotas

El objetivo de este plan es corregir de raíz el error por el cual las mascotas alternan sus estados (activa, aprobada, dada de baja) de manera aleatoria al realizar actualizaciones de estado o bajas.

## Diagnóstico y Causa Raíz

1. **Inexistencia de `memberstack_slot` en el registro inicial**: Al registrar mascotas a través del formulario de onboarding (`registerPetsInSupabase`), la columna `memberstack_slot` se queda en `null` en Supabase.
2. **Ordenamiento no determinista**: Dado que el slot de la mascota no está guardado, el sistema recurre al índice del arreglo ordenado por `created_at` (`pets.indexOf(pet) + 1`). Sin embargo, todas las mascotas del lote inicial tienen exactamente el mismo timestamp de creación (`created_at`). Al actualizar una fila, PostgreSQL modifica su orden de devolución físico en disco, provocando que los slots asignados virtualmente roten.
3. **Mapeo de bajas incorrecto**: Cuando las posiciones virtuales cambian de índice, una mascota activa toma el índice de una mascota dada de baja (asociándose a su historial en la tabla `pet_unsubscriptions` y a custom fields de Memberstack), quedando erróneamente marcada como "Dada de Baja", mientras que la dada de baja original vuelve a verse activa.
4. **Desfase de índice en desuscripción**: Al dar de baja a una mascota desde el panel de administración, el modal envía un índice 1-indexed, pero el endpoint `/api/user/pets/unsubscribe` le suma `+1` de nuevo (pensando que viene en 0-indexed), afectando el slot de Memberstack de otra mascota distinta.

---

## Cambios Propuestos

### 1. Backend: Sincronización en onboarding
#### [MODIFY] [user.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/actions/user.actions.ts)
* Modificar `registerPetsInSupabase` para asignar explícitamente `memberstack_slot: index + 1` en la inserción inicial.
* Agregar un ordenamiento por `id` (UUID estable) secundario en `getPetsByUserId` para asegurar la consistencia del ordenamiento virtual si quedaran mascotas legacy sin slot.

```typescript
// En registerPetsInSupabase:
const petsToInsert = pets.map((pet, index) => ({
    owner_id: userData.id,
    memberstack_slot: index + 1, // Guardar el slot en la BD
    name: pet.name || pet.petName,
    ...
}));

// En getPetsByUserId:
const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', userData.id)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true }); // Ordenamiento estable secundario
```

### 2. Backend: Endpoints de Estado y Recálculo
#### [MODIFY] [route.ts (pet status)](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/src/app/api/admin/members/[id]/pets/[petId]/status/route.ts)
* Actualizar las consultas a la tabla `pets` en `findPetForMember` y `updateMemberStatusFromPets` agregando `.order('id', { ascending: true })` después del ordenamiento por `created_at`.

#### [MODIFY] [member-status.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/utils/member-status.ts)
* Añadir el ordenamiento por `id` como criterio de desempate en la función `recalculateMemberStatus` al obtener las mascotas del usuario.

### 3. Frontend: Modal de Detalles en Admin
#### [MODIFY] [MemberDetailModal.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/Admin/MemberDetailModal.tsx)
* Modificar la llamada a `handlePetUnsubscribe` para pasar el índice basado en 0 (`pets.indexOf(pet)`) en lugar del valor 1-indexed (`pIdx`), ya que la API de baja le suma `+1` de manera automática a la variable `petIndex`.

```tsx
// Antes:
onClick={() => handlePetUnsubscribe(pet.id, pIdx, pet.name)}

// Ahora:
onClick={() => handlePetUnsubscribe(pet.id, pets.indexOf(pet), pet.name)}
```

### 4. Scripts: Script de Reparación / Backfill de Base de Datos
#### [NEW] [backfill-pet-slots.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/scripts/backfill-pet-slots.ts)
* Crear un script temporal de Node/TypeScript para rellenar la columna `memberstack_slot` en todas las mascotas existentes en base a su orden de creación determinista y estable (`created_at` e `id`).

---

## Plan de Verificación

### Pruebas Automatizadas
* Ejecutar `npm run type-check` y `npm run lint` para garantizar que los tipos y estándares de código permanezcan intactos.

### Pruebas Manuales
1. Ejecutar el script de backfill localmente para corregir los registros actuales en la base de datos de Supabase.
2. Iniciar el servidor local (`npm run dev`) y verificar en el dashboard admin que las mascotas de Lucero Contreras (y otros miembros de prueba) se mapeen correctamente y sus estados de baja no se alternen al cambiar aprobaciones o reordenamientos de base de datos.
3. Comprobar que dar de baja una mascota desde el panel desactive exactamente la mascota deseada en Memberstack (verificando en consola o mediante el log).
