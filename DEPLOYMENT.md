# Guía de Deployment - Pet Membership Form

Esta guía te ayudará a desplegar tu aplicación en Vercel y embedirla en Webflow.

## 🚀 Deployment en Vercel

### Prerequisitos

1. Cuenta en [Vercel](https://vercel.com) (gratis)
2. Repositorio de GitHub con tu código
3. Credenciales de Supabase y Memberstack

---

### Paso 1: Preparar el Repositorio

1. **Inicializa Git** (si aún no lo has hecho):
```bash
cd pet-membership-form
git init
git add .
git commit -m "Initial commit"
```

2. **Crea un repositorio en GitHub**:
   - Ve a [GitHub](https://github.com/new)
   - Crea un nuevo repositorio (puede ser privado)
   - Copia la URL del repositorio

3. **Sube tu código**:
```bash
git remote add origin https://github.com/tu-usuario/pet-membership-form.git
git branch -M main
git push -u origin main
```

---

### Paso 2: Conectar con Vercel

1. **Inicia sesión en Vercel**: https://vercel.com

2. **Importa tu proyecto**:
   - Click en "Add New" → "Project"
   - Selecciona tu repositorio de GitHub
   - Click en "Import"

3. **Configura el proyecto**:
   - **Framework Preset**: Next.js (se detecta automáticamente)
   - **Root Directory**: `./` (dejar por defecto)
   - **Build Command**: `npm run build` (dejar por defecto)
   - **Output Directory**: `.next` (dejar por defecto)

---

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, agrega:

#### Memberstack
```
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmlcth68h00560ss15nat33ju
```

#### Supabase

Para obtener estas credenciales:
1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Settings → API
3. Copia los valores

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

#### API de Códigos Postales
```
NEXT_PUBLIC_POSTAL_CODE_API_URL=https://api.copomex.com/query/
```

**Importante**: Marca todas las variables como disponibles para **Production**, **Preview**, y **Development**

---

### Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel construye tu app
3. ¡Listo! Tu app estará disponible en `https://tu-proyecto.vercel.app`

---

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a tu proyecto → Settings → Domains
2. Agrega tu dominio personalizado (ej: `registro.tuempresa.com`)
3. Sigue las instrucciones para configurar los DNS

---

## 🔧 Configuración de Supabase

Antes de que el formulario funcione, debes configurar Supabase:

### 1. Crear Buckets de Storage

En tu proyecto de Supabase:

1. Ve a **Storage** en el menú lateral
2. Click en **"New bucket"**

**Bucket 1: INE Documents**
- Name: `ine-documents`
- Public: **No** (privado)
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg, image/png, application/pdf`

**Bucket 2: Proof of Address**
- Name: `proof-of-address`
- Public: **No** (privado)
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg, image/png, application/pdf`

### 2. Configurar Políticas de Seguridad (RLS)

Para cada bucket, configura las políticas:

1. Click en el bucket → Policies
2. Agrega estas políticas:

**Política de Upload** (para permitir subir archivos):
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ine-documents');
```

Repite para `proof-of-address`

**Política de Download** (para permitir descargar archivos):
```sql
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ine-documents');
```

Repite para `proof-of-address`

---

## 🌐 Embed en Webflow

Hay dos formas de integrar tu formulario en Webflow:

### Opción 1: iframe (Más Simple)

1. En Webflow, agrega un **Embed** element
2. Pega este código:

```html
<iframe 
  src="https://tu-proyecto.vercel.app"
  width="100%"
  height="1400px"
  frameborder="0"
  style="border: none; overflow: hidden;"
  scrolling="no">
</iframe>

<script>
  // Auto-ajustar altura del iframe
  window.addEventListener('message', function(e) {
    if (e.data.type === 'resize') {
      document.querySelector('iframe').style.height = e.data.height + 'px';
    }
  });
</script>
```

3. Publica tu sitio de Webflow

**Ventajas**:
- Fácil de implementar
- Aislado del resto del sitio

**Desventajas**:
- Puede tener problemas de altura
- No comparte cookies con Webflow

---

### Opción 2: Custom Code (Más Integrado)

1. En Webflow, ve a **Project Settings** → **Custom Code**
2. En el **Head Code**, agrega:

```html
<script>
  window.PET_FORM_CONFIG = {
    apiUrl: 'https://tu-proyecto.vercel.app',
    memberstackId: 'app_cmiqkcuzv00670ssogle4ah3n'
  };
</script>
```

3. En el **Footer Code**, agrega:

```html
<div id="pet-registration-form"></div>

<script type="module">
  import { initForm } from 'https://tu-proyecto.vercel.app/_next/static/chunks/form-init.js';
  initForm('#pet-registration-form');
</script>
```

**Nota**: Esta opción requiere exportar el formulario como un componente standalone. Contacta si necesitas ayuda con esto.

---

## 🔄 Actualizaciones Automáticas

Vercel se actualiza automáticamente cuando haces push a GitHub:

```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción de los cambios"
git push

# Vercel desplegará automáticamente en ~2 minutos
```

---

## 🧪 Testing en Producción

Antes de lanzar oficialmente:

1. **Prueba el formulario completo**:
   - Llena todos los campos
   - Sube archivos de prueba
   - Verifica que se cree el usuario en Memberstack
   - Verifica que los archivos se suban a Supabase

2. **Prueba en diferentes dispositivos**:
   - Desktop (Chrome, Firefox, Safari)
   - Mobile (iOS Safari, Android Chrome)
   - Tablet

3. **Verifica las integraciones**:
   - Memberstack: Ve a Members y verifica que aparezca el nuevo usuario
   - Supabase: Ve a Storage y verifica que aparezcan los archivos

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Causa**: Problemas de CORS o red

**Solución**:
1. Verifica que las URLs en `.env` sean correctas
2. Verifica que Supabase esté accesible
3. Revisa los logs en Vercel: Dashboard → Logs

### Error: "Memberstack is not defined"

**Causa**: El script de Memberstack no se cargó

**Solución**:
1. Verifica que el script esté en `layout.tsx`
2. Espera a que la página cargue completamente
3. Revisa la consola del navegador

### Los archivos no se suben

**Causa**: Problemas con Supabase Storage

**Solución**:
1. Verifica que los buckets existan
2. Verifica las políticas de seguridad (RLS)
3. Verifica las credenciales en Vercel

### El formulario se ve raro en mobile

**Causa**: Problemas de responsive design

**Solución**:
1. Abre las DevTools (F12)
2. Activa el modo responsive
3. Ajusta los estilos en los archivos `.module.css`

---

## 📊 Monitoreo

### Vercel Analytics

1. Ve a tu proyecto en Vercel
2. Analytics → Enable
3. Verás métricas de:
   - Visitas
   - Tiempo de carga
   - Errores

### Logs de Errores

Para ver errores en producción:
1. Vercel Dashboard → Tu proyecto → Logs
2. Filtra por "Errors"
3. Investiga y corrige

---

## 🔒 Seguridad

### Checklist de Seguridad

- [x] Variables de entorno no están en el código
- [x] Archivos se almacenan en buckets privados
- [x] Validación en frontend y backend
- [x] HTTPS habilitado (automático en Vercel)
- [x] Headers de seguridad configurados en `next.config.js`

### Actualizar Dependencias

Cada mes, actualiza las dependencias:

```bash
npm update
npm audit fix
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 🎯 Checklist de Deployment

Antes de lanzar:

- [ ] Todas las variables de entorno configuradas en Vercel
- [ ] Buckets de Supabase creados y configurados
- [ ] Custom fields creados en Memberstack
- [ ] Formulario probado end-to-end
- [ ] Responsive design verificado
- [ ] Dominio personalizado configurado (opcional)
- [ ] Analytics habilitado
- [ ] Backup de la base de datos configurado

---

## 📞 Soporte

Si tienes problemas:

1. **Vercel**: https://vercel.com/support
2. **Supabase**: https://supabase.com/support
3. **Memberstack**: https://help.memberstack.com/

---

## 🎉 ¡Listo!

Tu formulario de registro está ahora en producción. Los usuarios pueden:

1. Registrarse con su información personal
2. Subir sus documentos (INE y comprobante)
3. Crear su cuenta en Memberstack automáticamente
4. Comenzar su período de carencia de 90 días

**Próximos pasos sugeridos**:
- Agregar el formulario de registro de mascotas
- Crear el dashboard del usuario
- Implementar notificaciones por email
- Agregar analytics más detallados

¡Éxito con tu proyecto! 🚀🐾
