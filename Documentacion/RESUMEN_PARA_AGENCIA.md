# Resumen para Agencia del Bot (Chatbot Builder AI)

## 🎯 Qué necesitamos
El bot debe identificar automáticamente a los usuarios que ya iniciaron sesión, sin preguntarles su email.

---

## 📋 Paso 1: Crear Custom User Fields (CUFs)

En tu dashboard de Chatbot Builder AI:

Ir a: `Flows` → `Custom Fields` → `Add`

| Nombre del Campo | Tipo | Para qué sirve |
|------------------|------|----------------|
| `session_token` | Text | Guardar el token de sesión |
| `first_name` | Text | Nombre del usuario |
| `user_email` | Text | Email del usuario |
| `is_identified` | True/False | Saber si ya se identificó |

---

## 📋 Paso 2: Configurar el Primer Mensaje del Bot

Crea un flujo que haga esto:

```
IF {{userData.session_token}} IS NOT EMPTY
  → SET CUF: session_token = {{userData.session_token}}
  → SEND API REQUEST (ver detalles abajo)
  → SET CUF: first_name = {{response.user.firstName}}
  → SET CUF: user_email = {{response.user.email}}
  → SET CUF: is_identified = true
  → MESSAGE: "Hola {{first_name}}, ¿cómo está tu mascota?"

ELSE
  → MESSAGE: "Para ayudarte mejor, ¿podrías darme tu email?"
  → (tu flujo actual)
```

---

## 📋 Paso 3: Configurar el API Request

**Action:** `Send API Request`

| Campo | Valor |
|-------|-------|
| **Method** | `GET` |
| **URL** | `https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}` |
| **Headers** | `x-vet-bot-key: pata-amiga-vet-bot-secret-2026` |

**Save Response:**
- `first_name` ← `{{response.user.firstName}}`
- `user_email` ← `{{response.user.email}}`

---

## 📋 Qué recibirán del cliente

Cuando un usuario logueado abra el chat, recibirán esto automáticamente:

```javascript
ktt10.setup({
  id: "K4THS5LyA99jKDKYNgD3",
  accountId: "1146761",
  color: "#36D6B5",
  userData: {
    session_token: "abc123...",
    user_email: "usuario@email.com",
    first_name: "Carlos",
    memberstack_id: "user_xxx"
  }
});
```

El `session_token` es lo importante. Con eso llaman a la API y obtienen los datos.

---

## 📋 Respuesta de la API

```json
{
  "success": true,
  "user": {
    "firstName": "Carlos",
    "email": "carlos@email.com"
  },
  "pets": [
    {"name": "Luna", "type": "Perro", "breed": "Labrador"}
  ]
}
```

---

## ❓ Dudas?

Si tienen preguntas técnicas, pueden agendar una llamada de 30 minutos.

**Contacto:** [Tu email]
