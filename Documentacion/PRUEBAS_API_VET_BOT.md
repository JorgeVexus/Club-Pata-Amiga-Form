# Guía de Pruebas - API Vet Bot

## Endpoints Disponibles

### 1. Endpoint de Contexto (Principal)

**URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/context`

#### Método A: Por Email (Legacy)
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?email=usuario@email.com" \
  -H "x-vet-bot-key: pata-amiga-vet-bot-secret-2026"
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "name": "Juan Pérez",
    "firstName": "Juan",
    "email": "usuario@email.com",
    "phone": "5551234567",
    "membershipStatus": "approved"
  },
  "pets": [
    {
      "id": "pet_456",
      "name": "Luna",
      "type": "Perro",
      "breed": "Labrador",
      "size": "large",
      "age": "3 años"
    }
  ],
  "consultationHistory": [],
  "identifiedVia": "email",
  "timestamp": "2026-02-17T20:00:00.000Z"
}
```

**Respuesta Error - Usuario no encontrado (404):**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Respuesta Error - API Key inválida (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid API Key"
}
```

#### Método B: Por Session Token (Nuevo)
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken=abc123..." \
  -H "x-vet-bot-key: pata-amiga-vet-bot-secret-2026"
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "usr_123",
    "name": "Juan Pérez",
    "firstName": "Juan",
    "email": "usuario@email.com"
  },
  "pets": [...],
  "session": {
    "validUntil": "2026-02-17T22:00:00.000Z",
    "minutesRemaining": 120
  },
  "identifiedVia": "session_token",
  "timestamp": "2026-02-17T20:00:00.000Z"
}
```

**Respuesta Error - Token expirado (401):**
```json
{
  "success": false,
  "error": "Invalid or expired session token",
  "code": "SESSION_EXPIRED"
}
```

---

### 2. Endpoint de Test

**URL:** `https://app.pataamiga.mx/api/integrations/vet-bot/test`

**Uso:**
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/test?email=usuario@email.com"
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Usuario encontrado",
  "user": {
    "id": "usr_123",
    "name": "Juan Pérez",
    "email": "usuario@email.com",
    "status": "approved"
  }
}
```

---

### 3. Endpoint de Generación de Token

**URL:** `https://app.pataamiga.mx/api/auth/session-token`

**Uso (desde tu frontend):**
```javascript
const response = await fetch('https://app.pataamiga.mx/api/auth/session-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberstackId: 'user_xxx',
    email: 'usuario@email.com'
  })
});

const data = await response.json();
// data.sessionToken contiene el token
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "sessionToken": "a1b2c3d4e5f6...",
  "expiresAt": "2026-02-17T22:00:00.000Z"
}
```

---

## Casos de Prueba

### Caso 1: Usuario existe y email correcto
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?email=carlos@email.com" \
  -H "x-vet-bot-key: pata-amiga-vet-bot-secret-2026"
```

**Esperado:** 200 OK con datos del usuario

---

### Caso 2: Usuario no existe
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?email=noexiste@email.com" \
  -H "x-vet-bot-key: pata-amiga-vet-bot-secret-2026"
```

**Esperado:** 404 Not Found con mensaje "User not found"

---

### Caso 3: Sin API Key
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?email=carlos@email.com"
```

**Esperado:** 401 Unauthorized con mensaje "Invalid API Key"

---

### Caso 4: API Key incorrecta
```bash
curl -X GET "https://app.pataamiga.mx/api/integrations/vet-bot/context?email=carlos@email.com" \
  -H "x-vet-bot-key: clave-incorrecta"
```

**Esperado:** 401 Unauthorized con mensaje "Invalid API Key"

---

## Verificación en Vercel Logs

Para ver qué está pasando en tiempo real:

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto
3. Ve a la pestaña "Logs"
4. Filtra por `VET_BOT` para ver solo los logs del bot

Deberías ver mensajes como:
```
🤖 [VET_BOT] Headers received: { 'x-vet-bot-key': 'Present (length: 32)', ... }
🤖 [VET_BOT] Fetching context via email
✅ [VET_BOT] Context delivered for: usuario@email.com
```

---

## Debugging para la Agencia

Si la agencia reporta errores, pídeles:

1. **Screenshot del error** que recibe el bot
2. **Logs de Chatbot Builder AI** (si tienen)
3. **Verificar el header exacto** que están enviando

### Para verificar el header en Chatbot Builder AI:

Debe tener configurado:
```
Headers:
  Key: x-vet-bot-key
  Value: pata-amiga-vet-bot-secret-2026
```

**Importante:**
- Todo en minúsculas: `x-vet-bot-key` (no `X-Vet-Bot-Key`)
- Sin espacios al inicio o final
- El valor exacto: `pata-amiga-vet-bot-secret-2026`

---

## Estado Actual

| Endpoint | Email (Legacy) | Session Token (Nuevo) |
|----------|---------------|----------------------|
| /context | ✅ Funciona con API key | ✅ Funciona con API key |
| /test | ✅ Sin auth (para pruebas) | N/A |

**Nota:** Si la agencia dice que no funciona, el 99% de las veces es porque:
1. El header no se envía correctamente
2. Hay un espacio extra en el valor
3. El nombre del header tiene mayúsculas
