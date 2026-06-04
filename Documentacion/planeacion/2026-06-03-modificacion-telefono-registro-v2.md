# Plan de Implementación - Modificación de Teléfono en Registro V2 (Actualización)

Este plan detalla los cambios para optimizar el manejo del número de teléfono en el Flujo de Registro V2:
1. Eliminar el texto de ayuda del campo de teléfono en el Paso 1.
2. Enviar el número de teléfono a Memberstack y Supabase inmediatamente al crear la cuenta en el Paso 1.
3. Pre-cargar el número de teléfono al reanudar el estado de registro.
4. Agregar el campo de teléfono en el Paso 4 (Completar Perfil) prellenado si se capturó en el Paso 1.
5. **[NUEVO]** Asegurar que en el Paso 4, al perder el foco (onBlur) del campo de teléfono, este se guarde inmediatamente tanto en Supabase como en Memberstack si tiene un formato válido (10 dígitos), para mantener los datos siempre actualizados y evitar pérdidas de datos si el usuario abandona la página antes de dar clic a "Continuar".

## Cambios Propuestos

### Componentes de Pasos de Registro

#### [MODIFY] [PhoneInput.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/FormFields/PhoneInput.tsx)
- Agregar el prop opcional `onBlur?: () => void` a la interfaz `PhoneInputProps`.
- Pasar el prop `onBlur` al elemento `<input>` nativo.

#### [MODIFY] [Step1Account.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/RegistrationV2/steps/Step1Account.tsx)
- Quitar el prop `helpText` del componente `<PhoneInput />`.

#### [MODIFY] [Step4CompleteProfile.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/RegistrationV2/steps/Step4CompleteProfile.tsx)
- Importar `PhoneInput` desde `@/components/FormFields/PhoneInput`.
- Importar `registerUserInSupabase` desde `@/app/actions/user.actions`.
- En el `useEffect` que carga el perfil inicial, asegurar que se asigne `phone: profile.phone || prev.phone || data?.account?.phone || ''`.
- Implementar la función `handlePhoneBlur` para persistir inmediatamente el número de teléfono en Supabase y Memberstack si tiene exactamente 10 dígitos.
- Renderizar el componente `<PhoneInput />` en la sección de "Contacto" debajo del campo de correo electrónico, pasándole la función `handlePhoneBlur` al prop `onBlur`.

### Orquestador del Flujo de Registro

#### [MODIFY] [NewRegistrationFlow.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/RegistrationV2/NewRegistrationFlow.tsx)
- En `loadSavedState`, asegurar que `loadedData.account.phone` se prellene con el valor obtenido de Memberstack (`currentMember.customFields?.['phone']`) o de Supabase (`userData?.phone`).
- En `handleStep1Complete`, añadir `'phone': data.phone || ''` en los `customFields` enviados a `signupMemberEmailPassword`.
- En `handleStep1Complete`, pasar el campo `phone: data.phone` en el objeto que se envía a `registerUserInSupabase`.

## Plan de Verificación

### Pruebas Manuales
1. Ir al flujo de registro en `/registro`.
2. Verificar que en el Paso 1 no aparezca el texto "Déjanos tu teléfono..." debajo del campo de teléfono.
3. Completar el Paso 1 ingresando un teléfono (ej. `555 555 5555`) y crear la cuenta.
4. Avanzar por los pasos del flujo hasta llegar al Paso 4 (Completa tu perfil).
5. Verificar que el teléfono ingresado en el Paso 1 esté prellenado en el Paso 4.
6. En el Paso 4, modificar el número de teléfono (ej. `555 555 9999`) y dar click afuera del input (activar onBlur).
7. Sin presionar el botón "Continuar", recargar la página `/registro?step=4`.
8. Verificar que el número modificado (`555 555 9999`) aparezca precargado, confirmando que la persistencia en blur funcionó.
9. Probar también un registro donde no se ingrese el teléfono en el Paso 1, avanzar al Paso 4, ingresarlo, hacer blur, recargar la página y verificar que se haya guardado y precargado.

### Pruebas de Build y Calidad
- Ejecutar `npm run build` y `npm run type-check` para garantizar estabilidad de tipos y despliegue.
- Ejecutar `npm run lint` para validar calidad de código.
