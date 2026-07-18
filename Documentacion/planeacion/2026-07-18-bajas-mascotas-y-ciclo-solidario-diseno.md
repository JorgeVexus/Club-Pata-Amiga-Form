# Diseño: aprobación de bajas de mascotas y ciclo anual del Fondo Solidario

**Fecha:** 18 de julio de 2026  
**Estado:** aprobado conceptualmente por el usuario; pendiente de revisión documental  
**Alcance:** dashboard unificado de miembros, dashboard administrativo, APIs y persistencia en Supabase

## Objetivos

1. Una solicitud de baja iniciada por un miembro no debe liberar inmediatamente el cupo de la mascota.
2. Administración debe poder aprobar o rechazar cada solicitud desde una cola explícita.
3. Una baja aprobada libera el cupo; una baja rechazada devuelve la mascota a su presentación normal de “Aprobado”.
4. Los saldos anuales del Fondo Solidario deben renovarse en el aniversario del primer pago de la membresía, no el 1 de enero.
5. La interfaz debe mostrar la fecha real de próxima renovación, incluyendo día, mes y año.

## Hallazgos del sistema actual

- `/api/user/pets/unsubscribe` desactiva inmediatamente la mascota en Memberstack y Supabase.
- El mismo endpoint es utilizado por el miembro, administración y la automatización por fallecimiento.
- `pet_unsubscriptions` funciona actualmente como auditoría terminal y no tiene estados de revisión.
- La lógica de ciclo de vida considera cualquier registro histórico de baja como evidencia de una baja definitiva.
- El dashboard administrativo permite ejecutar una baja directa desde el detalle del miembro, pero no contiene una cola de solicitudes ni acciones de aprobar/rechazar.
- `/api/solidarity/balance` consulta solicitudes desde el 1 de enero del año actual.
- La interfaz escribe de forma fija “tu saldo se renueva en enero”.
- `users.payment_completed_at` se actualiza en cada renovación de Stripe, por lo que no representa de forma confiable el primer pago.

## Arquitectura elegida

### 1. Solicitudes de baja como entidad con estados

`pet_unsubscriptions` se convierte en la fuente de verdad del proceso y conserva su función de auditoría. Se añaden los campos:

- `status`: `pending | approved | rejected`.
- `requested_at`: fecha de solicitud.
- `reviewed_at`: fecha de resolución administrativa.
- `reviewed_by`: identificador del administrador.
- `review_notes`: explicación opcional de la resolución.

Los registros históricos existentes se migran a `approved`, porque representan bajas ya ejecutadas.

Solo puede existir una solicitud `pending` por mascota. Un índice único parcial impide duplicados concurrentes.

### 2. Máquina de estados

#### Solicitud del miembro

1. Validar el identificador Memberstack recibido según el patrón actual, la pertenencia de la mascota y que siga activa.
2. Comprobar que no exista otra solicitud pendiente.
3. Insertar `pet_unsubscriptions.status = 'pending'`.
4. Mantener `pets.status = 'approved'` e `is_active = true`.
5. No modificar `pet-N-is-active` en Memberstack.
6. Responder con la solicitud creada y actualizar la UI a “Baja solicitada”.

#### Aprobación administrativa

1. Bloquear y validar que la solicitud continúe en `pending`.
2. Actualizar la mascota a `status = 'unsubscribed'`, `is_active = false` y guardar los datos de baja.
3. Actualizar `pet-N-is-active = false` en Memberstack.
4. Marcar la solicitud `approved`, con administrador y fecha.
5. Enviar una notificación al miembro.
6. A partir de esta resolución, la mascota deja de contar como cupo activo y se habilita el registro de otra.

#### Rechazo administrativo

1. Validar que la solicitud continúe en `pending`.
2. Marcarla `rejected`, con administrador, fecha y motivo.
3. Mantener la mascota `approved` y activa; no tocar Memberstack.
4. Enviar una notificación al miembro.
5. La UI vuelve a “Aprobado” y permite solicitar nuevamente la baja.

#### Bajas directas de administración y fallecimiento

Las bajas iniciadas expresamente por un administrador y las automatizaciones por fallecimiento conservan la ejecución inmediata. Internamente crearán o resolverán un registro como `approved`, reutilizando un único servicio de finalización para evitar divergencias.

### 3. Compatibilidad del ciclo de vida

Las utilidades que hoy interpretan cualquier fila de `pet_unsubscriptions` como baja terminal deberán cambiar:

- Un registro sin `status` se considera `approved` para compatibilidad histórica.
- Solo `status = 'approved'` vuelve terminal a una mascota.
- `pending` añade metadata de presentación, pero no desactiva ni libera el cupo.
- `rejected` permanece como auditoría y no afecta el ciclo de vida.

`/api/user/pets` y `/api/solidarity/stats` expondrán `unsubscription_request_status` y el identificador de la solicitud pendiente cuando corresponda.

### 4. Presentación para el miembro

- Las tarjetas y el expediente muestran el badge “Baja solicitada” cuando existe una solicitud pendiente.
- La tarjeta no se vuelve gris y la mascota continúa contando dentro de “Mis peludos”.
- El botón de baja se reemplaza por un mensaje de revisión y no permite duplicar la solicitud.
- Una aprobación actualiza la mascota a “Dada de baja” y recalcula el número de cupos disponibles.
- Un rechazo restaura el badge “Aprobado” y vuelve a mostrar la acción de solicitar baja.

### 5. Cola administrativa

Se añade una vista “Bajas de mascotas” dentro del grupo de Mascotas del dashboard administrativo.

La cola muestra:

- Mascota y miembro.
- Motivo y descripción.
- Fecha y tiempo de espera de la solicitud.
- Estado actual.
- Acciones “Aprobar baja” y “Rechazar solicitud”.

La vista tendrá filtros `Pendientes`, `Aprobadas`, `Rechazadas` y `Todas`. Las acciones exigirán confirmación; el rechazo exigirá un motivo. Después de resolver, la tabla y los contadores se actualizan sin recargar toda la página.

## Ciclo anual del Fondo Solidario

### 1. Fecha ancla inmutable

Se añade `users.first_payment_at`. Su propósito exclusivo es ser el aniversario de beneficios:

- En `invoice.payment_succeeded`, se asigna únicamente cuando sea `NULL`.
- `payment_completed_at` continúa registrando el pago más reciente para no romper reportes existentes.
- Para usuarios existentes, la migración usa `payment_completed_at` como primera opción y `created_at` como respaldo. Como corrección adicional, la API puede usar el inicio de suscripción de Stripe cuando ya esté disponible en datos sincronizados, sin sobrescribir una fecha ancla confirmada.

### 2. Cálculo del ciclo

A partir de `first_payment_at` y la fecha actual se calculan:

- `cycleStart`: aniversario más reciente que no esté en el futuro.
- `cycleEnd`: aniversario siguiente.
- `renewalDate`: igual a `cycleEnd`.

Ejemplo:

- Primer pago: 14 de julio de 2026.
- Ciclo inicial: 14 de julio de 2026 a 14 de julio de 2027.
- Próxima renovación: 14 de julio de 2027.
- Después del aniversario: ciclo 14 de julio de 2027 a 14 de julio de 2028.

Para fechas del 29 de febrero, los años no bisiestos usan el último día válido de febrero.

### 3. Consumo y respuesta de API

`/api/solidarity/balance` consultará solicitudes con `created_at >= cycleStart` y `created_at < cycleEnd`. La respuesta incluirá:

- `cycleStart`.
- `cycleEnd`.
- `renewalDate`.
- `renewalLabel` opcional para consumidores simples.
- `balances` sin cambios de estructura.

El cálculo sigue siendo global por membresía y compartido entre todas sus mascotas.

### 4. Presentación de las tarjetas

Cada tarjeta mostrará:

> Usaste $X de $Y MXN — tu saldo se renueva el 14 de julio de 2027.

El año superior dejará de depender del año calendario y reflejará el año de cierre del ciclo. No habrá texto fijo de enero.

### 5. Validación contextual de fondos en una nueva solicitud

El aviso amarillo informativo se elimina del estado inicial del formulario. El área de aviso permanece oculta y solo aparece cuando `requestedAmount` supera el saldo disponible de la categoría seleccionada.

El mensaje será dinámico:

- Gastos veterinarios: “Tu solicitud no puede ser procesada como la ingresaste debido a que no cuentas con fondos suficientes en tu fondo de emergencias.”
- Vacunas: “Tu solicitud no puede ser procesada como la ingresaste debido a que no cuentas con fondos suficientes en tu fondo de vacunas.”
- Fallecimiento: “Tu solicitud no puede ser procesada como la ingresaste debido a que no cuentas con fondos suficientes en tu fondo por fallecimiento.”

Mientras el monto exceda el saldo, el botón de envío permanece deshabilitado. Al reducir el monto o cambiar a una categoría con saldo suficiente, el aviso desaparece y el botón recupera su estado normal, siempre que el resto del formulario sea válido.

La API conserva la validación autoritativa usando el saldo del ciclo vigente. Si el monto supera el disponible, devuelve `409` con un código estable `INSUFFICIENT_SOLIDARITY_BALANCE`, la categoría, el monto disponible y el mismo mensaje dinámico. El frontend no confía únicamente en el cálculo visual.

## APIs y límites de seguridad

- Las operaciones del widget siguen siendo API-first; ningún widget público se conecta directamente a Supabase.
- La creación de una solicitud valida el identificador Memberstack y que el miembro sea propietario de la mascota, sin introducir un mecanismo de autenticación distinto al usado actualmente por los widgets Webflow.
- Las resoluciones administrativas usan la autenticación administrativa existente.
- La aprobación será idempotente y rechazará solicitudes ya resueltas con `409`.
- La actualización de Supabase y Memberstack tendrá una secuencia explícita y compensación segura si Memberstack falla, evitando liberar el cupo en una sola fuente.
- Las notificaciones incluirán metadata canónica para abrir el expediente de la mascota.

## Estrategia de pruebas

1. Solicitar una baja crea `pending` sin cambiar `is_active` ni Memberstack.
2. Una segunda solicitud pendiente para la misma mascota devuelve `409`.
3. Aprobar cambia la mascota a terminal y libera exactamente un cupo.
4. Rechazar mantiene la mascota activa y permite una solicitud posterior.
5. Las utilidades históricas ignoran `pending` y `rejected`, pero respetan filas antiguas sin estado.
6. La cola administrativa lista y resuelve únicamente solicitudes autorizadas.
7. La tarjeta del miembro muestra “Baja solicitada” y no ofrece agregar mascota antes de la aprobación.
8. El ciclo anual calcula correctamente antes, durante y después del aniversario.
9. Se prueba el 29 de febrero y el cambio de año.
10. La consulta de saldo usa los límites exactos `[cycleStart, cycleEnd)`.
11. El widget renderiza la fecha devuelta por la API y no contiene el texto fijo “enero”.
12. El aviso de fondos insuficientes está oculto cuando el monto está vacío o cabe dentro del saldo.
13. El aviso y el bloqueo aparecen al exceder el saldo y cambian de copy con la categoría.
14. La API rechaza montos superiores aunque se omita la validación del navegador.

## Fuera de alcance

- Cambiar los montos máximos del Fondo Solidario.
- Prorratear saldos por cambios de plan.
- Permitir que el miembro cancele una solicitud de baja pendiente.
- Eliminar historiales de bajas rechazadas o aprobadas.
