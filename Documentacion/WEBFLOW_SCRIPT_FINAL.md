# Script Final para Webflow - Integración Vet-Bot v2

> **Dominio Vercel:** https://app.pataamiga.mx  
> **Webchat ID:** K4THS5LyA99jKDKYNgD3  
> **Account ID:** 1146761  
> **Versión Plugin:** v6

---

## Script Completo (Copiar y Pegar en Webflow)

Reemplaza tu script actual con este:

```html
<!-- ============================================ -->
<!-- Vet-Bot Integration Script v2 -->
<!-- ============================================ -->

<!-- 1. Script de integración (genera tokens) -->
<script>
(function() {
    'use strict';
    
    const CONFIG = {
        apiUrl: 'https://app.pataamiga.mx/api',
        debug: true
    };
    
    const logger = {
        log: (...args) => CONFIG.debug && console.log('[VetBot]', ...args),
        error: (...args) => CONFIG.debug && console.error('[VetBot]', ...args)
    };
    
    // Esperar a que Memberstack cargue
    function waitForMemberstack() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 40; // 20 segundos máximo
            
            const check = setInterval(() => {
                attempts++;
                
                if (window.$memberstackDom) {
                    clearInterval(check);
                    resolve(window.$memberstackDom);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(check);
                    resolve(null);
                }
            }, 500);
        });
    }
    
    // Generar session token
    async function generateSessionToken(memberstackId, email) {
        try {
            logger.log('Generating session token...');
            
            const response = await fetch(`${CONFIG.apiUrl}/auth/session-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ memberstackId, email })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.sessionToken) {
                throw new Error('Invalid response');
            }
            
            logger.log('Token generated successfully');
            return data.sessionToken;
            
        } catch (error) {
            logger.error('Failed to generate token:', error.message);
            return null;
        }
    }
    
    // Inicializar todo
    async function init() {
        logger.log('Initializing Vet-Bot integration...');
        
        const memberstack = await waitForMemberstack();
        
        if (!memberstack) {
            logger.error('Memberstack not found, bot will not load');
            return;
        }
        
        try {
            const member = await memberstack.getCurrentMember();
            
            if (!member || !member.data) {
                logger.log('User not logged in, bot will not load');
                return;
            }
            
            logger.log('User logged in:', member.data.auth?.email);
            
            // Generar token de sesión
            const sessionToken = await generateSessionToken(
                member.data.id,
                member.data.auth?.email
            );
            
            // Preparar userData para el bot
            const userData = {
                session_token: sessionToken,
                user_email: member.data.auth?.email,
                memberstack_id: member.data.id,
                first_name: member.data.customFields?.['first-name'] || member.data.auth?.email?.split('@')[0]
            };
            
            logger.log('UserData prepared:', userData);
            
            // Cargar script del bot dinámicamente
            loadBotScript(userData);
            
        } catch (error) {
            logger.error('Error initializing:', error);
        }
    }
    
    // Cargar script de Chatbot Builder AI
    function loadBotScript(userData) {
        logger.log('Loading Chatbot Builder script...');
        
        const script = document.createElement('script');
        script.src = 'https://app.chatgptbuilder.io/webchat/plugin.js?v=6';
        script.async = true;
        
        script.onload = function() {
            logger.log('Chatbot Builder loaded, setting up...');
            
            if (typeof ktt10 !== 'undefined') {
                ktt10.setup({
                    id: "K4THS5LyA99jKDKYNgD3",
                    accountId: "1146761",
                    color: "#36D6B5",
                    // 👇 ESTO ES CRÍTICO: Pasar datos al bot
                    userData: userData
                });
                
                logger.log('Bot initialized with user data');
            } else {
                logger.error('ktt10 not available');
            }
        };
        
        script.onerror = function() {
            logger.error('Failed to load Chatbot Builder script');
        };
        
        document.head.appendChild(script);
    }
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
```

---

## ¿Qué hace este script?

### Flujo de ejecución:

1. **Espera a Memberstack** → Verifica que esté cargado
2. **Verifica login** → Solo continúa si el usuario está autenticado
3. **Genera token** → Llama a tu API en `app.pataamiga.mx/api/auth/session-token`
4. **Prepara userData** → Incluye el token y datos del usuario
5. **Carga el bot** → Inyecta el script de Chatbot Builder AI dinámicamente
6. **Pasa userData** → Configura el bot con `userData` para identificación automática

---

## Para la Agencia (Chatbot Builder AI)

### Lo que necesitan hacer:

#### 1. Crear Custom User Fields (CUFs)

Ir a: `Flows` → `Custom Fields` → `Add`

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `session_token` | Text | Token de sesión del usuario |
| `user_email` | Text | Email del usuario |
| `first_name` | Text | Nombre del usuario |
| `memberstack_id` | Text | ID de Memberstack |

#### 2. Crear Flow de Identificación

**Primer mensaje del bot:**
```
{{userData.session_token}}
```

**O usando condición:**
```
IF {{userData.session_token}} IS NOT EMPTY
  → Guardar en CUF: session_token = {{userData.session_token}}
  → Llamar API: GET https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}
  → Guardar respuesta en CUFs
  → Saludo: "Hola {{first_name}}, ¿cómo está tu mascota?"
ELSE
  → "Para ayudarte mejor, ¿podrías darme tu email?"
```

#### 3. Configurar API Request

```
Method: GET
URL: https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}
Headers:
  x-vet-bot-key: pata-amiga-vet-bot-secret-2026
```

**Respuesta exitosa (200):**
```json
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
```

---

## Testing

### Cómo probar que funciona:

1. **Abrir consola del navegador** (F12)
2. **Iniciar sesión** en tu sitio Webflow
3. **Ver logs:** Deberías ver:
   ```
   [VetBot] User logged in: usuario@email.com
   [VetBot] Token generated successfully
   [VetBot] Bot initialized with user data
   ```
4. **Abrir el chatbot** → Debe saludar por nombre sin preguntar email

### Si no funciona:

1. **Verificar que el usuario esté logueado**
2. **Revisar consola** por errores de red (CORS)
3. **Verificar en Network** que la llamada a `/api/auth/session-token` retorne 200
4. **Revisar que el token se pase** en `userData`

---

## Troubleshooting

### Error: "Memberstack not found"
El script de Memberstack debe cargarse ANTES que este script. Asegúrate de que el script de Memberstack esté en el `<head>`.

### Error: "Failed to generate token"
Verifica que `app.pataamiga.mx` esté accesible y que la API `/api/auth/session-token` funcione.

### Error: CORS
Si ves errores de CORS, verifica que en tu API de Next.js estén configurados los headers correctos.

### El bot carga pero no identifica al usuario
La agencia debe verificar que:
1. Estén recibiendo el `userData` correctamente
2. El CUF `session_token` se esté poblando
3. La API request se ejecute con el token

---

## Email para la Agencia

```
Asunto: Integración Chatbot Builder AI - Script listo para pruebas

Hola,

Ya tenemos el sistema de identificación automática listo y deployado.

DATOS TÉCNICOS:
- API Base: https://app.pataamiga.mx/api
- Endpoint: GET /integrations/vet-bot/context?sessionToken=XXX
- API Key: pata-amiga-vet-bot-secret-2026

LO QUE RECIBIRÁN:
Cuando un usuario logueado abra el chat, nuestro script pasará:

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

CONFIGURACIÓN REQUERIDA EN CHATBOT BUILDER:

1. Crear CUFs:
   - session_token (Text)
   - user_email (Text)
   - first_name (Text)

2. En el primer mensaje del bot:
   - Si {{userData.session_token}} existe:
     → Guardar en CUF session_token
     → Hacer API request a: https://app.pataamiga.mx/api/integrations/vet-bot/context?sessionToken={{session_token}}
     → Guardar respuesta en CUFs
     → Saludo personalizado
   
   - Si no existe:
     → Preguntar email (flujo actual)

¿Podemos agendar una llamada de 30 min para revisar la implementación?

Quedo atento,
[Tu nombre]
```

---

**Script actualizado:** Febrero 2026  
**Versión:** 2.0  
**Compatible con:** Chatbot Builder AI v6
