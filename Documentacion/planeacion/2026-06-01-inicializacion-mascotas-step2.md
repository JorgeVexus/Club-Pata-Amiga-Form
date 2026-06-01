# Inicialización de Mascotas en Step 2 (Evitar Clientes Pagados con 0 Mascotas)

Este plan describe la solución para resolver el problema donde los usuarios completan el registro y pago, pero aparecen en el panel administrativo con **0 mascotas**. Esto ocurre porque las mascotas solo se insertan en la tabla `pets` de Supabase al completar el Step 5 (fotos y certificados). Si el usuario abandona la pestaña después de pagar pero antes de subir estos documentos, el registro de su mascota nunca se crea en dicha tabla.

## Causa Raíz
1. **Flujo de Persistencia Retardado:** El Step 2 guarda la mascota básica en el `localStorage` y en la tabla `users` (solo cabe la primera mascota por columnas legacy). La inserción formal en la tabla `pets` se retrasa hasta el Step 5 (`handleStep5Complete`).
2. **Abandono Post-Pago:** Muchos usuarios cierran la pestaña tras completar el pago (Step 3) o el perfil (Step 4), perdiendo la información de las mascotas básicas que estaba en su `localStorage`.
3. **Campos Inexistentes en Memberstack:** Si los campos personalizados (`pet-1-name`, etc.) no están declarados en el dashboard de Memberstack, las llamadas a `updateMember` los descartan de forma silenciosa, eliminando la única vía alternativa de recuperación en Memberstack.

---

## Cambios Propuestos

Para mitigar esto, guardaremos preliminarmente la información básica de la(s) mascota(s) en la tabla `pets` de Supabase tan pronto como el usuario complete el **Step 2** (antes de ir al pago).

### 1. Acciones del Servidor (Server Actions)

#### [MODIFY] [user.actions.ts](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/app/actions/user.actions.ts)

* Modificar la función `registerPetsInSupabase` para realizar un **upsert inteligente** por mascota en lugar de un `insert` directo.
* Esto busca si ya existe un registro de mascota para el `owner_id` y `memberstack_slot` correspondiente:
  * Si existe, se actualiza el registro con los nuevos campos (preservando el ID de mascota único de Supabase).
  * Si no existe, se inserta una nueva fila.
* Esto evitará que al llamar a esta función en el Step 2 y posteriormente en el Step 5 se creen duplicados.

### 2. Flujo de Registro (Frontend Component)

#### [MODIFY] [NewRegistrationFlow.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/RegistrationV2/NewRegistrationFlow.tsx)

* En el callback `handleStep2Complete`, después de guardar el progreso en la tabla `users` a través de `saveProgress`, importar y llamar a `registerPetsInSupabase` para crear de forma preliminar las mascotas con su información básica (`petName`, `petType`, `petAge`, `petAgeUnit`).
* Se guardarán con estado inicial `pending` e `isComplete = false`.

---

## Plan de Verificación

### Pruebas Automatizadas
* Ejecutar chequeo de tipos para asegurar consistencia en las propiedades:
  ```bash
  npm run type-check
  ```
* Ejecutar el linter del proyecto:
  ```bash
  npm run lint
  ```
* Probar el build de producción para descartar problemas de compilación en Next.js:
  ```bash
  npm run build
  ```

### Pruebas Manuales
1. Iniciar un flujo de registro nuevo en modo local.
2. Completar el Step 1 (crear cuenta).
3. Completar el Step 2 (introducir datos básicos de una o más mascotas) y dar clic en "Siguiente".
4. Verificar en el SQL Editor de Supabase (o tabla `pets`) que las mascotas se hayan creado con estado `pending` para el ID de usuario correspondiente.
5. Continuar al Step 3 (Selección de Plan), simular el pago (u omitir pago si está activado el test).
6. Cerrar el navegador deliberadamente antes de llegar al Step 5.
7. Verificar que el usuario aparezca pagado en Supabase y que su mascota siga existiendo en la tabla `pets`.
8. Reanudar el flujo, avanzar al Step 5, subir fotos/certificados veterinarios, completar el registro y verificar en Supabase que el registro de mascota existente se haya actualizado en lugar de duplicarse.
