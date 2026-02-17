# Ejemplos de Respuestas de la API Vet-Bot

## Endpoint: GET /api/integrations/vet-bot/context

### Ejemplo 1: Usuario con mascotas (Email)

**Request:**
```bash
GET /api/integrations/vet-bot/context?email=carlos.rodriguez@email.com
Headers: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Carlos Rodríguez",
    "firstName": "Carlos",
    "lastName": "Rodríguez",
    "email": "carlos.rodriguez@email.com",
    "phone": "5551234567",
    "membershipStatus": "approved",
    "waitingPeriodEnd": "2026-05-15"
  },
  "pets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Luna",
      "type": "Perro",
      "breed": "Labrador Retriever",
      "size": "large",
      "age": "3 años",
      "status": "approved",
      "waitingPeriod": {
        "start": "2026-02-15",
        "end": "2026-05-15",
        "isActive": true
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Michi",
      "type": "Gato",
      "breed": "Siamés",
      "size": "small",
      "age": "2 años",
      "status": "approved",
      "waitingPeriod": {
        "start": "2026-02-10",
        "end": "2026-05-10",
        "isActive": true
      }
    }
  ],
  "consultationHistory": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "date": "2026-02-10T14:30:00Z",
      "summary": "Consulta sobre vacunación de Luna",
      "recommendations": "Aplicar refuerzo de vacuna contra rabia",
      "petName": "Luna"
    }
  ],
  "identifiedVia": "email",
  "timestamp": "2026-02-17T20:00:00.000Z"
}
```

---

### Ejemplo 2: Usuario con Session Token (Nuevo método)

**Request:**
```bash
GET /api/integrations/vet-bot/context?sessionToken=a1b2c3d4e5f6789...
Headers: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "María González",
    "firstName": "María",
    "lastName": "González",
    "email": "maria.gonzalez@email.com",
    "phone": "5559876543",
    "membershipStatus": "approved"
  },
  "pets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "name": "Max",
      "type": "Perro",
      "breed": "Golden Retriever",
      "size": "large",
      "age": "5 años",
      "status": "approved",
      "waitingPeriod": {
        "start": "2026-01-20",
        "end": "2026-04-20",
        "isActive": false
      }
    }
  ],
  "consultationHistory": [],
  "session": {
    "validUntil": "2026-02-17T22:00:00.000Z",
    "minutesRemaining": 95
  },
  "identifiedVia": "session_token",
  "timestamp": "2026-02-17T20:25:00.000Z"
}
```

---

### Ejemplo 3: Usuario no encontrado (Error 404)

**Request:**
```bash
GET /api/integrations/vet-bot/context?email=noexiste@email.com
Headers: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

### Ejemplo 4: API Key inválida (Error 401)

**Request:**
```bash
GET /api/integrations/vet-bot/context?email=carlos@email.com
Headers: x-vet-bot-key: clave-incorrecta
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid API Key"
}
```

---

### Ejemplo 5: Token de sesión expirado (Error 401)

**Request:**
```bash
GET /api/integrations/vet-bot/context?sessionToken=token-expirado-123...
Headers: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid or expired session token",
  "code": "SESSION_EXPIRED"
}
```

---

### Ejemplo 6: Sin parámetros de identificación (Error 400)

**Request:**
```bash
GET /api/integrations/vet-bot/context
Headers: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing identification parameter",
  "message": "Provide sessionToken, email, or userId"
}
```

---

## Endpoint: POST /api/auth/session-token

### Ejemplo: Generar token exitosamente

**Request:**
```bash
POST /api/auth/session-token
Content-Type: application/json

{
  "memberstackId": "user_cmiqkcuzv00670ssogle4ah3n",
  "email": "carlos.rodriguez@email.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessionToken": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "expiresAt": "2026-02-17T22:00:00.000Z"
}
```

---

### Ejemplo: Error - datos faltantes

**Request:**
```bash
POST /api/auth/session-token
Content-Type: application/json

{
  "email": "carlos.rodriguez@email.com"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "memberstackId es requerido"
}
```

---

## Endpoint: GET /api/integrations/vet-bot/test

### Ejemplo: Verificar si usuario existe

**Request:**
```bash
GET /api/integrations/vet-bot/test?email=carlos.rodriguez@email.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Usuario encontrado",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Carlos Rodríguez",
    "email": "carlos.rodriguez@email.com",
    "status": "approved"
  }
}
```

---

### Ejemplo: Usuario no existe

**Request:**
```bash
GET /api/integrations/vet-bot/test?email=noexiste@email.com
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Usuario no encontrado",
  "email": "noexiste@email.com",
  "suggestion": "Verifica que el email esté registrado en la plataforma"
}
```

---

## Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Petición exitosa, usuario encontrado |
| 400 | Bad Request | Faltan parámetros requeridos |
| 401 | Unauthorized | API key inválida o token expirado |
| 404 | Not Found | Usuario no existe en la base de datos |
| 500 | Server Error | Error interno del servidor |

---

## Campos Importantes para el Bot

### Del objeto `user`:
- `firstName` - Para saludo personalizado: "Hola **Juan**..."
- `email` - Para referencia
- `membershipStatus` - Para saber si es "approved", "pending", etc.

### Del array `pets`:
- `name` - Nombre de la mascota
- `type` - "Perro" o "Gato"
- `breed` - Raza
- `waitingPeriod.isActive` - Si está en período de carencia

### Del objeto `consultationHistory`:
- `summary` - Resumen de consultas previas
- `petName` - A qué mascota pertenece la consulta
