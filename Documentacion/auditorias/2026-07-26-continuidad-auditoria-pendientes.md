# Continuidad de auditoría integral

Fecha de corte: 2026-07-26
Objetivo: dejar un punto de reanudación preciso para continuar la auditoría sin repetir trabajo ni asumir que el sistema ya está listo para producción.

## Resumen ejecutivo

La primera etapa cerró las vulnerabilidades más directas de suplantación por identificadores enviados desde el navegador y creó una frontera de autorización reutilizable para la futura migración a Supabase Auth. Los flujos visibles continúan usando Memberstack y no se realizaron migraciones de datos.

El sistema todavía no debe declararse completamente auditado. Las áreas más delicadas que faltan son:

1. atomicidad e idempotencia de dinero y saldos;
2. consistencia de bajas y reingresos entre Stripe, Supabase, Memberstack y CRM;
3. autorización coordinada de cargas de archivos;
4. reingreso funcional de centros de bienestar;
5. pruebas reales en staging de APIs, correos y efectos externos;
6. preparación verificable de la migración para eliminar Memberstack.

## Trabajo terminado

### Frontera central de identidad

- `src/lib/memberstack-token.ts` verifica JWT Memberstack en servidor.
- `src/lib/actor-context.ts` evita acoplar las rutas al proveedor de identidad.
- `src/lib/member-auth.ts`, `src/lib/admin-auth.ts` y `src/lib/wellness-auth.ts` resuelven al actor canónico.
- Las rutas administrativas cuentan con una prueba que exige autenticación, excepto el bootstrap deliberado.
- El bootstrap administrativo ya no contiene un secreto predeterminado en código.

### Miembros y mascotas

- Baja y reactivación exigen al titular autenticado.
- Preferencias, bienvenida, perfil, apelaciones, chat, cambio de plan y emergencia exigen sesión.
- Las mutaciones activas de mascotas verifican al miembro y la propiedad de la mascota.
- `update-pet-docs` y `fulfill-request` exigen sesión o enlace firmado completo.
- Los enlaces de documentación vinculan miembro, índice canónico, mascota y propietario.

### Solicitudes de apoyo

- La creación de solicitudes exige al miembro autenticado.
- El expediente administrativo y sus URLs firmadas exigen administrador.
- Los clientes principales adjuntan Bearer token.

### Embajadores y finanzas administrativas

- Las mutaciones administrativas de comisiones, reintegros y cambio de código exigen administrador.
- La sincronización masiva con Memberstack exige administrador.
- Las pruebas negativas cubren estos límites de autorización.

### Centros de bienestar

- La baja exige al centro autenticado.
- Los cambios administrativos de estado exigen administrador.
- El widget mantiene el JWT del centro en memoria y lo envía al servidor.

### Magic links

- Se eliminó el secreto HMAC de respaldo conocido.
- Los enlaces de documentación fallan de forma cerrada si falta un secreto adecuado.
- La emisión de `POST /api/auth/magic-token` exige JWT del mismo `memberstackId`.
- El widget unificado adjunta el JWT y conserva el fallback hacia registro normal.
- Los tokens existentes, su tabla, duración y consumo no cambiaron.

## Pendientes prioritarios

### P0 — Operaciones financieras atómicas e idempotentes

#### Solicitudes de apoyo

Problema pendiente:

- la verificación de saldo y la inserción ocurren en operaciones separadas;
- dos solicitudes simultáneas pueden consumir el mismo saldo disponible.

Trabajo recomendado:

- crear una función SQL/RPC transaccional;
- bloquear o serializar por membresía y ciclo;
- validar nuevamente elegibilidad, saldo y propiedad dentro de la transacción;
- definir una clave idempotente por intento;
- probar dos solicitudes concurrentes y una repetición de red.

Archivos iniciales:

- `src/app/api/solidarity/request/route.ts`;
- utilidades de ciclo solidario;
- migración SQL nueva y reversible;
- pruebas de saldo y concurrencia.

#### Retiros y comisiones de embajadores

Problema pendiente:

- el alta del payout y el descuento de `pending_payout` no son atómicos;
- los cambios de comisión actualizan referido y acumulados en consultas separadas;
- faltan transiciones cerradas que impidan repetir reversiones o pagos.

Trabajo recomendado:

- RPC transaccional para solicitar retiro;
- RPC transaccional para aprobar, fallar o revertir;
- máquina de estados cerrada para referido y payout;
- montos finitos, positivos, con moneda y límites explícitos;
- idempotencia para reintentos administrativos.

Archivos iniciales:

- `src/app/api/ambassadors/[id]/payouts/route.ts`;
- `src/app/api/payouts/[id]/route.ts`;
- `src/app/api/referrals/[id]/route.ts`;
- servicios y tablas de `ambassadors`, `payouts` y `referrals`.

#### Reembolsos

Problema pendiente:

- `stripe.refunds.create` no usa una clave de idempotencia de la aplicación;
- la persistencia posterior en Supabase no verifica todas las fallas.

Trabajo recomendado:

- idempotency key estable por cargo y operación;
- registro local de intento/resultado;
- reconciliación si Stripe responde correctamente y Supabase falla;
- prueba de doble clic y repetición por timeout.

Archivo inicial:

- `src/app/api/admin/members/[id]/refund/route.ts`.

### P0 — Consistencia de baja y reingreso

#### Miembros

Problemas pendientes:

- Supabase usa `pending_cancellation`, Stripe continúa activo hasta fin del periodo y Memberstack puede marcar al miembro como cancelado de inmediato;
- un fallo de Stripe puede dejar que otros sistemas avancen;
- el reingreso no revierte completamente el historial de cancelación, CRM y notificaciones;
- debe resolverse de forma determinista cuál suscripción se reactiva si existen varias.

Diseño requerido:

- una máquina de estados canónica;
- orden de efectos y compensaciones;
- periodo pagado respetado en Webflow;
- reconciliador para Stripe, Supabase, Memberstack y LynSales;
- correo de confirmación con estado de entrega.

Archivos iniciales:

- `src/app/api/user/deactivate/route.ts`;
- `src/app/api/user/reactivate/route.ts`;
- widgets que interpretan `approval-status` y `membership_status`;
- integración CRM y correos.

#### Embajadores

Problemas pendientes:

- Supabase puede actualizarse aunque Memberstack falle;
- la reactivación vuelve directamente a `approved`;
- falta decidir si el reingreso requiere nueva revisión administrativa;
- se debe confirmar qué ocurre con código, referidos, saldo y sesiones históricas.

Archivos iniciales:

- `src/app/api/ambassadors/[id]/cancel/route.ts`;
- `src/app/api/ambassadors/[id]/reactivate/route.ts`;
- servicios Memberstack y notificaciones de embajador.

#### Centros de bienestar

Problema pendiente:

- no existe un flujo autoservicio de reactivación;
- el centro cancelado solo recibe una opción de contacto por email;
- las actualizaciones quedan bloqueadas después de cancelar.

Decisiones necesarias:

- reactivación automática o solicitud sujeta a revisión;
- conservación de ubicaciones, documentos, citas y datos bancarios;
- estado y permisos durante la revisión;
- aviso a administradores y centro.

Archivos iniciales:

- crear un endpoint de reactivación o solicitud;
- `src/app/api/wellness/update/route.ts`;
- `public/widgets/wellness-center-widget.js`;
- dashboard administrativo de centros.

### P1 — Cargas y documentos

Problema pendiente:

- los endpoints genéricos de Storage tienen consumidores con contratos distintos;
- algunas cargas construyen rutas con IDs del cliente;
- puede existir consumo abusivo, escritura en prefijos ajenos y archivos huérfanos;
- el token HMAC v1 usa `petIndex`, cuyo significado puede cambiar por altas o bajas históricas.

No se debe proteger una sola ruta sin actualizar su consumidor. El lote debe cubrir simultáneamente:

- registro V2;
- completar perfil;
- panel unificado;
- edición administrativa;
- foto y certificado desde enlace;
- documentos solidarios;
- documentos de embajadores;
- logos y ubicaciones de centros.

Diseño recomendado:

- token de carga v2 con `actorId`, `resourceId`, `purpose`, `mime`, tamaño máximo y expiración;
- firmar `petId` estable en lugar de depender únicamente de `petIndex`;
- validar propietario antes de leer el archivo;
- nombres generados por servidor;
- limpieza de archivos huérfanos;
- rate limiting/WAF.

Endpoints iniciales:

- `/api/upload/document`;
- `/api/upload/profile-photo`;
- `/api/upload/pet-photo`;
- `/api/upload/vet-certificate`;
- `/api/upload/solidarity-document`;
- `/api/upload/solidarity-attachment`;
- `/api/upload/ambassador-doc`;
- `/api/upload/ambassador-photo`;
- `/api/upload/wellness-logo`;
- `/api/upload/wellness-location-photo`.

### P1 — Inventario de autorización restante

La matriz existente fue útil como punto de partida, pero quedó parcialmente desactualizada porque varias rutas ya se migraron en esta sesión. Antes del siguiente lote se debe regenerar el inventario desde el código y clasificar cada endpoint por actor.

Familias que todavía requieren revisión individual:

- baja, reactivación, pagos propios, mensajes y código de embajadores;
- mensajes, chat y adjuntos de solidaridad;
- actualización, citas, evidencias y cargas de bienestar;
- integración veterinaria: verificación de código, contexto y consultas;
- `/api/auth/debug-role`, que debe eliminarse o quedar restringido a administradores en producción;
- entradas públicas de captación y validación, que necesitan límites de abuso.

Regla: ninguna ruta que use service role debe considerar un ID del cuerpo o query como prueba de identidad.

### P1 — Mailings y efectos externos

Problemas pendientes:

- los fallos de Resend se registran, pero no existe outbox, reintento ni estado durable de entrega;
- no se comprobó el buzón real de finanzas;
- falta validar contenido y entrega en cada transición;
- LynSales y Memberstack pueden quedar desincronizados si una operación externa falla después de persistir localmente.

Trabajo recomendado:

- tabla outbox con estado, intentos, error y próxima ejecución;
- claves idempotentes por evento;
- reintentos con backoff;
- panel o reporte de mensajes fallidos;
- pruebas en dominio Resend verificado;
- reconciliación de CRM y Memberstack.

Eventos mínimos a probar:

- registro y pago;
- aprobación, rechazo y apelación;
- baja y reingreso de miembro;
- solicitud y resolución de apoyo;
- comisión, retiro, pago y reversión;
- baja y reingreso de embajador;
- baja y reingreso de centro;
- solicitud de documentos faltantes;
- reembolso.

## Validación funcional pendiente en staging

La revisión hasta ahora no ejecutó cargos, reembolsos, correos ni escrituras destructivas contra servicios productivos. Se necesita un entorno aislado con:

- Stripe test mode;
- aplicación Memberstack de prueba o cuentas reversibles;
- proyecto o esquema Supabase de staging;
- dominio/buzón Resend de pruebas;
- espacio LynSales de pruebas;
- cuentas de miembro, embajador, centro y administrador.

Matriz E2E mínima:

| Flujo | Camino exitoso | Fallas inducidas |
| --- | --- | --- |
| Miembro | registro, pago, mascotas, aprobación, cambio de plan, baja, reingreso | Stripe falla, Memberstack falla, CRM falla, doble clic |
| Apoyo | solicitud, documentos, chat, aprobación, reintegro | saldo simultáneo, mascota ajena, archivo inválido, reintento |
| Embajador | registro, aprobación, referido, comisión, retiro, baja, reingreso | payout duplicado, reversión repetida, Memberstack falla |
| Centro | registro, aprobación, perfil, ubicación, cita, evidencia, baja, reingreso | centro ajeno, archivo inválido, aprobación/rechazo repetido |
| Admin | acceso y mutaciones financieras | sin JWT, rol incorrecto, token expirado |

En cada falla inducida se debe comprobar el estado final de Supabase, Stripe, Memberstack, LynSales, Resend y el widget.

## Preparación para migrar completamente a Next.js y Supabase

La migración no debe comenzar eliminando Memberstack. Primero:

1. completar la cobertura de `ActorContext` en todas las rutas sensibles;
2. inventariar campos Memberstack leídos y escritos por API, widgets y Webflow;
3. definir tablas Supabase canónicas para identidad, roles, membresías, mascotas y estados;
4. confirmar en el proyecto real si RLS está habilitado o deshabilitado por tabla; la documentación actual es contradictoria;
5. diseñar políticas RLS y service-role boundaries;
6. implementar dual-read/dual-write observable;
7. comparar resultados y crear reportes de divergencia;
8. migrar sesión a Supabase Auth detrás de `ActorContext`;
9. retirar gradualmente custom fields y widgets dependientes de Memberstack;
10. eliminar Memberstack solo cuando staging y reconciliación demuestren paridad.

## Deuda técnica no bloqueante, pero pendiente

- Next.js advierte múltiples lockfiles y una raíz Turbopack inferida.
- La convención `middleware` está obsoleta y deberá migrarse a `proxy`.
- Lint mantiene 1,095 advertencias heredadas.
- Node advierte que `src/utils/solidarity-cycle.js` no declara su tipo de módulo.
- La suite no tiene script `npm test`; el comando válido actual es:

```powershell
node --test "tests/**/*.test.mjs"
```

No conviene limpiar toda esta deuda dentro de un cambio financiero o de identidad. Debe dividirse en lotes pequeños con pruebas.

## Orden recomendado para mañana

1. Regenerar la matriz real de endpoints y consumidores después de los commits de hoy.
2. Diseñar e implementar atomicidad de solicitudes de apoyo mediante RPC.
3. Diseñar e implementar atomicidad de retiros/comisiones.
4. Añadir idempotencia y reconciliación de reembolsos.
5. Unificar la máquina de estados de baja/reingreso de miembros.
6. Completar reingreso de embajadores y centros.
7. Diseñar el lote coordinado de Storage y token v2.
8. Preparar staging y ejecutar la matriz E2E.
9. Crear el inventario de dependencias Memberstack para la migración.

## Archivos de referencia

- `Documentacion/auditorias/2026-07-26-auditoria-integral-flujos.md`
- `Documentacion/seguridad/matriz-autorizacion-endpoints.md`
- `Documentacion/seguridad/2026-07-26-verificacion-fase-1.md`
- `Documentacion/seguridad/2026-07-26-auditoria-magic-links-y-cargas.md`
- `Documentacion/planeacion/2026-07-26-remediacion-integral-flujos-design.md`
- `Documentacion/planeacion/2026-07-26-fase-1-cierre-autorizacion-plan.md`
- `Documentacion/planeacion/2026-07-26-fase-2-perfil-mascotas-autorizacion-plan.md`
- `Documentacion/planeacion/2026-07-26-endurecimiento-emision-magic-token-diseno.md`
- `Documentacion/planeacion/2026-07-26-endurecimiento-emision-magic-token-plan.md`

## Criterio de cierre de la auditoría

No declarar el sistema completamente listo hasta que:

- todas las rutas sensibles tengan actor verificado y pruebas negativas;
- saldos, comisiones, reintegros y reembolsos sean atómicos e idempotentes;
- bajas y reingresos converjan entre todos los sistemas;
- cargas validen propietario, propósito, MIME, tamaño y expiración;
- la suite tenga cero fallas;
- la matriz E2E pase en staging con fallas inducidas;
- correos y CRM tengan reintento y reconciliación;
- la migración a Supabase tenga inventario, RLS verificada y estrategia de transición reversible.
