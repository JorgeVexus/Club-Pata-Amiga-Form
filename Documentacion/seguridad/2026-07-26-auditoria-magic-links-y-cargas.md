# Auditoría de magic links y cargas

Fecha: 2026-07-26
Estado: riesgos P0 y emisión no autenticada de magic tokens corregidos; endurecimiento integral de Storage pendiente.

## Flujo reconstruido

1. Un administrador o cron genera un HMAC para `memberId + petIndex + exp`.
2. El enlace abre `/completar-documentacion`.
3. La página valida el token mediante `/api/user/verify-upload-token`.
4. La página sube archivos a endpoints de Storage.
5. Finalmente actualiza la mascota mediante `update-pet-docs` o `fulfill-request`.

El token de documentación es distinto del magic token de pago almacenado en `magic_tokens`.

## Hallazgos críticos

### P0 — Secreto de respaldo conocido

`src/utils/upload-token.ts` usa `fallback-secret-dev` cuando falta `CRON_SECRET`. En un entorno mal configurado cualquier persona que conozca el código puede fabricar enlaces válidos.

Corrección requerida: fallar de forma cerrada si el secreto no existe o es demasiado corto. Nunca generar ni aceptar tokens con un fallback.

### P0 — `fulfill-request` permite continuar sin autenticación

La ruta valida el token solamente cuando alguno de `token`, `exp` o `petIndex` está presente. Si los tres se omiten, continúa y acepta `userId` y `petId` proporcionados por el cliente.

Corrección requerida: exigir exactamente uno de dos modos:

- sesión válida del propietario; o
- magic link completo y válido.

### P0 — Token firmado no está vinculado al `petId` recibido

`update-pet-docs` y `fulfill-request` verifican `memberId + petIndex + exp`, pero pueden aceptar un `petId` directo sin demostrar que corresponde a ese índice y propietario.

Corrección requerida: resolver siempre la mascota en servidor desde el usuario y el índice firmado; si se proporciona `petId`, debe coincidir exactamente.

### P1 — Cargas a Storage sin autorización suficiente

Los endpoints de foto, certificado, documento, perfil y adjuntos aceptan rutas construidas con IDs enviados por el cliente. En el flujo magic link, la carga ocurre antes de la mutación final protegida.

Riesgos:

- consumo abusivo de almacenamiento;
- escritura dentro del prefijo lógico de otro usuario;
- archivos huérfanos si la actualización posterior falla;
- URLs firmadas excesivamente largas.

Corrección requerida: pasar el magic token completo o JWT a cada carga, verificar propietario antes de leer el archivo y aplicar límites de MIME, tamaño y nombre.

### P1 — Selección por orden mutable

`verify-upload-token` traduce `petIndex` tomando las mascotas ordenadas por `created_at`. Altas, bajas históricas o filas heredadas pueden hacer que el índice ya no represente la mascota originalmente incluida en el correo.

Corrección recomendada: la siguiente versión del token debe firmar un `petId` estable y un propósito; durante compatibilidad, resolver el índice y devolver un `petId` canónico que las demás rutas deben exigir.

### P1 — Magic token de pago generado sin sesión

`POST /api/auth/magic-token` acepta `memberstackId`, email y campos enviados por el navegador y crea un token de acceso de pago. Debe exigir sesión del mismo miembro antes de insertar.

Estado: corregido localmente. La ruta exige el JWT Memberstack del mismo `memberstackId` antes de generar el token o escribir en Supabase.

## Diseño de corrección

1. Crear un verificador de autorización dual que devuelva un `ActorContext` canónico.
2. Rechazar conjuntos parciales de parámetros magic link.
3. Validar primero autorización, después propietario/mascota y finalmente leer/subir el archivo.
4. Mantener temporalmente tokens HMAC v1 para correos ya enviados, pero sin secreto fallback.
5. Introducir tokens v2 con `memberId`, `petId`, propósito y expiración.
6. Actualizar página y endpoints de carga en un mismo commit.
7. Añadir pruebas de token ausente, parcial, expirado, miembro cruzado, mascota cruzada, MIME y tamaño.

## Regla de despliegue

No publicar una protección parcial que haga que la página valide correctamente pero falle al subir. API de validación, cargas, mutación final y consumidor deben desplegarse juntos.

## Implementación realizada

- `CRON_SECRET` ahora es obligatorio y debe tener al menos 24 caracteres. El secreto local actual de 31 caracteres queda dentro del umbral sin modificar ni exponer la credencial.
- `fulfill-request` exige credenciales magic link completas o una sesión válida.
- `update-pet-docs` admite sesión o magic link completo y rechaza parámetros parciales.
- Ambos endpoints comprueban propietario y correspondencia entre índice firmado y `petId`.
- La página propaga token y expiración a las cargas de foto y certificado.
- Se añadieron pruebas negativas que primero reprodujeron los cuatro fallos.
- `POST /api/auth/magic-token` autoriza al miembro mediante `requireMemberActor` antes de generar bytes aleatorios o insertar.
- El widget unificado adjunta `Authorization: Bearer` usando su sesión Memberstack activa y conserva el fallback al registro normal cuando no hay sesión.
- CORS admite el encabezado `Authorization` sin cambiar todavía el origen abierto, el esquema, la vigencia, el formato ni el consumo de tokens existentes.
- Se añadió una prueba RED–GREEN específica para autorización, orden de operaciones, CORS y propagación del JWT.

## Pendiente deliberado

Los endpoints genéricos de Storage todavía tienen consumidores de registro, administración y widgets históricos que no envían un mecanismo uniforme de autorización. Exigir JWT inmediatamente rompería esos flujos. Deben migrarse en un lote independiente que actualice simultáneamente:

- registro V2;
- completar perfil;
- panel unificado;
- edición administrativa;
- foto y certificado desde magic link.

Hasta completar ese lote, las mutaciones finales ya impiden asociar el archivo a otra mascota, pero persiste riesgo de archivos huérfanos y consumo abusivo de almacenamiento. Se recomienda aplicar rate limiting/WAF mientras se completa la migración.

También permanecen como riesgos de menor alcance el origen CORS abierto y los campos auxiliares del magic token provenientes del cliente ya autenticado. Ninguno de ellos permite por sí solo emitir un token para otro `memberstackId`, pero deben eliminarse en la migración hacia datos canónicos del servidor.
