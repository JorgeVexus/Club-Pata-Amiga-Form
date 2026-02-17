# Configuración de Login/Redirección en Webflow

## 🎯 Objetivo
Eliminar el puente en `app.pataamiga.mx` y hacer que todo funcione directamente en Webflow.

## 📋 Cambios a Realizar en Webflow

### 1. En la Página de Login (`/user/inicio-de-sesion`)

**Dónde:** Custom Code → Footer Code

**Script:**
```html
<script>
(function() {
    'use strict';
    
    const CONFIG = {
        apiUrl: 'https://app.pataamiga.mx/api',
        dashboards: {
            member: 'https://www.pataamiga.mx/pets/pet-waiting-period',
            ambassador: 'https://www.pataamiga.mx/embajadores/dashboard',
            admin: 'https://app.pataamiga.mx/admin/dashboard'
        }
    };
    
    async function checkRoleAndRedirect(member) {
        if (!member || !member.id) return;
        
        try {
            const response = await fetch(`${CONFIG.apiUrl}/auth/check-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstackId: member.id })
            });
            
            if (!response.ok) throw new Error('API error');
            
            const data = await response.json();
            
            // Redirigir según rol
            if (data.role === 'admin') {
                window.location.href = CONFIG.dashboards.admin;
            } else if (data.role === 'ambassador') {
                window.location.href = CONFIG.dashboards.ambassador;
            } else {
                window.location.href = CONFIG.dashboards.member;
            }
            
        } catch (error) {
            console.error('Error:', error);
            // Fallback
            window.location.href = CONFIG.dashboards.member;
        }
    }
    
    function init() {
        if (!window.$memberstackDom) return;
        
        // Escuchar login
        window.$memberstackDom.onAuthChange((event) => {
            if (event.type === 'login' || event.type === 'signup') {
                setTimeout(async () => {
                    const member = await window.$memberstackDom.getCurrentMember();
                    if (member && member.data) {
                        await checkRoleAndRedirect(member.data);
                    }
                }, 500);
            }
        });
        
        // Si ya está logueado en página de login, redirigir
        window.$memberstackDom.getCurrentMember().then((member) => {
            if (member && member.data) {
                checkRoleAndRedirect(member.data);
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
```

**Qué hace:**
- Detecta cuando el usuario inicia sesión
- Consulta la API para saber si es miembro, embajador o admin
- Redirige automáticamente al dashboard correspondiente

---

### 2. En el Dashboard de Miembros (`/pets/pet-waiting-period`)

**Dónde:** Custom Code → Header Code (antes de todo)

**Script:**
```html
<script>
(function() {
    'use strict';
    
    const LOGIN_URL = 'https://www.pataamiga.mx/user/inicio-de-sesion';
    
    async function verifyAccess() {
        // Esperar a Memberstack
        let attempts = 0;
        while (!window.$memberstackDom && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (!window.$memberstackDom) {
            window.location.href = LOGIN_URL;
            return;
        }
        
        const member = await window.$memberstackDom.getCurrentMember();
        
        if (!member || !member.data) {
            // Guardar URL para volver después del login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = LOGIN_URL;
            return;
        }
        
        // Usuario logueado - mostrar contenido
        console.log('✅ Acceso permitido:', member.data.auth?.email);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyAccess);
    } else {
        verifyAccess();
    }
})();
</script>
```

**Qué hace:**
- Verifica que el usuario esté logueado
- Si no está logueado, redirige al login
- Si está logueado, muestra el dashboard

---

### 3. En el Dashboard de Embajadores (`/embajadores/dashboard`)

**Dónde:** Custom Code → Header Code (antes de todo)

**Script:**
```html
<script>
(function() {
    'use strict';
    
    const CONFIG = {
        loginUrl: 'https://www.pataamiga.mx/user/inicio-de-sesion',
        memberDashboard: 'https://www.pataamiga.mx/pets/pet-waiting-period',
        apiUrl: 'https://app.pataamiga.mx/api'
    };
    
    async function verifyAccess() {
        // Esperar a Memberstack
        let attempts = 0;
        while (!window.$memberstackDom && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (!window.$memberstackDom) {
            window.location.href = CONFIG.loginUrl;
            return;
        }
        
        const member = await window.$memberstackDom.getCurrentMember();
        
        if (!member || !member.data) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = CONFIG.loginUrl;
            return;
        }
        
        // Verificar que sea embajador
        try {
            const response = await fetch(`${CONFIG.apiUrl}/auth/check-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberstackId: member.data.id })
            });
            
            if (!response.ok) throw new Error('API error');
            
            const data = await response.json();
            
            if (data.role !== 'ambassador') {
                // No es embajador, mandar al dashboard de miembro
                window.location.href = CONFIG.memberDashboard;
                return;
            }
            
            console.log('✅ Embajador verificado:', member.data.auth?.email);
            
        } catch (error) {
            console.error('Error verificando rol:', error);
            // En caso de error, dejar pasar (fail-open)
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyAccess);
    } else {
        verifyAccess();
    }
})();
</script>
```

**Qué hace:**
- Verifica que el usuario esté logueado
- Verifica que sea embajador
- Si no es embajador, lo manda al dashboard de miembro
- Si no está logueado, manda al login

---

## 🧪 Flujo Completo de Usuario

### Escenario 1: Usuario NO logueado

1. Va a `www.pataamiga.mx/user/inicio-de-sesion`
2. Ve el formulario de login
3. Inicia sesión
4. El script detecta el login
5. Consulta la API para saber su rol
6. Redirige al dashboard correspondiente

### Escenario 2: Usuario logueado va al login

1. Va a `www.pataamiga.mx/user/inicio-de-sesion`
2. El script detecta que ya está logueado
3. Redirige automáticamente a su dashboard

### Escenario 3: Usuario logueado va a dashboard

1. Va a `www.pataamiga.mx/pets/pet-waiting-period`
2. El script verifica la sesión
3. Muestra el contenido del dashboard

### Escenario 4: Usuario intenta acceder a dashboard de embajador sin serlo

1. Va a `www.pataamiga.mx/embajadores/dashboard`
2. El script verifica que NO es embajador
3. Lo redirige al dashboard de miembro

---

## ⚠️ Importante

### ¿Qué pasa con app.pataamiga.mx?

Ya **NO es necesario** usar `app.pataamiga.mx` como puente. El flujo ahora es:

```
Webflow Login → Webflow Dashboard
     ↓
Memberstack detecta sesión
     ↓
API consulta rol
     ↓
Redirección al dashboard correcto
```

### URLs actualizadas:

| Página | URL |
|--------|-----|
| Login | `https://www.pataamiga.mx/user/inicio-de-sesion` |
| Dashboard Miembro | `https://www.pataamiga.mx/pets/pet-waiting-period` |
| Dashboard Embajador | `https://www.pataamiga.mx/embajadores/dashboard` |
| Dashboard Admin | `https://app.pataamiga.mx/admin/dashboard` (sigue aquí) |

---

## ✅ Checklist de Implementación

- [ ] Agregar script de login en página de login de Webflow
- [ ] Agregar script de protección en dashboard de miembros
- [ ] Agregar script de protección en dashboard de embajadores
- [ ] Probar flujo completo con usuario de prueba
- [ ] Probar redirección de embajador a miembro
- [ ] Probar que usuario no logueado no pueda ver dashboards

---

## 🆘 Solución de Problemas

### "Me manda al login aunque esté logueado"
- Verificar que el script de Memberstack esté cargado antes
- Revisar consola por errores de CORS

### "No redirige después del login"
- Verificar que el evento `onAuthChange` esté funcionando
- Probar con `window.$memberstackDom.openModal('LOGIN')` en consola

### "Error de CORS"
- Verificar que la API `app.pataamiga.mx/api/auth/check-role` responda correctamente
- Los headers CORS ya están configurados en el código

---

¿Necesitas ayuda con algún paso específico?
