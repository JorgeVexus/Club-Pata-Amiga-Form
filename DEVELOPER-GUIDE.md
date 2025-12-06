# Guía para Desarrolladores - Pet Membership Form

Esta guía te ayudará a entender la arquitectura del proyecto y cómo realizar modificaciones comunes.

## 📁 Estructura del Proyecto

```
pet-membership-form/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Layout principal con Memberstack
│   │   ├── page.tsx             # Página principal
│   │   └── globals.css          # Estilos globales y variables CSS
│   ├── components/
│   │   ├── FormFields/          # Componentes reutilizables de campos
│   │   │   ├── TextInput.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── PostalCodeInput.tsx
│   │   │   └── PhoneInput.tsx
│   │   └── RegistrationForm/    # Formulario principal
│   │       ├── RegistrationForm.tsx
│   │       └── RegistrationForm.module.css
│   ├── services/                # Lógica de negocio
│   │   ├── memberstack.service.ts
│   │   ├── supabase.service.ts
│   │   └── postalCode.service.ts
│   ├── lib/                     # Configuraciones
│   │   └── supabase.ts
│   └── types/                   # TypeScript types
│       └── form.types.ts
├── .env.example                 # Template de variables de entorno
├── next.config.js              # Configuración de Next.js
├── package.json                # Dependencias
└── tsconfig.json               # Configuración de TypeScript
```

---

## 🎨 Sistema de Diseño

### Variables CSS

Todas las variables de diseño están en `src/app/globals.css`:

```css
:root {
  --color-primary: #7DD8D5;        /* Color principal (turquesa) */
  --color-white: #FFFFFF;
  --opacity-60: 0.6;               /* Opacidad de inputs */
  --radius-input: 50px;            /* Border radius de inputs */
  --radius-container: 50px;        /* Border radius del contenedor */
  --spacing-md: 1rem;              /* Espaciado medio */
  --font-family: 'Outfit', sans-serif;
}
```

### Cómo Cambiar Colores

1. Abre `src/app/globals.css`
2. Modifica las variables en `:root`
3. Los cambios se aplicarán automáticamente en toda la app

**Ejemplo**: Cambiar el color principal a azul:
```css
--color-primary: #4A90E2;
```

### Cómo Cambiar Border Radius

Para hacer los inputs más cuadrados:
```css
--radius-input: 20px;
--radius-container: 30px;
```

---

## 🔧 Modificaciones Comunes

### 1. Agregar un Nuevo Campo al Formulario

**Paso 1**: Agregar el campo al tipo TypeScript

Edita `src/types/form.types.ts`:
```typescript
export interface RegistrationFormData {
  // ... campos existentes
  nuevoCampo: string;  // Agregar aquí
}
```

**Paso 2**: Agregar el campo al estado del formulario

Edita `src/components/RegistrationForm/RegistrationForm.tsx`:
```typescript
const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
  // ... campos existentes
  nuevoCampo: '',  // Agregar aquí
});
```

**Paso 3**: Agregar el input en el JSX

```tsx
<TextInput
  label="Nuevo Campo"
  name="nuevoCampo"
  value={formData.nuevoCampo || ''}
  onChange={(value) => setFormData({ ...formData, nuevoCampo: value })}
  required
  memberstackField="nuevo-campo"
/>
```

**Paso 4**: Crear el custom field en Memberstack

1. Ve a Memberstack → Settings → Custom Fields
2. Crea un campo llamado `nuevo-campo`
3. Tipo: Text

---

### 2. Cambiar la Validación de un Campo

Edita la función `validateForm()` en `RegistrationForm.tsx`:

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  // Ejemplo: Validar que el CURP tenga exactamente 18 caracteres
  if (formData.curp && formData.curp.length !== 18) {
    newErrors.curp = 'El CURP debe tener 18 caracteres';
  }
  
  // Agregar más validaciones aquí
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

### 3. Personalizar Iconos

Los iconos actualmente son SVG inline. Para cambiarlos:

**Ejemplo**: Cambiar el icono del calendario en `DatePicker.tsx`

```tsx
<span className={styles.icon}>
  {/* Reemplaza este SVG con tu icono personalizado */}
  <svg width="20" height="20" viewBox="0 0 24 24">
    {/* ... tu SVG aquí */}
  </svg>
</span>
```

**Alternativa**: Usar iconos de una librería

1. Instala una librería de iconos:
```bash
npm install lucide-react
```

2. Importa y usa:
```tsx
import { Calendar } from 'lucide-react';

<span className={styles.icon}>
  <Calendar size={20} />
</span>
```

---

### 4. Cambiar el Texto del Formulario

Todos los textos están hardcodeados en `RegistrationForm.tsx`. Para cambiarlos:

```tsx
<h1 className={styles.title}>Cuéntanos sobre ti</h1>
<p className={styles.subtitle}>
  Para formar parte de esta manada, necesitamos conocerte un poquito
</p>
```

**Mejor práctica**: Crear un archivo de constantes:

```typescript
// src/constants/texts.ts
export const FORM_TEXTS = {
  title: 'Cuéntanos sobre ti',
  subtitle: 'Para formar parte de esta manada...',
  // ... más textos
};
```

Luego importar:
```tsx
import { FORM_TEXTS } from '@/constants/texts';

<h1>{FORM_TEXTS.title}</h1>
```

---

### 5. Agregar un Nuevo Paso al Formulario

El proyecto está diseñado para ser multi-paso. Para agregar el registro de mascotas:

**Paso 1**: Crear el componente

```tsx
// src/components/PetRegistrationForm/PetRegistrationForm.tsx
export default function PetRegistrationForm() {
  // ... lógica del formulario de mascotas
}
```

**Paso 2**: Agregar estado de pasos en la página principal

```tsx
// src/app/page.tsx
const [currentStep, setCurrentStep] = useState(1);

{currentStep === 1 && <RegistrationForm onComplete={() => setCurrentStep(2)} />}
{currentStep === 2 && <PetRegistrationForm />}
```

---

## 🔌 Integraciones

### Memberstack

**Archivo**: `src/services/memberstack.service.ts`

**Funciones principales**:
- `createMemberstackUser()`: Crea un usuario en Memberstack
- `updateMemberCustomFields()`: Actualiza campos personalizados

**Cómo agregar un nuevo custom field**:
```typescript
customFields: {
  // ... campos existentes
  'nuevo-campo': formData.nuevoCampo,
}
```

### Supabase

**Archivo**: `src/services/supabase.service.ts`

**Funciones principales**:
- `uploadFile()`: Sube un archivo
- `uploadMultipleFiles()`: Sube múltiples archivos
- `deleteFile()`: Elimina un archivo

**Cómo crear un nuevo bucket**:
```typescript
await supabase.storage.createBucket('nuevo-bucket', {
  public: false,
  fileSizeLimit: 5242880, // 5MB
});
```

### API de Códigos Postales

**Archivo**: `src/services/postalCode.service.ts`

**API usada**: Copomex (gratuita)

**Cómo cambiar a otra API**:
1. Modifica `POSTAL_CODE_API_URL` en `.env`
2. Actualiza la función `getAddressByPostalCode()` para parsear la nueva respuesta

---

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en Vercel:
   - `NEXT_PUBLIC_MEMBERSTACK_APP_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático en cada push

### Embed en Webflow

**Opción 1: iframe**
```html
<iframe 
  src="https://tu-app.vercel.app" 
  width="100%" 
  height="1200px"
  frameborder="0">
</iframe>
```

**Opción 2: Custom Code**
```html
<div id="pet-form-container"></div>
<script src="https://tu-app.vercel.app/_next/static/chunks/main.js"></script>
```

---

## 🧪 Testing

### Probar el Formulario Localmente

```bash
npm run dev
```

Abre `http://localhost:3000`

### Probar con Datos de Prueba

Usa estos datos para testing:

- **Código Postal**: 01000 (Ciudad de México)
- **CURP**: ABCD123456HDFRNN09
- **Email**: test@example.com
- **Teléfono**: 555 555 5555

---

## 📝 Mejores Prácticas

### 1. Siempre Usar TypeScript

Evita `any`, define tipos específicos:
```typescript
// ❌ Malo
const data: any = ...

// ✅ Bueno
const data: RegistrationFormData = ...
```

### 2. Componentes Reutilizables

Si un componente se usa más de una vez, muévelo a `src/components/`

### 3. Validación en Frontend y Backend

Nunca confíes solo en la validación del frontend. Memberstack también valida.

### 4. Manejo de Errores

Siempre usa try-catch y muestra mensajes claros al usuario:
```typescript
try {
  await uploadFile(...);
} catch (error) {
  alert('Error al subir el archivo. Por favor intenta de nuevo.');
}
```

---

## 🐛 Debugging

### El formulario no se envía

1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que Memberstack esté cargado: `window.$memberstackDom`

### Los archivos no se suben

1. Verifica las credenciales de Supabase en `.env`
2. Verifica que los buckets existan en Supabase
3. Revisa los permisos de los buckets

### La API de códigos postales no funciona

1. Prueba la API manualmente: `https://api.copomex.com/query/info_cp/01000`
2. Verifica la consola para errores de CORS
3. Considera usar un proxy si hay problemas de CORS

---

## 📞 Soporte

Si tienes dudas:

1. Revisa la documentación de [Next.js](https://nextjs.org/docs)
2. Revisa la documentación de [Memberstack](https://docs.memberstack.com/)
3. Revisa la documentación de [Supabase](https://supabase.com/docs)

---

## 🔄 Actualizaciones Futuras

### Roadmap Sugerido

1. **Dashboard de Usuario**: Página donde el usuario vea su información
2. **Registro de Mascotas**: Formulario para agregar mascotas
3. **Gestión de Membresía**: Ver estado de membresía y fondo solidario
4. **Notificaciones**: Sistema de notificaciones por email
5. **Panel Admin**: Para gestionar usuarios y solicitudes

### Cómo Agregar el Dashboard

1. Crea `src/app/dashboard/page.tsx`
2. Protege la ruta con Memberstack:
```tsx
'use client';
import { useEffect } from 'react';

export default function Dashboard() {
  useEffect(() => {
    // Verificar autenticación
    window.$memberstackDom?.getCurrentMember().then(member => {
      if (!member) {
        window.location.href = '/';
      }
    });
  }, []);
  
  return <div>Dashboard</div>;
}
```

---

## ✅ Checklist de Mantenimiento

- [ ] Actualizar dependencias mensualmente: `npm update`
- [ ] Revisar logs de errores en Vercel
- [ ] Verificar que la API de Copomex siga funcionando
- [ ] Hacer backup de la base de datos de Supabase
- [ ] Revisar métricas de uso en Memberstack
- [ ] Actualizar Next.js cuando haya parches de seguridad

---

**¡Listo para desarrollar! 🚀**
