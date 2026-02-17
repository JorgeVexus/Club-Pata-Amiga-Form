# Plan de Integración Vet-Bot v2 - Identificación Automática de Usuarios

> **Fecha:** Febrero 2026  
> **Objetivo:** Eliminar la pregunta "¿Cuál es tu email?" y autenticar automáticamente al usuario usando Memberstack  
> **Restricción:** La agencia externa no conoce la naturaleza completa del proyecto (membresías)

---

## 📋 Resumen Ejecutivo

### Situación Actual
- El bot pregunta al usuario su email para identificarlo
- Consume tokens de OpenAI en conversaciones innecesarias
- Experiencia de usuario deficiente (fricción)

### Situación Deseada
- Usuario inicia sesión → Bot lo reconoce automáticamente
- Contexto completo disponible inmediatamente (mascotas, historial, etc.)
- Cero fricción en la experiencia

### Restricciones
- La agencia dice "no pueden recibir datos" desde nuestro frontend
- No podemos revelar detalles del sistema de membresías
- El bot debe seguir funcionando como "asistente veterinario"

---

## 🏗️ Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────┐
│  WEBFLOW / NEXT.JS (Frontend)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Memberstack Auth (window.$memberstackDom)           │    │
│  │  - user.id (memberstack_id)                          │    │
│  │  - user.auth.email                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (No hay conexión directa con el bot)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  CHATBOT (Agencia Externa)                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - Widget de chat en Webflow                         │    │
│  │  - Pregunta: "¿Cuál es tu email?"                    │    │
│  │  - Llama a nuestra API con el email                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ GET /api/integrations/vet-bot/context?email=xxx
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  NUESTRO BACKEND (Next.js + Supabase)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - Valida API Key                                    │    │
│  │  - Busca usuario por email                           │    │
│  │  - Retorna: usuario + mascotas + historial           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 SOLUCIÓN PROPUESTA: Token de Sesión Vinculado

### Concepto
En lugar de que el frontend "envíe datos" al bot, generamos un **Token de Sesión temporal** que:
1. Se crea en nuestro backend al iniciar sesión
2. Se almacena en el navegador (cookie/localStorage)
3. El bot puede **leer** este token y consultar nuestra API
4. La API traduce el token → datos del usuario

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO DE AUTENTICACIÓN AUTOMÁTICA                         │
└─────────────────────────────────────────────────────────────┘

1. USUARIO INICIA SESIÓN
   ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
   │   Usuario   │ ──────▶ │  Memberstack │ ──────▶ │   Nuestro   │
   │             │  login  │   (Auth)     │  auth   │    API      │
   └─────────────┘         └──────────────┘         └──────┬──────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │ Generar      │
                                                    │ SessionToken │
                                                    │ (JWT corto)  │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
   ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
   │   Cookie    │ ◀────── │  Navegador   │ ◀────── │   API       │
   │localStorage │         │              │         │   Response  │
   └─────────────┘         └──────────────┘         └─────────────┘

2. USUARIO ABRE EL CHAT
   ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
   │   Usuario   │ ──────▶ │    Bot       │         │             │
   │  Abre Chat  │  click  │   Widget     │         │             │
   └─────────────┘         └──────┬───────┘         │             │
                                  │                │             │
                                  │ Lee            │             │
                                  │ SessionToken   │             │
                                  │ de cookie      │             │
                                  │                │             │
                                  ▼                │             │
   ┌─────────────┐         ┌──────────────┐         │             │
   │   Bot       │ ──────▶ │  Nuestra API │ ──────▶ │  Supabase   │
   │  Server     │  token  │  /vet-bot/   │  query  │   (Datos)   │
   └─────────────┘         └──────────────┘         └─────────────┘
                                  │
                                  ▼
   ┌─────────────┐         ┌──────────────┐
   │   Bot       │ ◀────── │   Contexto   │
   │  Recibe     │  JSON   │   Usuario    │
   │  Datos      │         │   + Mascotas │
   └─────────────┘         └──────────────┘

3. RESULTADO
   - Bot saluda por nombre: "Hola Carlos, ¿cómo está Luna?"
   - Conoce las mascotas del usuario
   - Tiene contexto de historial médico
   - CERO preguntas de identificación
```

---

## 🔧 ESPECIFICACIONES TÉCNICAS PARA LA AGENCIA

### 1. Nuevo Endpoint: Validar Token de Sesión

**URL:** `GET /api/integrations/vet-bot/session`

**Headers Requeridos:**
```http
x-vet-bot-key: pata-amiga-vet-bot-secret-2026
Content-Type: application/json
```

**Query Parameters:**
| Parámetro | Tipo   | Descripción                           |
|-----------|--------|---------------------------------------|
| token     | string | Token de sesión generado post-login   |

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "usr_123456",
    "name": "Carlos Rodríguez",
    "firstName": "Carlos",
    "email": "carlos@email.com",
    "phone": "5551234567",
    "membershipStatus": "active"
  },
  "pets": [
    {
      "id": "pet_789",
      "name": "Luna",
      "type": "Perro",
      "breed": "Labrador",
      "size": "large",
      "age": "3 años",
      "status": "approved"
    }
  ],
  "consultationHistory": [
    {
      "id": "cons_456",
      "date": "2026-02-10T14:30:00Z",
      "summary": "Consulta sobre vacunación",
      "petName": "Luna"
    }
  ],
  "session": {
    "validUntil": "2026-02-17T20:00:00Z",
    "minutesRemaining": 120
  }
}
```

**Respuesta Error (401):**
```json
{
  "success": false,
  "error": "Invalid or expired session token"
}
```

### 2. Actualización del Endpoint de Contexto Actual

**Cambio:** El endpoint actual `/context` aceptará **tanto email como session token**.

**Nuevos Query Parameters:**
| Parámetro     | Tipo   | Descripción                              |
|---------------|--------|------------------------------------------|
| email         | string | (Alternativo) Email del usuario          |
| sessionToken  | string | (Alternativo) Token de sesión (preferido)|
| userId        | string | (Legacy) ID de Memberstack               |

**Lógica de la API:**
```javascript
if (sessionToken) {
  // Validar token y obtener memberstack_id
  const session = await validateSessionToken(sessionToken);
  user = await getUserByMemberstackId(session.memberstack_id);
} else if (email) {
  // Fallback al método actual
  user = await getUserByEmail(email);
} else if (userId) {
  // Legacy
  user = await getUserByMemberstackId(userId);
}
```

### 3. Implementación del Frontend (Webflow/Next.js)

#### Opción A: Cookie HTTP-Only (Recomendada - Segura)
```javascript
// Al iniciar sesión exitosamente
async function onLoginSuccess(memberstackUser) {
  // Llamar a nuestra API para generar session token
  const response = await fetch('/api/auth/session-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memberstackId: memberstackUser.id,
      email: memberstackUser.auth.email
    })
  });
  
  const { sessionToken } = await response.json();
  
  // Guardar en cookie que el bot puede leer
  document.cookie = `vet_session=${sessionToken}; path=/; max-age=7200; SameSite=Lax`;
}
```

#### Opción B: localStorage (Más simple, menos segura)
```javascript
// Al iniciar sesión
localStorage.setItem('vet_session_token', sessionToken);

// El bot debe leer:
// const token = localStorage.getItem('vet_session_token');
```

### 4. Implementación del Bot (Lo que debe hacer la agencia)

```javascript
// Función que la agencia debe implementar en su bot
async function identifyUser() {
  // 1. Intentar obtener token de sesión
  const sessionToken = getCookie('vet_session'); // o localStorage
  
  if (sessionToken) {
    // 2. Llamar a nuestra API con el token
    const response = await fetch(
      `https://tudominio.com/api/integrations/vet-bot/context?sessionToken=${sessionToken}`,
      {
        headers: {
          'x-vet-bot-key': 'pata-amiga-vet-bot-secret-2026'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        identified: true,
        user: data.user,
        pets: data.pets,
        history: data.consultationHistory
      };
    }
  }
  
  // 3. Fallback: preguntar email (comportamiento actual)
  return { identified: false };
}

// Uso en el flujo del bot
const userContext = await identifyUser();

if (userContext.identified) {
  // Saludo personalizado
  return `¡Hola ${userContext.user.firstName}! Veo que tienes a ${userContext.pets[0].name}. ¿En qué puedo ayudarte hoy?`;
} else {
  // Comportamiento actual
  return "Para ayudarte mejor, ¿podrías proporcionarme tu email?";
}
```

---

## 📝 IMPLEMENTACIÓN EN NUESTRO SISTEMA

### Paso 1: Crear Tabla de Sesiones

```sql
-- Tabla para tokens de sesión del vet-bot
CREATE TABLE IF NOT EXISTS public.vet_bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memberstack_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL, -- Token corto de 32-64 chars
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT
);

-- Índices
CREATE INDEX idx_vet_bot_sessions_token ON public.vet_bot_sessions(token);
CREATE INDEX idx_vet_bot_sessions_memberstack_id ON public.vet_bot_sessions(memberstack_id);
CREATE INDEX idx_vet_bot_sessions_expires ON public.vet_bot_sessions(expires_at);

-- Cleanup automático de sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_vet_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.vet_bot_sessions 
    WHERE expires_at < NOW() 
       OR (last_used_at IS NOT NULL AND last_used_at < NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;
```

### Paso 2: Crear API de Generación de Token

**Archivo:** `src/app/api/auth/session-token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { memberstackId, email } = await request.json();
    
    if (!memberstackId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generar token único (32 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Expira en 2 horas
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);
    
    // Guardar en Supabase
    const { data, error } = await supabaseAdmin
      .from('vet_bot_sessions')
      .insert({
        memberstack_id: memberstackId,
        email: email.toLowerCase().trim(),
        token: token,
        expires_at: expiresAt.toISOString(),
        ip_address: request.ip || request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sessionToken: token,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Session token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Paso 3: Actualizar Endpoint de Contexto del Bot

**Modificación:** `src/app/api/integrations/vet-bot/context/route.ts`

```typescript
// Añadir al inicio del GET:
const sessionToken = searchParams.get('sessionToken');

// Modificar la lógica de búsqueda:
let memberstackId: string | null = null;

if (sessionToken) {
  // Validar token de sesión
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('vet_bot_sessions')
    .select('memberstack_id, email')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .single();
  
  if (session) {
    memberstackId = session.memberstack_id;
    // Actualizar last_used_at
    await supabaseAdmin
      .from('vet_bot_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token', sessionToken);
  }
}

// Continuar con la búsqueda de usuario usando memberstackId
```

### Paso 4: Widget de Integración para Webflow

**Archivo:** `public/widgets/vet-bot-auth-bridge.js`

```javascript
/**
 * Vet Bot Auth Bridge
 * Este script debe incluirse en Webflow junto con Memberstack
 * Se encarga de sincronizar la sesión de Memberstack con el bot
 */

(function() {
  'use strict';
  
  const CONFIG = {
    apiUrl: 'https://tudominio.com/api',
    cookieName: 'vet_session',
    sessionDuration: 2 * 60 * 60 // 2 horas en segundos
  };
  
  // Esperar a que Memberstack cargue
  function waitForMemberstack() {
    return new Promise((resolve) => {
      if (window.$memberstackDom) {
        resolve(window.$memberstackDom);
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (window.$memberstackDom) {
          clearInterval(checkInterval);
          resolve(window.$memberstackDom);
        }
      }, 500);
      
      // Timeout a 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 10000);
    });
  }
  
  // Generar token de sesión
  async function generateSessionToken(member) {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/auth/session-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberstackId: member.id,
          email: member.auth?.email || member.email
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate token');
      
      const data = await response.json();
      return data.sessionToken;
    } catch (error) {
      console.error('[VetBotBridge] Error generating token:', error);
      return null;
    }
  }
  
  // Guardar token en cookie
  function setSessionCookie(token) {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + CONFIG.sessionDuration);
    
    document.cookie = `${CONFIG.cookieName}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    console.log('[VetBotBridge] Session token set');
  }
  
  // Eliminar cookie
  function clearSessionCookie() {
    document.cookie = `${CONFIG.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log('[VetBotBridge] Session token cleared');
  }
  
  // Inicializar
  async function init() {
    console.log('[VetBotBridge] Initializing...');
    
    const memberstack = await waitForMemberstack();
    if (!memberstack) {
      console.warn('[VetBotBridge] Memberstack not found');
      return;
    }
    
    // Escuchar cambios de autenticación
    memberstack.onAuthChange(async (event) => {
      console.log('[VetBotBridge] Auth change:', event.type);
      
      if (event.type === 'login' || event.type === 'signup') {
        // Usuario inició sesión - generar token
        const member = await memberstack.getCurrentMember();
        if (member) {
          const token = await generateSessionToken(member);
          if (token) setSessionCookie(token);
        }
      } else if (event.type === 'logout') {
        // Usuario cerró sesión - limpiar token
        clearSessionCookie();
      }
    });
    
    // Verificar si ya hay sesión activa al cargar
    const currentMember = await memberstack.getCurrentMember();
    if (currentMember) {
      // Verificar si ya existe cookie
      const hasCookie = document.cookie.includes(`${CONFIG.cookieName}=`);
      if (!hasCookie) {
        const token = await generateSessionToken(currentMember);
        if (token) setSessionCookie(token);
      }
    }
    
    console.log('[VetBotBridge] Ready');
  }
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

---

## 📧 INSTRUCCIONES PARA ENVIAR A LA AGENCIA

### Email Sugerido

```
Asunto: Actualización API Vet-Bot - Nueva forma de identificación de usuarios

Hola [Nombre],

Espero que estén bien. Les escribo para compartir una mejora importante 
en la integración del chatbot que reducirá costos de OpenAI y mejorará 
la experiencia del usuario.

RESUMEN DEL CAMBIO:
Actualmente el bot pregunta el email al usuario. Hemos implementado un 
sistema de tokens de sesión que permite identificar automáticamente al 
usuario cuando ya ha iniciado sesión en la plataforma.

IMPLEMENTACIÓN REQUERIDA:
Necesitamos que actualicen el bot para:

1. ANTES de preguntar el email, intentar leer la cookie "vet_session"
2. Si existe la cookie, llamar a nuestro endpoint incluyendo el token:
   
   GET https://tudominio.com/api/integrations/vet-bot/context?sessionToken=TOKEN

3. Si la respuesta es 200, usar los datos del usuario (nombre, mascotas, etc.)
4. Si la respuesta es 401 o no hay cookie, proceder con el flujo actual 
   (preguntar email)

DOCUMENTACIÓN TÉCNICA:
Adjunto documento técnico con especificaciones completas.

PREGUNTAS FRECUENTES:

Q: ¿Necesitamos que nos envíen datos desde su frontend?
R: No. El bot solo necesita leer la cookie que ya existe en el navegador.

Q: ¿Qué pasa si el usuario no ha iniciado sesión?
R: El bot sigue funcionando exactamente igual que ahora (pregunta email).

Q: ¿Es obligatorio este cambio?
R: No, pero reduce costos de OpenAI en ~20-30% (menos tokens por no 
   preguntar datos que ya tenemos).

Q: ¿Hay cambios en los endpoints actuales?
R: No, son 100% backwards compatible. Solo agregamos el parámetro 
   opcional "sessionToken".

Quedo atento a sus comentarios o dudas.

Saludos,
[Tu nombre]
```

---

## ⚠️ ALTERNATIVA: Código de Vinculación (Si la agencia insiste)

Si la agencia sigue diciendo que "no pueden leer cookies", la alternativa es un **código de vinculación** de 6 dígitos:

### Flujo
1. Usuario inicia sesión
2. En el dashboard aparece: "Tu código de soporte: 123456"
3. Usuario abre el chat
4. Bot pregunta: "¿Tienes un código de soporte?"
5. Usuario introduce: 123456
6. Bot valida con nuestra API y obtiene los datos

### Implementación
```javascript
// Endpoint adicional
GET /api/integrations/vet-bot/verify-code?code=123456

// Respuesta igual al endpoint de contexto actual
```

**Ventaja:** No requiere que el bot lea cookies  
**Desventaja:** El usuario debe introducir el código manualmente

---

## 📊 COMPARATIVA DE ENFOQUES

| Enfoque | Friction | Costo OpenAI | Esfuerzo Agencia | Seguridad |
|---------|----------|--------------|------------------|-----------|
| Email (actual) | Alto | Alto | N/A | Media |
| Token Cookie | Cero | Bajo | Medio | Alta |
| Código 6 dígitos | Medio | Medio | Bajo | Media |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Preparación (Nosotros)
- [ ] Crear tabla `vet_bot_sessions`
- [ ] Crear API `/auth/session-token`
- [ ] Actualizar API `/vet-bot/context` para aceptar tokens
- [ ] Crear widget `vet-bot-auth-bridge.js`
- [ ] Probar en ambiente de desarrollo

### Fase 2: Integración Webflow (Nosotros)
- [ ] Incluir widget en páginas de Webflow
- [ ] Verificar que la cookie se establece al login
- [ ] Verificar que la cookie se elimina al logout

### Fase 3: Coordinación con Agencia
- [ ] Enviar documentación técnica
- [ ] Confirmar que pueden leer cookies
- [ ] Establecer timeline de implementación

### Fase 4: Testing
- [ ] Usuario logueado → Bot identifica automáticamente
- [ ] Usuario no logueado → Bot pregunta email (fallback)
- [ ] Token expirado → Bot pregunta email

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Confirmar con la agencia:** ¿Pueden leer cookies del navegador? (Sí/No)
2. **Si SÍ:** Implementar solución de Token Cookie
3. **Si NO:** Implementar solución de Código de Vinculación
4. **Independientemente:** Crear los endpoints y tabla en Supabase

---

**Documento preparado por:** Assistant  
**Fecha:** Febrero 2026  
**Versión:** 1.0
