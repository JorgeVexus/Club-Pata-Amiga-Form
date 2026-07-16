# Integración CRM LynSales — Leads de Campañas de Marketing
**Pata Amiga · Documentación técnica para agencia LynDoors**
*Última actualización: 15 de julio 2026*

---

## 1. Resumen 

Cuando un usuario se registra en cualquier **landing page de campaña** de Club Pata Amiga (ej. campaña "Regálale una membresía"), sus datos son enviados automáticamente al CRM de LynSales como un nuevo contacto. El contacto llega etiquetado con la campaña de origen y los parámetros UTM para facilitar la segmentación y el seguimiento.

---

## 2. ¿Qué datos llegan al CRM?

Al completar el formulario de cualquier landing de campaña, se crea o actualiza (upsert) el contacto en LynSales con los siguientes campos:

| Campo en LynSales | Valor | Ejemplo |
|---|---|---|
| `firstName` | Nombre del usuario | `Ana` |
| `lastName` | Apellido(s) | `García López` |
| `email` | Correo electrónico | `ana@gmail.com` |
| `phone` | Teléfono (10 dígitos, México) | `5512345678` |
| `country` | País (siempre México) | `MX` |
| `tags` | Tags de identificación (ver sección 3) | `["campaña-regalo"]` |

> **Nota**: El campo `name` se construye automáticamente como `firstName + lastName`.

---

## 3. Sistema de Tags por Campaña

Cada lead que entra desde una landing de campaña llega **etiquetado automáticamente** en LynSales. Esto permite segmentar y automatizar flujos directamente desde el CRM sin configuración adicional.

### Tags generados automáticamente

#### Tag de campaña (siempre presente)
Identifica de qué campaña/landing específica viene el lead:

| Campaña | Tag en LynSales |
|---|---|
| Landing "Regálale una membresía" | `campaña-regalo` |
| Futura campaña navidad | `campaña-navidad` *(ejemplo)* |
| Futura campaña verano | `campaña-verano` *(ejemplo)* |

El tag sigue el formato: **`campaña-{slug}`**

#### Tag de fuente UTM (presente si viene de anuncio)
Si el usuario llegó a la landing desde un anuncio con UTM parameters, se agrega un segundo tag:

| UTM Source | Tag en LynSales |
|---|---|
| `utm_source=facebook` | `utm-source-facebook` |
| `utm_source=instagram` | `utm-source-instagram` |
| `utm_source=google` | `utm-source-google` |
| `utm_source=tiktok` | `utm-source-tiktok` |

---

## 4. Comportamiento del Upsert

El sistema utiliza el endpoint `/contacts/upsert` de LeadConnector. Esto significa:

- **Si el email YA existe** en LynSales: se actualiza el contacto existente (se agregan los nuevos tags, no se borran los existentes).
- **Si el email NO existe**: se crea un contacto nuevo.
- **El CRM no bloquea el flujo**: si LynSales falla o no responde, el usuario igual queda registrado en Supabase y recibe su email de regalo. El fallo se registra en los logs del servidor.

---

## 5. Flujo Completo del Lead

```
Usuario llena el form en la landing de campaña
          │
          ▼
[Widget JS] → POST /api/webflow/campaign-lead
          │    Payload: { firstName, lastName, email, phone, consent, campaign, utm }
          │
          ▼
[API Route — Next.js]
    ├─ 1. Valida los datos del formulario
    ├─ 2. Guarda el lead en Supabase (tabla: campaign_leads)
    ├─ 3. ★ Upsert del contacto en LynSales CRM ← NUEVA INTEGRACIÓN
    │         Tags: ["campaña-regalo", "utm-source-facebook"] (según aplique)
    ├─ 4. Consulta cupón y PDF desde Supabase
    └─ 5. Envía email de regalo al usuario via Resend
```

---

## 6. Datos que se guardan en Supabase (base de datos interna)

Además de enviarse al CRM, cada lead queda registrado en la tabla `campaign_leads` de Supabase con los siguientes campos adicionales:

| Campo | Descripción |
|---|---|
| `campaign` | Slug de la campaña (`regalo`) |
| `utm_source` | Fuente de tráfico (`facebook`, `google`, etc.) |
| `utm_medium` | Medio (`cpc`, `social`, etc.) |
| `utm_campaign` | Nombre de la campaña de anuncio |
| `gift_email_status` | Estado del email: `sent` o `failed` |
| `gift_email_sent_at` | Timestamp del envío |

Estos datos están disponibles en el **Dashboard Admin** de Club Pata Amiga bajo la sección **"Campaña Regalos"**.

---

## 7. Configuración en LynSales (lo que necesita tener configurado)

Para que los leads de campañas aparezcan correctamente en LynSales, se requiere:

### Ya configurado (no requiere acción)
- Credenciales API activas en el servidor de producción.
- Endpoint de upsert: `POST https://services.leadconnectorhq.com/contacts/upsert`
- Versión de API: `2021-07-28`

### Recomendaciones para LynDoors
1. **Crear un pipeline / etapa** en LynSales llamado `"Leads de Campaña"` para organizar estos contactos.
2. **Crear automación disparada por tag** `campaña-regalo` para iniciar un flujo de nurturing (seguimiento por WhatsApp/email desde LynSales).
3. **Vista filtrada** en LynSales usando el tag `campaña-regalo` para ver todos los leads de esta campaña en un solo lugar.
4. Si se crean futuras campañas, el tag cambia automáticamente (ej. `campaña-navidad`): no se necesita modificación de código, solo crear la automación del nuevo tag en LynSales.

---

## 8. Ejemplo de Payload enviado a LynSales

```json
POST https://services.leadconnectorhq.com/contacts/upsert
Headers:
  Authorization: Bearer {LYNSALES_API_KEY}
  Content-Type: application/json
  Version: 2021-07-28

Body:
{
  "locationId": "{LYNSALES_LOCATION_ID}",
  "firstName": "Ana",
  "lastName": "García López",
  "name": "Ana García López",
  "email": "ana@gmail.com",
  "phone": "5512345678",
  "country": "MX",
  "tags": ["campaña-regalo", "utm-source-facebook"]
}
```

---

## 9. Diferencia con los Leads de Membresía

| | Lead de Campaña | Lead de Membresía |
|---|---|---|
| **Origen** | Landing de regalo / campaña | Registro completo en app.pataamiga.mx |
| **Tags** | `campaña-{slug}`, `utm-source-*` | `miembro activo` (al ser aprobado) |
| **Custom Fields** | No aplica | `estatus_membresia`, `tipo_membresia`, `fecha_pago`, etc. |
| **Intención** | Lead frío (aún no es socio) | Miembro pagante activo |

---

## 10. Preguntas Frecuentes para LynDoors

**¿Se pueden agregar custom fields a los leads de campaña?**
Sí, sin problema. El servicio de CRM del proyecto ya soporta el formato `{ id, value }` requerido por LeadConnector. Se requeriría coordinación con el equipo de Club Pata Amiga para agregar el ID del campo deseado.

**¿Qué pasa si el mismo email ya existe como miembro activo?**
El upsert de LeadConnector respeta los campos existentes y solo agrega los nuevos tags. No se sobreescriben los custom fields de membresía.

**¿Se pueden filtrar estos leads en el Dashboard Admin de Pata Amiga?**
Sí. El Dashboard Admin tiene una sección "Campaña Regalos" donde se pueden ver, filtrar y exportar todos los leads, con su estado de email y datos de UTM.

**¿Cuándo se actualiza este contacto a "miembro activo"?**
Si el lead eventualmente se registra y completa el pago en `app.pataamiga.mx`, el flujo de membresía existente actualizará el contacto en LynSales automáticamente con el tag `miembro activo` y los custom fields de membresía.

---

*Para dudas técnicas sobre esta integración, contactar al equipo de desarrollo de Club Pata Amiga.*
