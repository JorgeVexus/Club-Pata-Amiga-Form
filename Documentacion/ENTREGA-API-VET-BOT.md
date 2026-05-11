# Manual Técnico: Integración Vet-Bot (Pata Amiga)

Este documento detalla la arquitectura, el flujo de autenticación y los pasos de integración para el **Vet-Bot** de Club Pata Amiga.

## 1. Descripción General
El Vet-Bot es un asistente de inteligencia artificial (basado en Chatbot Builder AI) integrado en el ecosistema de Pata Amiga. Su principal característica es la **identificación automática de miembros**: el bot reconoce al usuario, sus mascotas y su historial de consultas sin necesidad de solicitar datos manuales, siempre que el usuario tenga una sesión activa en el portal.

---

## 2. Arquitectura de Integración

La integración se basa en un flujo de tres capas:

1.  **Frontend (Webflow/Widget):** Genera un token de sesión seguro al detectar un usuario logueado.
2.  **Backend (API Next.js):** Valida la membresía y genera/entrega el contexto del usuario.
3.  **Bot (Chatbot Builder AI):** Consume la API de contexto usando el token recibido para personalizar la conversación.

---

## 3. Integración en Webflow

Para habilitar el bot con identificación automática en cualquier página de Webflow, se debe insertar el siguiente script antes de la etiqueta de cierre `</body>`:

```html
<!-- Script Centralizado del Vet-Bot -->
<script src="https://app.pataamiga.mx/widgets/vet-bot.js"></script>
```

### ¿Qué hace este script?
1.  **Detecta Memberstack:** Espera a que el SDK de Memberstack esté listo.
2.  **Verifica Suscripción:** Comprueba que el usuario tenga un plan activo.
3.  **Genera Session Token:** Llama de forma segura a la API de Pata Amiga para obtener un token temporal (válido por 2 horas).
4.  **Inicializa el Bot:** Inyecta el token y los datos básicos en el plugin de `chatbotbuilder.io`.

---

## 4. Documentación de la API (Para la Agencia del Bot)

La agencia encargada de configurar el flujo en **Chatbot Builder AI** debe utilizar el siguiente endpoint para obtener los datos del usuario.

### Obtener Contexto del Usuario
Retorna los datos personales, lista de mascotas (con estatus de carencia) e historial de consultas.

*   **URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/context`
*   **Método:** `GET`
*   **Headers Requeridos:**
    *   `x-vet-bot-key`: `pata-amiga-vet-bot-secret-2026`
*   **Parámetros de Query:**
    *   `sessionToken`: El token recibido desde el widget de frontend.

#### Ejemplo de Respuesta (JSON):
```json
{
  "success": true,
  "user": {
    "id": "uuid-del-usuario",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "membershipStatus": "approved"
  },
  "pets": [
    {
      "id": "uuid-mascota",
      "name": "Luna",
      "type": "Perro",
      "breed": "Golden Retriever",
      "status": "approved",
      "waitingPeriod": {
        "isActive": false,
        "end": "2026-08-01T00:00:00Z",
        "daysRemaining": 82,
        "label": "En carencia (82 días restantes)"
      }
    }
  ],
  "consultationHistory": [
    {
      "date": "2026-05-10T14:30:00Z",
      "summary": "Consulta por alergia estacional",
      "petName": "Luna"
    }
  ],
  "solidarityRequests": [
    {
      "id": "uuid-solicitud",
      "type": "reimbursement",
      "benefitType": "medical_emergency",
      "status": "in_review",
      "requestedAmount": 1500.00,
      "approvedAmount": null,
      "petName": "Luna",
      "caseTitle": "Infección estomacal"
    }
  ],
  "identifiedVia": "session_token"
}
```

### Detalle de Campos del Fondo Solidario

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `solidarityRequests` | Array | Lista de las últimas 10 solicitudes de apoyo del miembro. |
| `type` | String | `reimbursement` (Reembolso) o `allied_center` (Pago Directo). |
| `benefitType` | String | `medical_emergency`, `annual_vaccination`, `death`. |
| `status` | String | `new`, `in_review`, `needs_info`, `approved`, `rejected`, `completed`. |
| `requestedAmount` | Number | Monto solicitado originalmente. |
| `approvedAmount` | Number | Monto aprobado (puede ser null si está pendiente o rechazado). |
| `petName` | String | Nombre de la mascota asociada a la solicitud. |
| `caseTitle` | String | Título descriptivo del caso (ej. "Cirugía de emergencia"). |

### Detalle de Periodo de Carencia (waitingPeriod)

Estos campos permiten al bot comunicar de forma precisa cuándo una mascota tendrá cobertura total. La lógica ya incluye beneficios por **Referido de Embajador (90 días)** si aplica.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `isActive` | Boolean | `true` si la mascota ya tiene cobertura total. |
| `end` | String | Fecha ISO de finalización (estimada o real). |
| `daysRemaining` | Number | Días restantes de carencia. `0` si ya terminó. |
| `label` | String | Texto listo para el usuario (ej. "Activa" o "En carencia (15 días)"). |

---

## 5. Configuración en Chatbot Builder AI (CBB)

Para que la identificación funcione, el flujo en CBB debe:

1.  **Capturar el Token:** El widget envía el token en el campo `userData.session_token`.
2.  **Mapear a CUF:** Guardar ese valor en un *Custom User Field* llamado `{{session_token}}`.
3.  **Llamada Externa:** Realizar un "External Request" al endpoint de contexto usando el header de seguridad.
4.  **Personalizar Prompt:** Usar los campos devueltos (ej. `{{first_name}}`, `{{pet_names}}`) en el saludo inicial.

---

## 6. Seguridad y Restricciones
*   **Tokens Temporales:** Los tokens de sesión expiran automáticamente tras 2 horas de inactividad.
*   **Validación de Plan:** Si un usuario cancela su suscripción o su pago falla, el bot no recibirá el contexto y se comportará como un bot público (sin acceso a historial).
*   **CORS:** La API está configurada para aceptar peticiones únicamente desde dominios autorizados y servidores de integración.

---
**Soporte Técnico:** Para dudas sobre la API o problemas de conectividad, contactar al equipo de desarrollo de Pata Amiga.
