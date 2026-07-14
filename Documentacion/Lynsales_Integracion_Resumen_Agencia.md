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
| 5 | Fallo de pago / no renovación | `PUT /contacts/:id` | `estatus_membresia = pendiente_pago` o `no_renovado` + Tag `miembro inactivo` |
| 6 | Usuario cancela | `PUT /contacts/:id` | `estatus_membresia = cancelado` y Tag `miembro inactivo` |

> Regla de negocio respetada: el `PUT /contacts/:id` de activación (eventos 2-3)
> **solo se llama cuando el pago fue exitoso y la membresía fue aprobada**.

Los eventos 4 y 5 (renovaciones y fallos de cobro) se detectan automáticamente
mediante webhooks de Stripe, ya que esos cobros son recurrentes y no pasan por
una acción manual.

---

## 3. Custom Fields (formato usado)

Enviamos los custom fields en el array `customFields` usando el formato
**`{ id, fieldValue, fieldName }`** (confirmado por la agencia) con los IDs
que nos proporcionaron:

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
    { "id": "yq0LzNIgIWcU7rzWJwm8", "fieldValue": "activo", "fieldName": "Estatus membresia" },
    { "id": "UDXQDTApGP4lWS7tFrOa", "fieldValue": "Mensual", "fieldName": "Tipo membresia" },
    { "id": "oRTpCwaPnVxwYgAN5WlJ", "fieldValue": "$159", "fieldName": "Costo membresia" },
    { "id": "NFqMDDHf23gkgILiC8HM", "fieldValue": "2026-06-30", "fieldName": "Fecha de pago" },
    { "id": "DABr8Ws9zawyJFnLvZqG", "fieldValue": "Tarjeta", "fieldName": "Metodo pago" },
    { "id": "lHLm0zKABjYVH8hlPbE4", "fieldValue": "2026-07-30", "fieldName": "Fecha renovacion" }
  ]
}
```

### Evento 4 — Renovación exitosa (`PUT /contacts/:id`)
```json
{
  "customFields": [
    { "id": "yq0LzNIgIWcU7rzWJwm8", "fieldValue": "activo", "fieldName": "Estatus membresia" },
    { "id": "gTIQIgFqWWgCPeJEkXte", "fieldValue": "2026-07-30", "fieldName": "Fecha pago renovación" },
    { "id": "lHLm0zKABjYVH8hlPbE4", "fieldValue": "2026-08-30", "fieldName": "Fecha renovacion" },
    { "id": "DABr8Ws9zawyJFnLvZqG", "fieldValue": "Tarjeta", "fieldName": "Metodo pago" }
  ]
}
```

### Evento 5 — Fallo de pago o no renovación (`PUT /contacts/:id`)
- Si es un fallo temporal:
```json
{ 
  "customFields": [ 
    { "id": "yq0LzNIgIWcU7rzWJwm8", "fieldValue": "pendiente_pago", "fieldName": "Estatus membresia" } 
  ] 
}
```
- Si la suscripción termina por completo (no renovación / churn):
```json
{ 
  "tags": ["miembro inactivo"],
  "customFields": [ 
    { "id": "yq0LzNIgIWcU7rzWJwm8", "fieldValue": "no_renovado", "fieldName": "Estatus membresia" } 
  ] 
}
```

### Evento 6 — Cancelación (`PUT`)
Dado que el campo `tags` sobrescribe por completo las etiquetas en LeadConnector, al cancelar la membresía enviamos únicamente `["miembro inactivo"]` en la propiedad `tags` del PUT. Esto elimina automáticamente la etiqueta anterior `miembro activo` sin necesidad de consumir endpoints secundarios.
```json
// PUT /contacts/:id
{ 
  "tags": ["miembro inactivo"],
  "customFields": [ 
    { "id": "yq0LzNIgIWcU7rzWJwm8", "fieldValue": "cancelado", "fieldName": "Estatus membresia" } 
  ] 
}
```

---

## 5. Catálogo de estatus de membresía

| Estatus | Cuándo lo enviamos | Tag Enviado |
|---------|--------------------|-------------|
| `activo` | Pago exitoso y membresía aprobada | `miembro activo` |
| `cancelado` | El usuario cancela su membresía | `miembro inactivo` |
| `no_renovado` | Venció el período y no se renovó (churn por impago) | `miembro inactivo` |
| `pendiente_pago` | Pago en proceso o con fallo temporal (ej. tarjeta declinada) | *(Se mantiene igual)* |

---

## 6. Puntos confirmados con Lynsales

1. **Formato de custom fields.** ✅ **RESUELTO**
   Confirmado: se usa `{ "id", "fieldValue", "fieldName" }`. Ya implementado.

2. **Remover un tag.** ✅ **RESUELTO**
   Confirmado por la especificación: el envío del campo `tags` en un PUT **sobrescribe completamente** la lista de etiquetas del contacto. Por ende, para remover `miembro activo` y establecer `miembro inactivo` al cancelar o no renovar la membresía, simplemente enviamos `tags: ["miembro inactivo"]` en el PUT de actualización del contacto. No se requiere invocar la ruta DELETE.

3. **Valores exactos del estatus.** ✅ **RESUELTO**
   Confirmado: se usan los valores del catálogo (sección 4) en minúsculas:
   `activo`, `cancelado`, `no_renovado`, `pendiente_pago`. Ya implementado.

---

## 7. Manejo de errores

Todas las llamadas al CRM están diseñadas como **no bloqueantes**: si su API no
responde o devuelve error, el flujo del usuario en Pata Amiga continúa con
normalidad y el error queda registrado en nuestros logs para reintento/diagnóstico.
Esto evita que una incidencia del CRM impacte el registro o el pago del usuario.

---

*Última actualización de la documentación: 14 de julio de 2026.*
