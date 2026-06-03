# Planeación: Configuración de GA4, Meta Pixel y Atribución UTM en el Registro

Este documento describe el plan para implementar la medición de tráfico de GA4 y enriquecer el evento `Purchase` de Meta Pixel, adicionando un sistema propio de atribución individual de origen de tráfico (parámetros UTM) persistido en Memberstack y Supabase.

## Objetivos
1. **Atribución de Tráfico (GA4/Meta):** Compartir el `transaction_id` (Stripe Subscription ID `sub_...` o ID de Memberstack) en los eventos de compra de GA4 y Meta Pixel para poder desglosar conversiones individuales en Google Analytics y Meta Ads Manager por canal/campaña.
2. **Atribución Propia en Base de Datos:** Capturar los UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term` y `utm_content`) en la entrada del usuario, persistirlos en el navegador y guardarlos directamente en el perfil del usuario (tanto en Memberstack custom fields como en Supabase `users`) para contar con un primer punto de contacto (first-touch attribution) auditable directamente en SQL.

---

## Cambios Propuestos

### 1. `supabase/migrations/20260603_add_utm_tracking_to_users.sql` [NEW]
- Crear migración SQL para agregar las columnas `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` y `utm_content` a la tabla `public.users`.

### 2. `src/components/Analytics/GoogleTagManager.tsx` [MODIFY]
- Agregar un `useEffect` que capture los parámetros UTM de `window.location.search` al montar el componente en el cliente y los almacene de manera persistente en `localStorage` y `sessionStorage`.
- Habilitar el seguimiento de cambios de ruta (`page_view`) empujando eventos virtuales al `dataLayer`.
- Crear y exportar la función `trackGTMPurchase` compatible con GA4 E-commerce.

### 3. `src/app/actions/user.actions.ts` [MODIFY]
- Modificar `registerUserInSupabase` para mapear los campos UTM desde el objeto `userData` a las nuevas columnas de la base de datos de Supabase.

### 4. `src/components/RegistrationV2/NewRegistrationFlow.tsx` [MODIFY]
- En el paso 1 (creación de cuenta):
  - Recuperar los UTM guardados en `localStorage` o `sessionStorage`.
  - Pasarlos como custom fields al crear el miembro en Memberstack: `'utm-source'`, `'utm-medium'`, `'utm-campaign'`, `'utm-term'` y `'utm-content'`.
  - Enviarlos a `registerUserInSupabase` para el registro inicial en Supabase.
- Al detectarse el pago exitoso (`isPaymentSuccess === true` en `loadSavedState` o en `handleStep3Complete`):
  - Invocar `trackGTMPurchase` para registrar la conversión en GA4/GTM.
  - Modificar la llamada actual de Meta Pixel `trackEvent('Purchase', ...)` para incluir `transaction_id: transactionId`.
  - Emplear `sessionStorage` para evitar disparar eventos duplicados en recargas.

---

## Plan de Verificación

### Pruebas Manuales
1. Ejecutar `npm run dev` localmente.
2. Abrir la página del flujo de registro con parámetros UTM en desarrollo:
   `http://localhost:3000/registro?utm_source=google&utm_medium=cpc&utm_campaign=memberships`
3. Validar con la consola del navegador, Tag Assistant y el inspector de base de datos que:
   - Los UTMs se capturen y almacenen en la sesión del navegador.
   - Al registrarse la cuenta, los UTMs se guarden en Supabase y en los custom fields de Memberstack.
   - Al completar el pago, se registren las conversiones en GA4 y Meta Pixel compartiendo el mismo `transaction_id`.
