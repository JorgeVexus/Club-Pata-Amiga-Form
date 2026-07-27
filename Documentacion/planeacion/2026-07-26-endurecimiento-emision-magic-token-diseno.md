# Diseño de endurecimiento de emisión de magic tokens

Fecha: 2026-07-26

## Objetivo

Impedir que un navegador genere un token de continuidad para una cuenta ajena enviando un `memberstackId` manipulado, sin alterar el contrato visible del registro, los tokens ya emitidos ni la experiencia de miembros activos.

## Alcance

Este cambio cubre exclusivamente:

- `POST /api/auth/magic-token`;
- el consumidor de esa operación en `public/widgets/unified-membership-widget.js`;
- CORS para permitir el encabezado `Authorization`;
- pruebas automatizadas y documentación de seguridad.

Quedan fuera de este bloque:

- cambios de esquema en `magic_tokens`;
- migración a Supabase Auth;
- modificación de `GET /api/auth/magic-token`;
- endurecimiento integral de los endpoints compartidos de almacenamiento;
- rediseño del registro o del pago.

## Problema confirmado

El widget obtiene el miembro activo desde Memberstack y envía al servidor:

- `memberstackId`;
- email;
- un subconjunto de campos personalizados.

Sin embargo, no adjunta el JWT de la sesión. El endpoint acepta esos valores del cuerpo y usa la service role de Supabase para crear el token. Por lo tanto, el servidor no demuestra que quien solicita el token controla la cuenta indicada.

El proyecto ya cuenta con dos piezas reutilizables:

- `window.$memberstackDom.getMemberCookie()` en los widgets para obtener el JWT;
- `requireMemberActor(request, expectedMemberstackId)` en el servidor para verificar el JWT, resolver al miembro y comparar identidades.

## Diseño aprobado

### Flujo de emisión

1. El widget obtiene el JWT de la sesión mediante `getMemberCookie()`.
2. Si no existe JWT, no solicita un magic token y utiliza el fallback vigente hacia el registro normal.
3. Si existe JWT, el widget envía `Authorization: Bearer <token>` junto con el cuerpo actual.
4. El endpoint valida primero la forma de `memberstackId` y email.
5. El endpoint invoca `requireMemberActor(request, memberstackId)`.
6. Solo si el actor autenticado coincide con el miembro solicitado se genera y almacena el token.
7. La respuesta exitosa conserva `{ success: true, token }`.

### Contratos preservados

- Se mantiene `POST /api/auth/magic-token`.
- Se mantienen los campos actuales del cuerpo.
- Se mantiene la vigencia de 10 minutos.
- Se mantiene el token aleatorio de 32 bytes.
- Se mantiene `intent: complete_payment`.
- No se invalidan registros existentes en `magic_tokens`.
- `GET /api/auth/magic-token?token=...` permanece sin cambios.
- `NewRegistrationFlow` continúa consumiendo el token de la misma forma.

### CORS

`Access-Control-Allow-Headers` incluirá:

- `Content-Type`;
- `Authorization`.

Se conserva temporalmente el origen abierto para no introducir en este bloque un cambio adicional de compatibilidad con Webflow. La identidad deja de depender del origen porque se verifica criptográficamente mediante el JWT.

## Manejo de errores

- Cuerpo inválido: se conservan las respuestas `400`.
- JWT ausente, inválido o expirado: respuesta `401` producida por la autorización central.
- JWT válido de otro miembro: respuesta `403`.
- Miembro no resuelto en Supabase: respuesta segura de la autorización central.
- Error de inserción: se conserva la respuesta `500` sin exponer datos internos.
- En cualquier respuesta no exitosa, el widget conserva su fallback hacia `/registro?reason=complete_payment`.

El endpoint no debe generar bytes aleatorios ni escribir en `magic_tokens` antes de que termine la autorización.

## Datos auxiliares

El email y `customFields` siguen llegando desde el cliente autenticado para preservar el contrato actual. No otorgan acceso por sí mismos: el identificador de cuenta debe coincidir con el JWT. Una fase posterior puede resolver esos datos desde una fuente canónica si se decide reducir todavía más la confianza en el cliente.

## Pruebas

Se añadirá cobertura de regresión que demuestre:

1. El endpoint exige `requireMemberActor(request, memberstackId)` antes de insertar.
2. El widget obtiene el JWT y envía `Authorization: Bearer`.
3. CORS acepta `Authorization`.
4. La respuesta y el flujo de consumo existentes no cambian.
5. El widget mantiene el fallback cuando no puede obtener sesión o generar el token.

La implementación seguirá RED–GREEN:

1. crear la prueba;
2. ejecutarla y confirmar que falla por la ausencia de autenticación;
3. realizar el cambio mínimo;
4. ejecutar la prueba enfocada;
5. ejecutar suite completa, type-check, lint y build.

## Compatibilidad y despliegue

No hay migraciones de datos ni cambios de esquema. El despliegue puede convivir con tokens emitidos antes del cambio, porque únicamente se endurece la creación futura. Si Memberstack no entrega una sesión válida, el usuario no queda bloqueado: continúa por el registro normal existente.

## Riesgo residual

- `Access-Control-Allow-Origin` continúa abierto por compatibilidad.
- Los campos auxiliares continúan originándose en el cliente autenticado.
- Los endpoints de carga compartidos requieren un proyecto separado para autenticar cada consumidor sin romper registro, administración o enlaces por correo.

Estos riesgos no reabren la suplantación de `memberstackId` corregida en este bloque, pero deben permanecer en la matriz de seguridad hasta su migración.

## Criterios de aceptación

- Una solicitud sin JWT no puede crear un magic token.
- Un miembro no puede crear un token para otro `memberstackId`.
- El usuario autenticado correcto conserva la redirección sin fricción.
- La ausencia o expiración de sesión conserva el fallback de registro.
- No se alteran tokens existentes, esquema, pago ni lectura del magic token.
- Toda la verificación obligatoria del repositorio finaliza sin errores.
