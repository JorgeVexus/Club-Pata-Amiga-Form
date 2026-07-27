# Auditoría integral de flujos — 2026-07-26

## Dictamen

El sistema **no debe considerarse listo todavía para usuario final**. El build y el type-check pasan, y gran parte de la lógica tiene pruebas útiles, pero existen vulnerabilidades críticas de autorización en operaciones financieras y de datos sensibles, carreras de concurrencia en saldos, contratos rotos y flujos incompletos de reingreso.

La revisión fue estática y ejecutable sobre el repositorio local. No se realizaron cargos, reembolsos, correos ni escrituras reales contra Stripe, Memberstack, Resend, Supabase o LynSales; esas integraciones requieren un ambiente de pruebas aislado y credenciales verificables.

## Verificación ejecutada

| Verificación                                          | Resultado                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run build`                                       | Pasa; 153 páginas generadas. Advierte raíz incorrecta por múltiples lockfiles y deprecación de `middleware`. |
| `npm run type-check`                                  | Pasa.                                                                                                        |
| `npm run lint`                                        | Pasa con 0 errores y 1,097 advertencias.                                                                     |
| Suite Node (`node --test` sobre archivos de `tests/`) | 239 pruebas: 236 pasan y 3 fallan.                                                                           |

### Pruebas fallidas

1. `tests/user-actions-memberstack-id.test.mjs`: `getPetsByUserId` ya no conserva el contrato que resuelve un UUID de Supabase al `memberstack_id` real.
2. `tests/wellness-registration-v2.test.mjs`: `WellnessComplementaryForm` no conserva la llamada esperada a `/api/wellness/update`; hay riesgo de que la etapa complementaria no persista.
3. `tests/widgets/ambassador-dashboard-v2.test.js`: la navegación móvil de cuatro pestañas ya no cumple el layout 2×2 sin overflow.

## Hallazgos críticos

### C-01 — Operaciones de miembro ejecutables por ID sin autenticar

**Evidencia:** `src/app/api/user/deactivate/route.ts` y `src/app/api/user/reactivate/route.ts` aceptan `memberstackId` del cuerpo y usan el cliente de servicio sin verificar el JWT ni resolver la identidad desde la sesión. `src/middleware.ts` solo configura CORS; no autentica.

**Impacto:** quien conozca o consiga un Memberstack ID podría programar la cancelación o reactivar la suscripción Stripe de otro miembro, cambiar estados en Supabase/Memberstack y disparar correos/CRM.

**Causa raíz:** confianza en un identificador controlado por el cliente como prueba de identidad.

### C-02 — Solicitudes de apoyo sin autenticación y saldo vulnerable a concurrencia

**Evidencia:** `src/app/api/solidarity/request/route.ts` acepta `memberstackId`, consulta saldo existente y después inserta la solicitud en operaciones separadas. No verifica sesión. La comprobación de propiedad de la mascota solo relaciona el ID aportado con los datos consultados.

**Impacto:** suplantación de miembro y creación de solicitudes ajenas. Dos solicitudes simultáneas pueden leer el mismo saldo disponible y exceder el límite antes de que cualquiera de las dos inserciones sea visible.

**Causa raíz:** identidad controlada por el cliente y patrón “leer-validar-insertar” sin transacción/bloqueo/RPC atómica.

### C-03 — Documentos privados de solicitudes expuestos desde una API admin sin autenticación

**Evidencia:** `src/app/api/admin/solidarity/requests/[id]/route.ts` no llama a `getAdminUser`; utiliza Service Role y genera URLs firmadas de una hora para documentos privados.

**Impacto:** un tercero que conozca o enumere IDs de solicitudes puede obtener expedientes y enlaces temporales a documentos sensibles.

**Causa raíz:** asumir que el prefijo `/api/admin` protege una ruta. El middleware actual no lo hace.

### C-04 — Comisiones modificables sin autenticación

**Evidencia:** `src/app/api/referrals/[id]/route.ts` permite cambiar monto y `commission_status` sin autenticar administrador. Usa Service Role, recalcula comisión y modifica `total_earnings`/`pending_payout`.

**Impacto:** alteración directa de comisiones y saldos financieros; también puede disparar correos de comisión.

**Causa raíz:** el frontend usa `adminFetch`, pero el endpoint no valida la credencial.

### C-05 — Pagos a embajadores modificables sin autenticación

**Evidencia:** `src/app/api/payouts/[id]/route.ts` permite `PATCH` sin `getAdminUser`, acepta cualquier `status`, `payment_reference`, `notes` y `admin_id`, y puede devolver saldo al embajador.

**Impacto:** falsificar pagos completados/fallidos, referencias y administradores; devolver saldo indebidamente mediante transiciones repetidas.

**Causa raíz:** falta de autenticación, máquina de estados y validación de transiciones.

### C-06 — Cancelación de centro sin autenticación

**Evidencia:** `src/app/api/wellness/cancel/route.ts` confía en `memberstack_id` enviado desde `public/widgets/wellness-center-widget.js` y actualiza con Service Role.

**Impacto:** baja de cualquier centro cuyo Memberstack ID sea conocido.

**Causa raíz:** el widget no envía JWT y la API no resuelve propiedad server-side.

## Hallazgos altos

### A-01 — Retiros de embajador no atómicos

`src/app/api/ambassadors/[id]/payouts/route.ts` autentica correctamente al embajador, pero crea el payout y después pone `pending_payout` en cero. Solicitudes concurrentes pueden crear retiros duplicados con el mismo saldo. Si el segundo update falla, queda un payout registrado sin descontar saldo; el comentario de “rollback manual” no implementa rollback.

### A-02 — Ajustes de comisión no atómicos

`src/app/api/referrals/[id]/route.ts` actualiza referido y saldo en consultas separadas, sin comprobar errores en varias actualizaciones. Además del C-04, dos operaciones concurrentes pueden perder actualizaciones o duplicar diferencias.

### A-03 — Reembolso no idempotente a nivel de aplicación

`src/app/api/admin/members/[id]/refund/route.ts` sí exige administrador y revisa el estado previo del cargo, pero no usa `idempotencyKey` en `stripe.refunds.create`. Dos solicitudes simultáneas pueden competir; la actualización posterior en Supabase tampoco valida su error.

### A-04 — Cancelación de miembro deja estados contradictorios

`src/app/api/user/deactivate/route.ts` deja Supabase en `pending_cancellation` y Stripe activo hasta fin del período, pero cambia inmediatamente Memberstack a `approval-status: cancelled`. El propio comentario dice que Webflow consume ese estado. El usuario puede perder acceso visual antes de la fecha pagada mientras Stripe sigue activo.

Si Stripe falla, el error se registra pero el flujo continúa creando la baja. También es posible marcar Memberstack/Supabase aunque la suscripción no se haya programado correctamente.

### A-05 — Centro de bienestar no tiene reactivación funcional

No existe `/api/wellness/reactivate`. El widget cancelado únicamente ofrece `mailto:aliados@pataamiga.mx`, y `src/app/api/wellness/update/route.ts` bloquea expresamente los centros cancelados. Por tanto, la opción de reingreso solicitada no está implementada como flujo del producto.

### A-06 — Rutas administrativas adicionales sin protección consistente

El barrido encontró rutas sensibles que no muestran `getAdminUser`, entre ellas:

- `src/app/api/admin/wellness/[id]/status/route.ts`
- `src/app/api/admin/ambassadors/[id]/enable-code-change/route.ts`
- `src/app/api/admin/ambassadors/sync-memberstack/route.ts`

Cada una debe verificarse y protegerse explícitamente; CORS no sustituye autenticación.

## Hallazgos medios

### M-01 — Correos sin garantía de entrega

Cancelación, comisiones y avisos administrativos capturan fallos de correo y continúan sin outbox, reintento ni estado de entrega. Es adecuado no revertir toda la operación por un fallo de email, pero actualmente el mensaje puede perderse sin recuperación. El correo de retiros está fijado a `finanzas@pataamiga.mx` y debe validarse en el ambiente real.

### M-02 — Flujo de reactivación de miembro incompleto entre sistemas

La reactivación vuelve a habilitar Stripe, Memberstack y Supabase, pero no revierte el registro de cancelación ni sincroniza CRM, no envía confirmación y no valida que la suscripción seleccionada sea realmente la que corresponde cuando existen varias.

### M-03 — Flujo de baja/reactivación de embajador con compensación incompleta

Los endpoints de embajador autentican propiedad, conservan código e historial y eliminan sesiones al cancelar. Sin embargo, Supabase se actualiza antes que Memberstack; si Memberstack falla se devuelve éxito con sistemas desincronizados. La reactivación restaura directamente `approved`, sin nueva revisión ni control administrativo.

### M-04 — Validación insuficiente de montos y estados

Las rutas de referidos, payouts y actualizaciones de solidaridad deben aplicar listas cerradas de estados, montos finitos/no negativos, máximos, moneda y transiciones válidas. Actualmente varios valores vienen directamente del cuerpo.

### M-05 — Deuda técnica visible

Lint informa 1,097 advertencias, incluyendo uso extensivo de `any`, dependencias faltantes de hooks y código sin usar. No bloquea el build, pero reduce la capacidad de detectar regresiones en contratos financieros y de identidad.

## Cobertura por flujo

| Flujo                | Lo que sí existe                                                                                        | Estado                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Miembros             | registro, pagos, aprobación/rechazo, mascotas, apelaciones, cancelación, reactivación y reembolso admin | Parcial; cancelación/reactivación inseguras y estados inconsistentes          |
| Solicitudes de apoyo | elegibilidad, carencia, saldo anual, CLABE, documentos, chat, revisión y notificaciones                 | Parcial; creación insegura, carrera de saldo y exposición de documentos admin |
| Embajadores          | registro, aprobación, código, referidos, comisión, retiro, baja y reactivación                          | Parcial; comisión/payout admin críticos y retiros no atómicos                 |
| Centros de bienestar | registro, perfil, ubicaciones, citas, evidencias, baja y administración                                 | Parcial; contratos rotos, baja insegura y sin reingreso autoservicio          |
| Mailings             | plantillas y envíos para múltiples transiciones                                                         | Parcial; no se probó entrega real y no hay recuperación confiable             |

## Orden recomendado de corrección

1. Bloquear inmediatamente C-01 a C-06 con autenticación server-side y pruebas negativas.
2. Convertir retiros, comisiones y consumo de saldo solidario en funciones SQL/RPC transaccionales e idempotentes.
3. Definir máquinas de estados cerradas para membresía, solicitud, comisión y payout.
4. Unificar la semántica de `pending_cancellation` entre Stripe, Supabase, Memberstack, CRM y widgets.
5. Implementar reingreso de centros y completar compensaciones/reconciliación de miembros y embajadores.
6. Corregir las tres pruebas fallidas y añadir E2E de los cuatro recorridos.
7. Ejecutar pruebas de integración en sandbox con Stripe test mode, cuenta Memberstack de prueba, Supabase staging, dominio Resend verificado y CRM de pruebas.

## Criterio de salida a producción

No declarar listo hasta que:

- ninguna ruta sensible acepte identidad solo desde el cuerpo/query;
- todas las rutas admin rechacen llamadas sin sesión válida;
- las operaciones financieras sean atómicas e idempotentes;
- la suite quede en 0 fallos;
- se prueben cancelación/reactivación, comisión/reversión/retiro, reembolso y solicitud/reintegro con datos reales de sandbox;
- se reconcilien estados entre Supabase, Memberstack, Stripe y CRM después de fallos inducidos;
- se verifique entrega y contenido de todos los correos en un buzón de pruebas.
