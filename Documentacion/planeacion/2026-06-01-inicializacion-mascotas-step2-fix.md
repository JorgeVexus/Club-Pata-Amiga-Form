# Plan de Corrección: Inicialización de Mascotas en Step 2 (Extracción Robusta de ID)

Este plan detalla la corrección para el bug donde las mascotas no se inicializan en Supabase durante el Paso 2, a pesar de que el usuario sí se crea en Supabase y los datos se guardan en Memberstack.

## Causa Raíz Encontrada

1. **Estado `member` sin ID a nivel raíz:** Al registrarse o iniciar sesión, el objeto retornado por Memberstack (`signupData` o `loggedMember`) se guarda directamente en el estado de React `member`. Dependiendo de cómo responda el SDK de Memberstack en cada caso, el ID de usuario puede estar anidado (por ejemplo, en `member.member.id` o `member.data.id`) en lugar de en la raíz `member.id`.
2. **Filtro Silencioso de ID Inexistente:** En `handleStep2Complete`, si `memberId = member?.id || (member as any)?.memberId` se evalúa como `undefined`, el bloque que invoca `registerPetsInSupabase` se omite silenciosamente sin reportar errores, dejando la tabla `pets` en 0.
3. **Mismo problema en `saveProgress`:** Si `memberId` no es recuperado, `saveProgress` también retorna temprano, lo que significa que el progreso del usuario no se actualiza en Supabase en el Paso 2 (solo en el Paso 1).

---

## Cambios Propuestos

### 1. Robustez en el Estado del Componente

#### [MODIFY] [NewRegistrationFlow.tsx](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/src/components/RegistrationV2/NewRegistrationFlow.tsx)

1. **Definir un Helper `getMemberId`:**
   Crear una función pura para extraer de forma robusta y recursiva el ID del miembro de Memberstack de cualquier estructura posible:
   ```typescript
   function getMemberId(m: any): string | null {
       if (!m) return null;
       return m.id || 
              m.memberId || 
              m.member?.id || 
              m.data?.id || 
              m.data?.member?.id ||
              (m.auth && m.auth.id) ||
              null;
   }
   ```

2. **Asegurar la presencia de `id` en `setMember`:**
   Al llamar a `setMember` durante los eventos de registro, login e hidratación inicial, inyectar el ID extraído (`msId`) en la raíz del objeto guardado:
   - Modificar `setMember(signupData || { id: msId })` a `setMember({ id: msId, ...(signupData || {}) })`.
   - Modificar `setMember(loggedMember)` a `setMember({ id: msId, ...(loggedMember || {}) })`.

3. **Fallback en Tiempo de Ejecución en Paso 2:**
   En `handleStep2Complete`, si por retraso de estado de React el `memberId` del estado local sigue siendo nulo, realizar una consulta asíncrona a la sesión de Memberstack activa en el navegador:
   ```typescript
   let memberId = getMemberId(member);
   if (!memberId && typeof window !== 'undefined' && window.$memberstackDom) {
       const session = await window.$memberstackDom.getCurrentMember();
       memberId = getMemberId(session?.data);
       if (memberId) {
           setMember(session.data);
       }
   }
   ```

4. **Actualizar todas las referencias de extracción de ID:**
   Usar `getMemberId(member)` en:
   - `saveProgress` (línea 518)
   - `handleStep2Complete` (línea 904)
   - `handleStep3Complete` (línea 1060)
   - `handleSkipPayment` (línea 1099)
   - `handleStep5Complete` (línea 1174)

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm run type-check` para validar compatibilidad de tipos TypeScript.
- Ejecutar `npm run build` para asegurar que el build de producción no tenga errores de bundling.

### Pruebas Manuales
- Realizar flujo de registro desde el Paso 1 al Paso 3, abandonar en Stripe checkout y verificar que:
  - El usuario aparezca en `users` con `registration_step = 3`.
  - La mascota aparezca creada en `pets` asociada al UUID correcto del usuario en Supabase con status `pending`.
