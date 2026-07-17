# Seguridad y privacidad del dashboard de embajadores

## Objetivo

Conservar el dashboard independiente y sus conexiones actuales, pero asegurar que cada embajador únicamente consulte o modifique su propia información y que ningún referido sea identificable.

## Arquitectura aprobada

- El widget obtiene el JWT activo mediante `window.$memberstackDom.getMemberCookie()` y lo envía como `Authorization: Bearer`.
- El servidor verifica el JWT con la API administrativa oficial de Memberstack y obtiene el `memberstack_id` desde el token verificado, nunca desde parámetros controlados por el navegador.
- Un helper de servidor resuelve el registro de `ambassadors` cuyo `linked_memberstack_id` coincide con la sesión.
- Se crea una API de dashboard autenticada para lectura y actualización del perfil. Las rutas de código, cancelación, pagos y chat validan la misma propiedad.
- Las rutas administrativas conservan sus capacidades; el widget deja de usar el `PATCH /api/ambassadors/[id]` compartido.

## Privacidad de referidos

La respuesta autenticada proyectará exclusivamente: identificador, nombre enmascarado, plan, comisión, estado y fecha. No se enviarán email, teléfono, Memberstack ID ni el registro original. Cada palabra del nombre se reduce a su inicial seguida de cinco asteriscos: `María González` se muestra como `M***** G*****`.

## Cambio de código

- Sin permiso: el botón crea una notificación administrativa de solicitud y responde `pending_admin`.
- Con permiso: genera una sesión de cambio válida siete días y envía el correo; responde `email_sent`.
- El frontend comunica claramente ambos resultados y nunca muestra un éxito falso.

## Compatibilidad

El endpoint público `by-memberstack` se mantiene temporalmente para registro y visibilidad, pero reduce la información de referidos. El dashboard V2 usa solamente la API autenticada. Materiales siguen siendo públicos; las operaciones personales exigen sesión.

## Verificación

Las pruebas cubren JWT ausente o inválido, propiedad de embajador, proyección de referidos, solicitud de código, perfil, CLABE, pagos, cancelación y chat. Se ejecutan además type-check, build y lint dirigido.
