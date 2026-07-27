# DiseÃ±o de remediaciÃ³n integral de flujos

**Fecha:** 2026-07-26
**Estado:** Aprobado conceptualmente; pendiente de revisiÃ³n documental del usuario
**Alcance:** Miembros, solicitudes de apoyo, embajadores, centros de bienestar, pagos, correos e integraciones
**CondiciÃ³n operativa:** Existen usuarios activos. Todos los cambios deben ser compatibles, reversibles y verificables.

## 1. Objetivo

Corregir las vulnerabilidades, carreras de concurrencia, inconsistencias de estados y contratos rotos encontrados en la auditorÃ­a del 26 de julio de 2026, sin interrumpir los recorridos actuales ni retirar Memberstack en esta etapa.

La arquitectura resultante debe permitir que Supabase se convierta gradualmente en la fuente canÃ³nica de identidad y datos. Memberstack continuarÃ¡ funcionando mediante un adaptador de compatibilidad hasta que exista un proyecto separado y aprobado para retirarlo.

## 2. Principios de seguridad

1. NingÃºn endpoint sensible aceptarÃ¡ un identificador enviado por el navegador como prueba de identidad.
2. La identidad se resolverÃ¡ siempre desde una credencial verificada server-side.
3. Las rutas administrativas exigirÃ¡n una sesiÃ³n administrativa vÃ¡lida y permisos explÃ­citos.
4. Las operaciones financieras usarÃ¡n transacciones o funciones SQL/RPC atÃ³micas.
5. Las operaciones repetibles usarÃ¡n claves de idempotencia.
6. Cada transiciÃ³n conservarÃ¡ auditorÃ­a suficiente para reconciliar sistemas.
7. CORS se tratarÃ¡ Ãºnicamente como polÃ­tica de navegador, nunca como autenticaciÃ³n.
8. Ninguna migraciÃ³n se ejecutarÃ¡ en producciÃ³n durante la implementaciÃ³n local.

## 3. Arquitectura de identidad transicional

### 3.1 Contrato neutral

Se introducirÃ¡ un contexto de actor independiente del proveedor:

```ts
type ActorRole = "member" | "ambassador" | "wellness_center" | "admin";

interface ActorContext {
  role: ActorRole;
  supabaseUserId?: string;
  memberstackId?: string;
  ambassadorId?: string;
  wellnessCenterId?: string;
  permissions: string[];
}
```

Los endpoints consumirÃ¡n `ActorContext`, no APIs de Memberstack directamente. Durante esta etapa, un adaptador verificarÃ¡ el JWT de Memberstack y resolverÃ¡ los IDs relacionados en Supabase. En una migraciÃ³n futura se podrÃ¡ incorporar un adaptador de Supabase Auth sin cambiar los contratos de los endpoints.

### 3.2 AutorizaciÃ³n

Se definirÃ¡n guardas reutilizables:

- `requireMemberActor(request)`
- `requireAmbassadorActor(request, expectedAmbassadorId?)`
- `requireWellnessActor(request, expectedCenterId?)`
- `requireAdminActor(request, permission?)`

Las guardas devolverÃ¡n respuestas 401 para credenciales ausentes o invÃ¡lidas y 403 para actores autenticados sin propiedad o permisos.

### 3.3 Compatibilidad de clientes

Los widgets existentes obtendrÃ¡n el JWT desde la sesiÃ³n activa de Memberstack y lo enviarÃ¡n en `Authorization: Bearer <token>`. Los IDs del cuerpo se conservarÃ¡n temporalmente cuando sean necesarios para compatibilidad, pero el servidor los ignorarÃ¡ como fuente de identidad y rechazarÃ¡ cualquier discrepancia.

No se cambiarÃ¡n URLs pÃºblicas salvo que sea indispensable. Las respuestas conservarÃ¡n las propiedades utilizadas por los widgets actuales.

## 4. Fases de implementaciÃ³n

### Fase 1 â€” Cierre de autorizaciÃ³n

Se protegerÃ¡n primero:

- `/api/user/deactivate`
- `/api/user/reactivate`
- `/api/solidarity/request`
- `/api/admin/solidarity/requests/[id]`
- `/api/referrals/[id]`
- `/api/payouts/[id]`
- `/api/wellness/cancel`
- `/api/admin/wellness/[id]/status`
- `/api/admin/ambassadors/[id]/enable-code-change`
- `/api/admin/ambassadors/sync-memberstack`

TambiÃ©n se revisarÃ¡ el resto de rutas Service Role detectadas por el barrido para evitar que quede otra mutaciÃ³n equivalente sin protecciÃ³n.

**Compatibilidad:** primero se actualizarÃ¡n widgets para enviar credencial; despuÃ©s se activarÃ¡ el rechazo estricto server-side dentro de la misma entrega verificada. No se desplegarÃ¡ una mitad sin la otra.

**Rollback:** revertir conjuntamente cliente y guardas. No requiere reversiÃ³n de datos.

### Fase 2 â€” Atomicidad financiera

Se crearÃ¡n migraciones locales para funciones SQL/RPC que:

- reserven un retiro de embajador y pongan el saldo en cero en una transacciÃ³n;
- aprueben o ajusten una comisiÃ³n y actualicen saldos de forma atÃ³mica;
- validen y consuman saldo solidario en la misma transacciÃ³n;
- restauren saldo solamente mediante transiciones permitidas;
- registren una clave de idempotencia Ãºnica por operaciÃ³n.

Las funciones rechazarÃ¡n:

- montos no finitos, cero o negativos;
- montos superiores a lÃ­mites configurados;
- estados fuera de catÃ¡logos cerrados;
- transiciones de estado invÃ¡lidas;
- una clave de idempotencia ya procesada con parÃ¡metros diferentes.

**Compatibilidad:** las API Routes conservarÃ¡n su contrato HTTP y delegarÃ¡n a RPC.

**Rollback:** conservar temporalmente el cÃ³digo anterior detrÃ¡s de una opciÃ³n server-side desactivada por defecto. La migraciÃ³n serÃ¡ aditiva; no eliminarÃ¡ columnas o tablas.

### Fase 3 â€” MÃ¡quinas de estados y reconciliaciÃ³n

Se formalizarÃ¡n las transiciones:

- membresÃ­a: `active â†’ pending_cancellation â†’ cancelled â†’ reactivation_pending/active`;
- comisiÃ³n: `pending â†’ approved â†’ payout_pending â†’ paid`, con `cancelled` o `reversed` por caminos explÃ­citos;
- payout: `pending â†’ processing â†’ completed` o `failed`;
- solidaridad: estados actuales normalizados con transiciones permitidas y montos aprobados consistentes;
- centro y embajador: `pending â†’ approved/rejected`, `approved â†’ cancelled`, `cancelled â†’ reactivation_pending â†’ approved`.

La cancelaciÃ³n de miembro mantendrÃ¡ beneficios durante el periodo pagado:

- Stripe: `cancel_at_period_end = true`;
- Supabase: `pending_cancellation`;
- Memberstack: estado compatible que no bloquee prematuramente el widget;
- CRM: estado de cancelaciÃ³n programada, no cancelaciÃ³n final;
- webhook: transiciÃ³n final a `cancelled` al terminar efectivamente la suscripciÃ³n.

Se aÃ±adirÃ¡ una reconciliaciÃ³n idempotente para reintentar sincronizaciones parciales sin duplicar efectos.

### Fase 4 â€” Reingresos

#### Miembros

- Antes del vencimiento: retirar `cancel_at_period_end` y volver a `active`.
- DespuÃ©s del vencimiento: dirigir a una nueva contrataciÃ³n, sin intentar revivir una suscripciÃ³n terminada.
- Sincronizar Supabase, Stripe, Memberstack y CRM.
- Registrar auditorÃ­a y enviar confirmaciÃ³n.

#### Embajadores

- La baja conserva referidos, cÃ³digo, historial y saldos.
- El reingreso crea `reactivation_pending`; no aprueba automÃ¡ticamente.
- Un administrador aprueba el reingreso y reactiva Memberstack.

#### Centros

- Se aÃ±adirÃ¡ solicitud de reingreso autenticada.
- El centro cancelado podrÃ¡ actualizar solamente los datos necesarios para su revisiÃ³n.
- Un administrador decidirÃ¡ la reactivaciÃ³n.
- Ubicaciones y citas histÃ³ricas se conservarÃ¡n.

### Fase 5 â€” Correos confiables

Las operaciones principales no se revertirÃ¡n por un fallo de email. En su lugar:

- cada envÃ­o tendrÃ¡ un registro con evento, destinatario, plantilla, estado y nÃºmero de intentos;
- los fallos quedarÃ¡n en `pending_retry`;
- un proceso protegido podrÃ¡ reintentar;
- las plantillas seguirÃ¡n usando los generadores actuales;
- no se almacenarÃ¡ el cuerpo completo cuando contenga informaciÃ³n sensible;
- las pÃ¡ginas administrativas mostrarÃ¡n el estado de entrega cuando sea relevante.

La implementaciÃ³n inicial podrÃ¡ usar una tabla de outbox en Supabase y un cron de Vercel protegido con secreto.

## 5. Datos y migraciones

Todas las migraciones serÃ¡n aditivas e idempotentes. No se eliminarÃ¡n tablas, columnas, Ã­ndices o datos.

Las migraciones previstas incluirÃ¡n:

- catÃ¡logo/auditorÃ­a de operaciones idempotentes;
- funciones RPC financieras;
- campos o tabla para solicitudes de reactivaciÃ³n;
- tabla de outbox de correos;
- restricciones e Ã­ndices Ãºnicos necesarios para impedir duplicados.

Cada archivo SQL tendrÃ¡:

- precondiciones;
- operaciÃ³n principal;
- consultas de verificaciÃ³n;
- instrucciones de rollback lÃ³gico;
- advertencia visible de no ejecutarlo automÃ¡ticamente en producciÃ³n.

## 6. Manejo de fallos

1. Los errores de autenticaciÃ³n no revelarÃ¡n si un ID ajeno existe.
2. Los errores de proveedor se clasificarÃ¡n por sistema y operaciÃ³n.
3. Una operaciÃ³n local confirmada con sincronizaciÃ³n externa pendiente quedarÃ¡ como `sync_pending`.
4. Los reintentos serÃ¡n idempotentes.
5. NingÃºn `catch` crÃ­tico devolverÃ¡ Ã©xito si fallÃ³ la operaciÃ³n canÃ³nica.
6. Las respuestas pÃºblicas no expondrÃ¡n mensajes internos, secretos o datos bancarios.
7. Las URLs firmadas solo se generarÃ¡n despuÃ©s de autorizaciÃ³n y por el mÃ­nimo tiempo necesario.

## 7. Estrategia de pruebas

### 7.1 TDD obligatorio

Cada correcciÃ³n comenzarÃ¡ con una prueba que falle por la vulnerabilidad o defecto especÃ­fico. Se verificarÃ¡ el fallo, se harÃ¡ el cambio mÃ­nimo y se confirmarÃ¡ que pase antes de continuar.

### 7.2 Pruebas de autorizaciÃ³n

Para cada endpoint sensible:

- sin token â†’ 401;
- token invÃ¡lido â†’ 401;
- actor vÃ¡lido pero ajeno â†’ 403;
- propietario correcto â†’ operaciÃ³n permitida;
- administrador sin permiso â†’ 403;
- administrador autorizado â†’ operaciÃ³n permitida.

### 7.3 Pruebas de concurrencia e idempotencia

- dos retiros simultÃ¡neos producen una sola reserva;
- dos solicitudes solidarias simultÃ¡neas no exceden el saldo;
- repetir una aprobaciÃ³n con la misma clave no duplica comisiÃ³n;
- cambiar parÃ¡metros con una clave ya usada se rechaza;
- una transiciÃ³n fallida no puede devolver saldo mÃ¡s de una vez.

### 7.4 RegresiÃ³n

Se corregirÃ¡n las tres pruebas actualmente fallidas:

- resoluciÃ³n de `memberstack_id`;
- persistencia complementaria de centro;
- pestaÃ±as mÃ³viles de embajador.

DespuÃ©s de cada fase se ejecutarÃ¡n:

```text
suite focal â†’ suite completa â†’ npm run type-check â†’ npm run lint â†’ npm run build
```

### 7.5 Sandbox externo

Antes de producciÃ³n se requerirÃ¡ una prueba manual controlada con:

- Stripe test mode;
- usuarios Memberstack de prueba;
- proyecto Supabase staging;
- destinatarios Resend de prueba;
- contacto CRM de prueba.

No se usarÃ¡n miembros reales para validar efectos destructivos.

## 8. Despliegue y rollback

La entrega tÃ©cnica se prepararÃ¡ por fases independientes, pero no se harÃ¡ commit, push o despliegue sin autorizaciÃ³n.

Para producciÃ³n se recomienda:

1. respaldo y consultas de conteo;
2. migraciones aditivas;
3. despliegue de cÃ³digo compatible;
4. smoke tests con cuentas de prueba;
5. monitoreo de 401/403, errores de RPC, webhooks y outbox;
6. pausa entre fases para observar comportamiento real.

Rollback:

- revertir cÃ³digo a la versiÃ³n anterior;
- desactivar uso de nuevas RPC mediante configuraciÃ³n server-side;
- conservar tablas y registros aditivos para auditorÃ­a;
- no ejecutar rollback destructivo de datos.

## 9. DocumentaciÃ³n obligatoria

Cada fase actualizarÃ¡:

- plan de implementaciÃ³n;
- matriz endpoint â†’ actor â†’ permiso;
- mÃ¡quina de estados;
- contratos de API afectados;
- migraciÃ³n y rollback;
- pruebas aÃ±adidas y resultados;
- variables de entorno;
- guÃ­a de verificaciÃ³n en staging;
- informe de riesgos residuales.

DespuÃ©s de cualquier push autorizado se actualizarÃ¡ `changelogs/YYYY-MM-DD.md`, conforme a `AGENTS.md`.

## 10. Criterios de aceptaciÃ³n

La remediaciÃ³n se considera lista para revisiÃ³n de despliegue cuando:

1. Todas las rutas sensibles autentican y autorizan server-side.
2. Los IDs del cliente no pueden usarse para actuar sobre otra cuenta.
3. Comisiones, retiros y saldo solidario son atÃ³micos e idempotentes.
4. Los estados permanecen coherentes o quedan en `sync_pending` recuperable.
5. Los usuarios conservan beneficios hasta el final del periodo pagado.
6. Los tres tipos de usuario tienen un recorrido de reingreso definido.
7. Los correos fallidos quedan registrados y pueden reintentarse.
8. La suite completa tiene cero fallos.
9. Build, type-check y lint terminan sin errores.
10. Las pruebas de sandbox externo estÃ¡n documentadas como aprobadas.
11. No se ejecutÃ³ ninguna mutaciÃ³n de producciÃ³n sin autorizaciÃ³n.

## 11. Fuera de alcance

- Retirar Memberstack en esta entrega.
- Migrar usuarios reales a Supabase Auth.
- Modificar precios, porcentajes de comisiÃ³n o lÃ­mites de apoyo.
- RediseÃ±ar visualmente los dashboards fuera de las regresiones identificadas.
- Eliminar datos o esquemas heredados.

La eliminaciÃ³n de Memberstack serÃ¡ un proyecto posterior, apoyado en el contrato neutral de identidad creado aquÃ­.
