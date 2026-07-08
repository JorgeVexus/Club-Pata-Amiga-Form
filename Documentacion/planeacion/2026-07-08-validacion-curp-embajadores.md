# Plan de Implementación: Validación de CURP y Mayoría de Edad en Registro de Embajadores

Este plan detalla los ajustes al flujo de registro de embajadores (`/embajadores/registro`) para alinear el comportamiento con el flujo de registro de miembros v2.

Se agregará la validación de formato y consistencia de la CURP, se requerirá la fecha de nacimiento para verificar la mayoría de edad (>= 18 años), se dividirá el campo de nombre completo en nombre y apellidos por separado, y se modificará la base de datos y la API para permitir registros con CURP duplicado (mostrando solo una advertencia informativa y permitiendo continuar al usuario).

---

## Cambios Propuestos

### 1. Base de Datos (Supabase Migrations)

Para permitir que una CURP se registre más de una vez en el sistema, es necesario remover la restricción `UNIQUE` en la columna `curp` de las tablas `users` y `ambassadors`.

#### [NEW] [20260708_remove_curp_unique_constraints.sql](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/supabase/migrations/20260708_remove_curp_unique_constraints.sql)
```sql
-- Migración: Remover restricción UNIQUE de la columna CURP en users y ambassadors
-- Fecha: 2026-07-08

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_curp_key;
ALTER TABLE public.ambassadors DROP CONSTRAINT IF EXISTS ambassadors_curp_key;
```

---

### 2. Capa de Servicios y API (Backend)

#### [MODIFY] [route.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/src/app/api/ambassadors/route.ts)
- Eliminar la validación del backend que bloquea y retorna error `400` si la CURP ya existe (`existingCurp`).
- Asegurar que el campo `birth_date` se extraiga correctamente del cuerpo de la petición (`body.birth_date`) y se guarde en la base de datos de Supabase en lugar de enviar un string vacío.

#### [MODIFY] [ambassador.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/src/app/actions/ambassador.actions.ts)
- Actualizar `checkAmbassadorAvailability` para el tipo `'curp'`:
  - Contar cuántas veces está registrada la CURP en total (sumando registros en la tabla `ambassadors` y en la tabla `users`).
  - Retornar `{ available: totalCount === 0, count: totalCount }`.
  - Asegurar que no cause bloqueos de validación en el servidor y que el frontend sea quien controle la visualización del aviso.

---

### 3. Componentes de Interfaz (Frontend)

#### [MODIFY] [SimplifiedStep.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/src/components/AmbassadorForm/SimplifiedStep.tsx)
- Reemplazar el campo `full_name` (Nombre completo) por tres inputs independientes:
  - **Nombre(s)** (`first_name`)
  - **Apellido paterno** (`paternal_surname`)
  - **Apellido materno** (`maternal_surname`, opcional)
- Agregar el campo de **Fecha de nacimiento** (`birth_date`) mediante un selector de fecha o campo tipo date, indicando la regla de mayoría de edad.
- Agregar elementos visuales al campo CURP:
  - Indicador de estado de verificación ("Verificando...").
  - Indicador de disponibilidad ("✓ Disponible").
  - Banner informativo no bloqueante en caso de CURP duplicada:
    `⚠️ CURP ya registrada en X cuentas. Si es tuya, puedes continuar sin problemas.`
- Pasar las propiedades `isCheckingCurp`, `curpAvailable` y `curpCount` como props desde `AmbassadorForm.tsx`.

#### [MODIFY] [AmbassadorForm.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new project/pet-membership-form/src/components/AmbassadorForm/AmbassadorForm.tsx)
- Actualizar `SimplifiedAmbassadorData` e `initialFormData` para manejar los nuevos campos personales por separado (`first_name`, `paternal_surname`, `maternal_surname`, `birth_date`) en lugar del campo unificado `full_name`.
- Modificar el prellenado de Memberstack para usar los campos `'first-name'`, `'paternal-last-name'` y `'maternal-last-name'` directamente de `customFields`.
- Agregar los estados locales:
  - `isCheckingCurp` (boolean)
  - `curpAvailable` (boolean | null)
  - `curpCount` (number)
- Implementar la función `verifyCurp(curp)` para:
  1. Validar el formato mediante `validateCURP(curp)`.
  2. Validar coincidencia y consistencia de datos personales mediante `validateCurpMatchesData(...)` (comparando CURP contra nombres y fecha de nacimiento).
  3. Consultar la disponibilidad mediante `checkAmbassadorAvailability('curp', curp)`.
  4. Actualizar los estados de disponibilidad y conteo.
- Cambiar la lógica del submit (`handleSubmit`):
  - Validar que la edad sea mayor o igual a 18 años utilizando `calculateAge(formData.birth_date)`.
  - Quitar la validación que impide el envío del formulario si `curpCheck.available` es falso.
  - Asegurar que `birth_date` y los nombres separados se envíen al endpoint `/api/ambassadors`.

---

## Plan de Verificación

### Pruebas de Integración y Construcción
- Ejecutar `npm run build` y `npm run type-check` antes de finalizar para asegurar que no hay errores de TypeScript ni problemas de compilación.

### Pruebas Manuales
1. **Flujo de Registro de Embajadores**:
   - Ingresar a `/embajadores/registro`.
   - Verificar la presencia de los campos: Nombre(s), Apellido Paterno, Apellido Materno, Fecha de Nacimiento.
   - Probar que si se ingresa una fecha de nacimiento que resulta en menor de 18 años, el sistema muestre un mensaje de error y no permita avanzar.
   - Probar que si la CURP no tiene formato válido (18 caracteres estructurados correctamente), se muestre un error.
   - Probar que si la CURP no coincide con el Nombre, Apellidos o Fecha de Nacimiento ingresados, se muestre la advertencia de consistencia de la CURP.
   - Probar que si la CURP ya está registrada, aparezca la advertencia: `⚠️ CURP ya registrada en X cuentas. Si es tuya, puedes continuar sin problemas.`, y que aun así el formulario se pueda enviar con éxito.
