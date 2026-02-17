# Guía de Integración: Chatbot Builder AI + Identificación Automática

> **Herramienta de la agencia:** Chatbot Builder AI (https://www.chatbotbuilder.ai/)  
> **Objetivo:** Identificar usuarios automáticamente sin preguntar email  
> **Restricción:** La agencia no conoce el sistema de membresías

---

## 📊 Análisis de Chatbot Builder AI

### Qué descubrimos:

| Característica | Soporta | Cómo se usa |
|----------------|---------|-------------|
| **Custom User Fields (CUFs)** | ✅ Sí | `{{session_token}}`, `{{user_email}}`, etc. |
| **API Integrations** | ✅ Sí | "Send API Request" action |
| **Variables en prompts** | ✅ Sí | Inyectar CUFs en el system prompt |
| **JavaScript SDK** | ✅ Sí | Configuración vía `ktt10.setup()` |
| **Leer cookies directamente** | ❌ No | No tiene acceso directo a document.cookie |

### Conclusión:
Chatbot Builder AI **no puede leer cookies del navegador directamente**, pero **SÍ puede recibir datos** vía su JavaScript SDK al inicializar el widget.

---

## 🎯 SOLUCIÓN: Pasar datos vía JavaScript SDK

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────────┐
│  WEBFLOW (Tu sitio)                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Usuario inicia sesión con Memberstack            │    │
│  │  2. Tu código genera sessionToken                    │    │
│  │  3. Guardas token en cookie/localStorage             │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  4. Al cargar página, lees el token                  │    │
│  │  5. Pasas token a Chatbot Builder vía ktt10.setup()  │    │
│  │     en el parámetro "userData"                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CHATBOT BUILDER AI (La agencia)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  6. Recibe userData con sessionToken                 │    │
│  │  7. Guarda token en un CUF (ej: {{session_token}})   │    │
│  │  8. Usa "Send API Request" para validar token        │    │
│  │  9. Obtiene datos del usuario                        │    │
│  │  10. Guarda datos en CUFs (nombre, mascotas, etc.)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  11. AI Prompt usa las CUFs para personalizar        │    │
│  │      "Hola {{first_name}}, veo que tienes a          │    │
│  │       {{pet_name}}..."                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 PASO A PASO PARA LA AGENCIA (Chatbot Builder AI)

### Paso 1: Crear Custom User Fields (CUFs)

La agencia debe crear estos CUFs en su dashboard de Chatbot Builder AI:

**Ir a:** `Flows` → `Custom Fields` → `Add`

| Nombre del CUF | Tipo | Descripción |
|----------------|------|-------------|
| `session_token` | Text | Token temporal de sesión |
| `user_id` | Text | ID interno del usuario |
| `user_email` | Text | Email del usuario |
| `first_name` | Text | Nombre del usuario |
| `pet_count` | Number | Cantidad de mascotas |
| `pet_names` | Text | Nombres de las mascotas |
| `is_identified` | True/False | Si ya se identificó al usuario |
| `identification_method` | Text | "auto" o "manual" |

**Usar en prompts:**
```
Hola {{first_name}}, bienvenido de nuevo! Veo que tienes {{pet_count}} mascotas. 
¿En qué puedo ayudarte hoy con {{pet_names}}?
```

---

### Paso 2: Configurar el Webchat para recibir datos

El código que el cliente (tú) debe poner en Webflow:

```html
<!-- Script de Chatbot Builder AI -->
<script src="https://app.chatgptbuilder.io/webchat/plugin.js?v=5"></script>

<!-- Tu script de integración -->
<script>
(async function() {
    // 1. Esperar a que Memberstack cargue
    function waitForMemberstack() {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.$memberstackDom) {
                    clearInterval(check);
                    resolve(window.$memberstackDom);
                }
            }, 500);
            setTimeout(() => { clearInterval(check); resolve(null); }, 10000);
        });
    }
    
    // 2. Obtener token de sesión de tu API
    async function getSessionToken(member) {
        try {
            const response = await fetch('https://TU-DOMINIO.vercel.app/api/auth/session-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberstackId: member.id,
                    email: member.auth.email
                })
            });
            const data = await response.json();
            return data.sessionToken;
        } catch (e) {
            console.error('Error getting session token:', e);
            return null;
        }
    }
    
    // 3. Inicializar chatbot con datos del usuario
    async function initChatbot() {
        const memberstack = await waitForMemberstack();
        let userData = {};
        
        if (memberstack) {
            const member = await memberstack.getCurrentMember();
            if (member) {
                const token = await getSessionToken(member);
                if (token) {
                    userData = {
                        session_token: token,
                        user_email: member.auth.email
                    };
                }
            }
        }
        
        // 4. Configurar Chatbot Builder con userData
        ktt10.setup({
            id: "WEBCHAT_ID_DE_LA_AGENCIA",
            accountId: "ACCOUNT_ID_DE_LA_AGENCIA",
            color: "#36D6B5",
            // 👇 ESTO ES LO CRÍTICO - Pasar datos al bot
            userData: userData
        });
    }
    
    // 5. Ejecutar
    initChatbot();
})();
</script>
```

---

### Paso 3: Crear el Flow de Identificación Automática

En Chatbot Builder AI, la agencia debe crear un **Flow** que:

#### 3.1 Primera acción: "Set Custom Field"
- **Campo:** `session_token`
- **Valor:** `{{userData.session_token}}` (o similar, depende de cómo CBB reciba los datos)

**Nota importante:** La agencia debe verificar cómo CBB expone los `userData` pasados en `ktt10.setup()`. Puede ser:
- `{{userData.session_token}}`
- `{{session_token}}` (si se mapea automáticamente a CUF)

#### 3.2 Segunda acción: "Send API Request"

**Configuración:**
```
Method: GET
URL: https://TU-DOMINIO.vercel.app/api/integrations/vet-bot/context?sessionToken={{session_token}}
Headers:
  x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Guardar respuesta en CUFs:**
```json
{
  "first_name": "{{response.user.firstName}}",
  "user_email": "{{response.user.email}}",
  "user_id": "{{response.user.id}}",
  "pet_count": "{{response.pets.length}}",
  "pet_names": "{{response.pets.map(p => p.name).join(', ')}}",
  "is_identified": "true",
  "identification_method": "auto"
}
```

#### 3.3 Condición: ¿Se identificó correctamente?

**Condition Block:**
```
IF {{is_identified}} == "true"
  → Ir a: "Saludo Personalizado"
ELSE
  → Ir a: "Preguntar Email" (flujo actual)
```

---

### Paso 4: Crear el Saludo Personalizado

**Text Block:**
```
¡Hola {{first_name}}! 👋

Bienvenido de nuevo a nuestra clínica veterinaria. Veo que tienes {{pet_count}} mascota(s): {{pet_names}}.

¿En qué puedo ayudarte hoy? Puedo:
- Responder dudas sobre salud y cuidados
- Ayudarte con información sobre nuestros servicios
- Recordarte próximas vacunas o citas
```

---

## 🔧 FLUJO COMPLETO EN CHATBOT BUILDER AI

```
[INICIO]
    │
    ▼
[SET CUF: session_token = {{userData.session_token}}]
    │
    ▼
[SEND API REQUEST]
  GET /vet-bot/context?sessionToken={{session_token}}
  Headers: x-vet-bot-key: ***
    │
    ├──► [SUCCESS] ──► [SET CUFs: first_name, pet_names, etc.]
    │                      │
    │                      ▼
    │                   [TEXT BLOCK: Saludo Personalizado]
    │                      │
    │                      ▼
    │                   [FIN]
    │
    └──► [ERROR/404] ──► [TEXT BLOCK: "Para ayudarte mejor..."]
                           │
                           ▼
                        [GET USER DATA: Email]
                           │
                           ▼
                        [SEND API REQUEST con email]
                           │
                           ▼
                        [SET CUFs]
                           │
                           ▼
                        [FIN]
```

---

## 📧 EMAIL PARA ENVIAR A LA AGENCIA

```
Asunto: Integración Chatbot Builder AI - Datos de usuario automáticos

Hola [Nombre de la agencia],

Estamos trabajando en mejorar la experiencia del usuario en nuestro 
chatbot veterinario. Necesitamos que el bot reconozca automáticamente 
a los usuarios que ya iniciaron sesión en nuestra plataforma.

CONFIGURACIÓN REQUERIDA EN CHATBOT BUILDER AI:

1️⃣ CREAR CUSTOM USER FIELDS (CUFs):
   Ir a: Flows → Custom Fields → Add
   
   Crear estos campos:
   - session_token (Text)
   - user_email (Text)  
   - first_name (Text)
   - pet_names (Text)
   - is_identified (True/False)

2️⃣ MODIFICAR EL WEBCHAT:
   El cliente (nosotros) modificaremos el código de instalación del 
   webchat para pasar datos adicionales:
   
   ktt10.setup({
       id: "...",
       accountId: "...",
       color: "...",
       userData: {
           session_token: "..."
       }
   });

3️⃣ CREAR FLUJO DE IDENTIFICACIÓN:
   - Nueva acción al inicio: "Set Custom Field"
     Campo: session_token
     Valor: {{userData.session_token}}
   
   - Luego: "Send API Request"
     Method: GET
     URL: https://nuestro-dominio.com/api/integrations/vet-bot/context?sessionToken={{session_token}}
     Header: x-vet-bot-key: pata-amiga-vet-bot-secret-2026
   
   - Guardar respuesta en CUFs correspondientes
   
   - Condición: Si {{is_identified}} == true → Saludo personalizado
                Si no → Preguntar email (flujo actual)

RESPUESTA DE LA API (JSON):
{
  "success": true,
  "user": {
    "firstName": "Carlos",
    "email": "carlos@email.com"
  },
  "pets": [
    {"name": "Luna", "type": "Perro"}
  ]
}

¿PODEMOS AGENDAR UNA LLAMADA DE 30 MIN?
Para revisar juntos la implementación y responder dudas.

Quedo atento,
[Tu nombre]
```

---

## ⚠️ ALTERNATIVA: Si la agencia no puede hacer lo anterior

### Opción B: Código de Vinculación (Más simple para la agencia)

Si la agencia tiene dificultades técnicas, podemos usar un **código de 6 dígitos**:

#### Flujo:
1. Usuario inicia sesión en nuestro sitio
2. En el dashboard del usuario mostramos: **"Tu código de soporte: 847291"**
3. Bot pregunta: "¿Tienes un código de soporte? (Opcional)"
4. Usuario introduce: **847291**
5. Bot valida con API: `GET /api/integrations/vet-bot/verify-code?code=847291`
6. Respuesta igual a la de context

#### Ventajas:
- ✅ Muy fácil de implementar para la agencia (solo un GET)
- ✅ No requiere modificar el JavaScript del widget
- ✅ Funciona en cualquier dispositivo

#### Desventajas:
- ⚠️ Usuario debe introducir 6 dígitos manualmente
- ⚠️ Un paso adicional en la UX

---

## 🧪 TESTING

### Cómo probar la integración:

1. **Instalar el widget** con el nuevo código en Webflow
2. **Iniciar sesión** con un usuario de prueba
3. **Abrir el chatbot**
4. **Verificar en los logs** de Chatbot Builder AI que:
   - El CUF `session_token` se populó
   - La API request se ejecutó
   - Los CUFs de usuario se actualizaron

5. **Verificar el saludo:** Debe ser personalizado

---

## 📞 PREGUNTAS PARA LA AGENCIA

Antes de empezar, confirma con ellos:

1. ✅ ¿Pueden crear Custom User Fields?
2. ✅ ¿Pueden usar "Send API Request"?
3. ✅ ¿Cómo reciben los `userData` en `ktt10.setup()`? (¿Se mapean automáticamente a CUFs?)
4. ✅ ¿Pueden hacer condiciones basadas en CUFs?
5. ✅ ¿Tienen acceso a los logs de API requests?

---

## 📚 RECURSOS

### Documentación de Chatbot Builder AI:
- Custom Fields: https://docs.chatbotbuilder.ai/support/solutions/articles/150000063553
- API Integrations: http://support.chatbotbuilder.net/docs/how-to-create-api-integrations/
- Webchat Setup: https://docs.chatbotbuilder.ai/support/solutions/articles/150000106568

---

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Preparado por:** Assistant
