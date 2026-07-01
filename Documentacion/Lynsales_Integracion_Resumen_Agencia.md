# Integración Pata Amiga ↔ Lynsales (LeadConnector)

**Proyecto:** Club Pata Amiga · Sistema de Membresías
**Fecha:** 30 de junio de 2026
**Para:** Equipo Lynsales / Agencia
**De:** Equipo de ingeniería Pata Amiga

Este documento resume **cómo consumimos la API de Contactos de Lynsales** desde
nuestro backend: qué endpoints llamamos, en qué momento del ciclo de vida de la
membresía, y exactamente qué datos enviamos. Al final hay una sección de
**puntos a confirmar** con ustedes.

---

## 1. Configuración

- **Base URL:** `https://services.leadconnectorhq.com`
- **Location ID:** `WSfoe3Cggh6XrHoGRMxG`
- **Auth:** las llamadas se hacen **solo desde backend** con
  `Authorization: Bearer <API_KEY>` y header `Version: 2021-07-28`.
  La API key se maneja como variable de entorno; nunca se expone en frontend.

---

## 2. Eventos y endpoints

Mapeamos el ciclo de vida de la membresía a las llamadas de su API así:

| # | Evento en Pata Amiga | Endpoint Lynsales | Acción |
|---|----------------------|-------------------|--------|
| 1 | Usuario completa el formulario de registro | `POST /contacts/upsert` | Crear/actualizar contacto y guardar el `id` devuelto |
| 2 | Pago exitoso + membresía aprobada | `PUT /contacts/:id` | Tag `miembro activo` + custom fields de membresía |
| 3 | Membresía aprobada | `PUT /contacts/:id` | `estatus_membresia = activo` (incluido en el mismo PUT del evento 2) |
| 4 | Renovación exitosa (cobro recurrente) | `PUT /contacts/:id` | `fecha_pago_renovacion` + `fecha_renovacion` |
| 5 | Fallo de pago / no renovación | `PUT /contacts/:id` | `estatus_membresia = pendiente_pago` o `no_renovado` |
| 6 | Usuario cancela | `PUT /contacts/:id` + `DELETE /contacts/:id/tags` | `estatus_membresia = cancelado` y quitar tag `miembro activo` |

> Regla de negocio respetada: el `PUT /contacts/:id` de activación (eventos 2-3)
> **solo se llama cuando el pago fue exitoso y la membresía fue aprobada**.

Los eventos 4 y 5 (renovaciones y fallos de cobro) se detectan automáticamente
mediante webhooks de Stripe, ya que esos cobros son recurrentes y no pasan por
una acción manual.

---

## 3. Custom Fields (formato usado)

Enviamos los custom fields en el array `customFields` usando el formato
**`{ id, value }`** con los IDs que nos proporcionaron:

| Campo | ID | Valores |
|-------|-----|---------|
| Estatus membresía | `yq0LzNIgIWcU7rzWJwm8` | `activo` · `cancelado` · `no_renovado` · `pendiente_pago` |
| Tipo membresía | `UDXQDTApGP4lWS7tFrOa` | `Mensual` · `Anual` |
| Costo membresía | `oRTpCwaPnVxwYgAN5WlJ` | `$159`, `$1,699`, etc. |
| Fecha de pago | `NFqMDDHf23gkgILiC8HM` | `YYYY-MM-DD` |
| Método de pago | `DABr8Ws9zawyJFnLvZqG` | `Tarjeta` · `OXXO` · `Transferencia` · `PayPal` |
| Fecha renovación | `lHLm0zKABjYVH8hlPbE4` | `YYYY-MM-DD` (próximo cobro) |
| Fecha pago renovación | `gTIQIgFqWWgCPeJEkXte` | `YYYY-MM-DD` |

---

## 4. Ejemplos de payload real

### Evento 1 — Registro (`POST /contacts/upsert`)
```json
{
  "locationId": "WSfoe3Cggh6XrHoGRMxG",
  "firstName": "María",
  "lastName": "García López",
  "name": "María García López",
  "email": "maria@example.com",
  "phone": "+52 555 555 5555",
  "address1": "Av. Reforma 100",
  "city": "Ciudad de México",
  "state": "CDMX",
  "postalCode": "01000",
  "country": "MX"
}
```
Guardamos el `contact.id` de la respuesta en nuestra base de datos para todas
las actualizaciones posteriores.

### Eventos 2 y 3 — Pago exitoso + aprobación (`PUT /contacts/:id`)
```json
{
  "tags": ["miembro activo"],
  "customFields": [
    { "id": "yq0LzNIgIWcU7rzWJwm8", "value": "activo" },
    { "id": "UDXQDTApGP4lWS7tFrOa", "value": "Mensual" },
    { "id": "oRTpCwaPnVxwYgAN5WlJ", "value": "$159" },
    { "id": "NFqMDDHf23gkgILiC8HM", "value": "2026-06-30" },
    { "id": "DABr8Ws9zawyJFnLvZqG", "value": "Tarjeta" },
    { "id": "lHLm0zKABjYVH8hlPbE4", "value": "2026-07-30" }
  ]
}
```

### Evento 4 — Renovación exitosa (`PUT /contacts/:id`)
```json
{
  "customFields": [
    { "id": "yq0LzNIgIWcU7rzWJwm8", "value": "activo" },
    { "id": "gTIQIgFqWWgCPeJEkXte", "value": "2026-07-30" },
    { "id": "lHLm0zKABjYVH8hlPbE4", "value": "2026-08-30" },
    { "id": "DABr8Ws9zawyJFnLvZqG", "value": "Tarjeta" }
  ]
}
```

### Evento 5 — Fallo de pago (`PUT /contacts/:id`)
```json
{ "customFields": [ { "id": "yq0LzNIgIWcU7rzWJwm8", "value": "pendiente_pago" } ] }
```
Si la suscripción termina por falta de pago (churn), enviamos `no_renovado` y
quitamos el tag (ver evento 6).

### Evento 6 — Cancelación (`PUT` + `DELETE`)
```json
// PUT /contacts/:id
{ "customFields": [ { "id": "yq0LzNIgIWcU7rzWJwm8", "value": "cancelado" } ] }
```
```json
// DELETE /contacts/:id/tags
{ "tags": ["miembro activo"] }
```

---

## 5. Catálogo de estatus de membresía

| Estatus | Cuándo lo enviamos |
|---------|--------------------|
| `activo` | Pago exitoso y membresía aprobada |
| `cancelado` | El usuario cancela su membresía |
| `no_renovado` | Venció el período y no se renovó (churn por impago) |
| `pendiente_pago` | Pago en proceso o con fallo temporal (ej. tarjeta declinada) |

---

## 6. Puntos a confirmar con Lynsales

Necesitamos su confirmación en tres puntos para dejar la integración 100% alineada:

1. **Formato de custom fields.**
   Estamos enviando `{ "id": "...", "value": "..." }`. En la documentación que nos
   compartieron aparece un ejemplo con `{ "id", "fieldValue", "fieldName" }`.
   ¿Cuál es el formato correcto y soportado por su API en el `PUT`?

2. **Remover un tag.**
   Para el evento de cancelación necesitamos **quitar** el tag `miembro activo`.
   Estamos usando `DELETE /contacts/:id/tags` con body `{ "tags": ["miembro activo"] }`.
   ¿Es este el endpoint/método correcto? Su documentación describe cómo **agregar**
   tags en el `PUT`, pero no cómo removerlos.

3. **Valores exactos del estatus.**
   Su catálogo (sección 4 del requerimiento) indica los valores en minúsculas:
   `activo`, `cancelado`, `no_renovado`, `pendiente_pago`. Sin embargo, el ejemplo
   de `customFields` muestra `"Activa"`. ¿Confirmamos que el valor esperado es
   exactamente `activo` (minúscula, sin acento)?

---

## 7. Manejo de errores

Todas las llamadas al CRM están diseñadas como **no bloqueantes**: si su API no
responde o devuelve error, el flujo del usuario en Pata Amiga continúa con
normalidad y el error queda registrado en nuestros logs para reintento/diagnóstico.
Esto evita que una incidencia del CRM impacte el registro o el pago del usuario.

---

*Quedamos atentos a sus comentarios sobre los tres puntos de la sección 6 para
cerrar la integración.*
