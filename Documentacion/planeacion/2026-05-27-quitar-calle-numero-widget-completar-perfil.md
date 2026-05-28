# Plan de Implementación - Remoción de Campo Dirección en Complete Profile Widget

Este plan describe la modificación de `public/widgets/complete-profile-widget.js` para retirar el campo "Dirección (Calle y Número)" y, en su lugar, solicitar "Colonia" (mediante un menú desplegable dinámico alimentado por la consulta al código postal) y "Municipio/Alcaldía". Esto alinea el widget con el comportamiento del paso 4 del formulario de registro principal (`Step4CompleteProfile.tsx`).

## User Review Required

> [!IMPORTANT]
> El cambio remueve el campo de calle y número del primer paso del widget de completar perfil (`member_info`), reemplazándolo por Municipio/Alcaldía y Colonia. Estos nuevos campos se guardan en la base de datos de Supabase en las columnas `city` y `colony` del usuario, respectivamente. No es necesaria ninguna modificación a la estructura de la base de datos, ya que estas columnas ya existen y son soportadas por la API route `/api/user/update-profile`.

## Proposed Changes

### Widgets públicos

#### [MODIFY] [complete-profile-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/complete-profile-widget.js)

- **Modificación en `determineSteps()`:**
  - Cambiar la verificación de `u.address` por `u.colony && u.city` para determinar si el paso `member_info` está completo y se puede saltar.
  - Actualizar los logs de depuración para imprimir `colony` y `city` en lugar de `address`.
- **Modificación en `renderMemberInfoForm()`:**
  - Remover el campo de entrada `address` ("Dirección (Calle y Número)").
  - Añadir dos nuevos campos en una fila horizontal (`ppa-row`):
    - "Municipio/Alcaldía" (input de texto de solo lectura/editable, name: `city`, id: `ppa-city`).
    - "Colonia" (select dropdown, name: `colony`, id: `ppa-colony`).
- **Modificación en `handleCPChange()`:**
  - Al consultar el CP, poblar el campo `city` con `res.data.municipality` y rellenar dinámicamente el select `colony` con la lista de asentamientos (`res.data.colonies`).
  - Conservar la colonia seleccionada previamente si está dentro de la lista retornada por el código postal.
- **Modificación en `bindEvents()`:**
  - Agregar lógica al inicializar el formulario de información del miembro: si el código postal ya tiene 5 dígitos al cargar, ejecutar automáticamente `this.handleCPChange()` para poblar la lista de colonias y el municipio/alcaldía correspondientes.

## Verification Plan

### Manual Verification
- Cargar localmente el widget (por ejemplo, mediante una página de prueba o inspeccionando los campos inyectados) para verificar:
  1. El paso 1 de información del miembro ya no muestra el campo "Dirección (Calle y Número)".
  2. Al ingresar o tener un código postal de 5 dígitos (ej. `01000`), el municipio/alcaldía se llena automáticamente con "Álvaro Obregón" y el select de colonia se llena con la lista de colonias asociadas (ej. "San Ángel", "Lomas de Angelópolis", etc.).
  3. Al enviar el formulario, el payload enviado a `/api/user/update-profile` incluye `city` y `colony` en lugar de `address`.
  4. Los datos se persisten correctamente en Supabase.
