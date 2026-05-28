# Plan de Implementación - Corrección de Filtro de Bajas de Mascotas en el Widget de Completar Perfil

Este plan detalla los cambios para solucionar el problema por el cual el widget `complete-profile-widget.js` sigue pidiendo datos de mascotas dadas de baja (como "Luna").

## Diagnóstico y Causa Raíz

En `src/app/actions/user.actions.ts`, la función `getPetsByUserId(memberstackId)` está diseñada para recibir indistintamente el ID de Memberstack o el UUID de Supabase (detectándolo mediante el flag `isUuid`). Sin embargo:

1. **Memberstack details:** Llama a `getMemberDetails(memberstackId)` pasando el parámetro directamente. Si este es un UUID, la API de Memberstack falla y retorna campos personalizados vacíos (`msCustomFields = {}`).
2. **Bajas de mascotas:** Consulta la tabla `pet_unsubscriptions` usando `.eq('memberstack_id', memberstackId)`. Dado que `pet_unsubscriptions` almacena los IDs de Memberstack (ej: `mem_...`), si se busca por el UUID de Supabase la consulta retorna 0 registros.
3. **Enriquecimiento del ciclo de vida:** Al ejecutarse `enrichPetsWithLifecycle(pets, msCustomFields, petUnsubscriptions)` con datos vacíos de Memberstack y de bajas, la mascota dada de baja (con estado `pending` en la tabla `pets` y asociada a una baja en `pet_unsubscriptions`) es catalogada erróneamente como **activa**.

## Cambios Propuestos

### Backend Server Actions

#### [MODIFY] [user.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/actions/user.actions.ts)

- **Modificación en `getPetsByUserId`:**
  - Agregar `memberstack_id` en las consultas de selección del usuario a la tabla `users` (tanto en la consulta principal como en el fallback de error).
  - Resolver el ID real de Memberstack:
    ```typescript
    const realMemberstackId = userData.memberstack_id || memberstackId;
    ```
  - Usar `realMemberstackId` en lugar de `memberstackId` para:
    - La llamada a `getMemberDetails(realMemberstackId)`.
    - La consulta a `pet_unsubscriptions` (`.eq('memberstack_id', realMemberstackId)`).
    - La consulta a `appeal_logs` (`.eq('user_id', realMemberstackId)`).

### Archivos de limpieza

#### [DELETE] [scratch_db.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/scratch_db.js)

- Eliminar el script de prueba temporal utilizado para diagnosticar la base de datos en local.

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` y `npm run lint` para garantizar que la compilación de TypeScript de Next.js pase perfectamente y no haya errores de tipo.

### Verificación Manual
- Ejecutar el script `scratch_db.js` adaptado para usar el backend modificado (o simular la llamada localmente) para verificar que Luna ahora reporta `is_active: false`.
- Verificar que el endpoint `/api/user/pets?userId=b54513bd-95cd-42e5-8255-4462763b9c33` ahora retorna a Luna con `is_active: false`.
