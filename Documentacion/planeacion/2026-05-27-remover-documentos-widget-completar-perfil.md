# Plan de Implementación - Remoción de Carga de Documentos en Complete Profile Widget y Completación de Mascotas

Este plan detalla los cambios para remover la sección de carga de documentos oficiales (INE Frente, Reverso y Comprobante de Domicilio) del widget `complete-profile-widget.js`, e incorporar todos los campos complementarios del Paso 5 del registro de mascotas, haciéndolo congruente con el flujo real.

## User Review Required

> [!IMPORTANT]
> - Se elimina el paso `documents` del flujo del widget.
> - El paso `complete_pet` ahora solicita **toda la información complementaria de la mascota** (Sexo, Tipo de raza, Raza, Colores, Historia de adopción, Foto y Certificado Veterinario si es senior) y no solo la foto/certificado.
> - El backend actualiza todos estos campos en Supabase y ejecuta `recalculateMemberStatus` para sincronizar los estados.

## Proposed Changes

### Widgets públicos

#### [MODIFY] [complete-profile-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/complete-profile-widget.js)

- **Modificación en `determineSteps()`:**
  - Remover por completo la sección que evalúa e inserta el paso `documents`.
  - Actualizar la validación de mascota incompleta para que verifique si falta foto, género, color de pelo, raza (si no es mestizo) o certificado senior.
- **Modificación en `render()`:**
  - Remover la rama `case 'documents':` de la estructura selectora de plantillas HTML.
- **Eliminación de `renderDocumentsForm()`:**
  - Eliminar por completo esta función.
- **Modificación en `renderCompletePetForm()`:**
  - Rediseñar el formulario para incluir selectores de género, tipo de raza (Mestizo vs Raza), input de raza, inputs para colores (pelo, nariz, ojos), checkbox de adoptado e historia de adopción, subida de foto y certificado senior.
- **Modificación en `bindEvents()`:**
  - Remover event listeners de documentos oficiales.
  - Agregar event listeners para cambiar la visibilidad de la raza y de la historia de adopción según la selección del usuario.
- **Modificación en `handleCompletePetSubmit()`:**
  - Leer todos los campos del formulario, construir el payload completo y enviarlo vía POST a `/api/user/pets/[petId]/update`.

### API Routes Backend

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/api/user/pets/%5BpetId%5D/update/route.ts)

- **Modificación en `POST`:**
  - Recibir y desestructurar campos adicionales del body: `gender`, `coatColor`, `noseColor`, `eyeColor`, `isMixedBreed`, `breed`, `isAdopted`.
  - Asignar los campos correspondientes al objeto `updateData`.
  - Marcar `complementary_info_completed = true` al actualizar.
  - Importar y ejecutar `recalculateMemberStatus(owner.memberstack_id)` al final del flujo de guardado para mantener el estado de la membresía sincronizado.

## Verification Plan

### Automated Tests
- Ejecutar `npm run type-check` y `npm run lint`.

### Manual Verification
- Cargar el widget y simular un perfil sin documentos oficiales cargados. Verificar que el paso `documents` ya no se muestra.
- Simular un usuario con una mascota incompleta. Verificar que se solicitan todos los campos de información general (sexo, raza), características físicas (colores), adopción (historia) y multimedia (foto/certificado).
- Completar la información y verificar en Supabase que los campos de la mascota y el estado del miembro se actualicen correctamente.
