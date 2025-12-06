# Pet Membership Registration Form

Sistema de registro de membresías para mascotas con integración a Memberstack y Supabase.

## 🐾 Características

- ✅ Formulario de registro de usuario con validación completa
- ✅ Integración con Memberstack para gestión de usuarios
- ✅ Almacenamiento seguro de documentos en Supabase
- ✅ Auto-completado de dirección con API de códigos postales de México
- ✅ Diseño responsive y moderno
- ✅ Período de carencia de 90 días automático
- ✅ Subida de archivos con drag & drop
- ✅ Validación en tiempo real

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tus credenciales:

```env
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmiqkcuzv00670ssogle4ah3n
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key
```

### 3. Configurar Supabase

1. Crea dos buckets en Supabase Storage:
   - `ine-documents` (privado)
   - `proof-of-address` (privado)

2. Configura las políticas de seguridad (ver `DEPLOYMENT.md`)

### 4. Configurar Memberstack

Crea los custom fields en Memberstack (ver `MEMBERSTACK-FIELDS.md` para la lista completa):

- first-name
- paternal-last-name
- maternal-last-name
- gender
- birth-date
- curp
- postal-code
- state
- city
- colony
- address
- phone
- ine-front-url
- ine-back-url
- proof-of-address-url
- registration-date
- waiting-period-end

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
├── components/            # Componentes React
│   ├── FormFields/       # Campos reutilizables
│   └── RegistrationForm/ # Formulario principal
├── services/             # Lógica de negocio
├── lib/                  # Configuraciones
└── types/                # TypeScript types
```

## 🛠️ Tecnologías

- **Framework**: Next.js 15.1.9 (con parche de seguridad CVE-2025-55182)
- **Lenguaje**: TypeScript
- **Autenticación**: Memberstack
- **Base de Datos**: Supabase
- **Estilos**: CSS Modules
- **Fuentes**: Google Fonts (Outfit)
- **API**: Copomex (códigos postales de México)

## 📚 Documentación

- [MEMBERSTACK-FIELDS.md](./MEMBERSTACK-FIELDS.md) - Lista completa de campos y configuración
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Guía para desarrolladores
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment a Vercel
- [WEBFLOW-DASHBOARD-GUIDE.md](./WEBFLOW-DASHBOARD-GUIDE.md) - Guía para crear dashboard en Webflow

## 🎨 Guía de Estilos

- **Color Principal**: #7DD8D5 (turquesa)
- **Border Radius**: 50px (inputs y contenedor)
- **Fuente**: Outfit (Google Fonts)
- **Opacidad de Inputs**: 60%

## 🔐 Seguridad

- ✅ Documentos almacenados en buckets privados
- ✅ Validación en frontend y backend
- ✅ Variables de entorno para credenciales
- ✅ Headers de seguridad configurados
- ✅ HTTPS en producción

## 📝 Campos del Formulario

### Información Personal
- Nombre completo (nombre, apellido paterno, apellido materno)
- Género (hombre, mujer, prefiero no especificar)
- Fecha de nacimiento
- CURP
- INE (frente y reverso)

### Dirección
- Código postal (auto-completa estado, ciudad, colonia)
- Dirección (opcional)
- Comprobante de domicilio

### Contacto
- Correo electrónico
- Teléfono (formato México: +52)
- Contraseña

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas.

### Dashboard en Webflow

El dashboard se implementa directamente en Webflow para máxima personalización. Ver [WEBFLOW-DASHBOARD-GUIDE.md](./WEBFLOW-DASHBOARD-GUIDE.md) para instrucciones completas.

## 🧪 Testing

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción localmente
npm start

# Type checking
npm run type-check
```

## 📊 Roadmap

- [x] Formulario de registro de usuario
- [ ] Formulario de registro de mascotas
- [x] Dashboard del usuario (Webflow)
- [ ] Gestión de membresía y fondo solidario
- [ ] Sistema de notificaciones
- [ ] Panel de administración

## 🤝 Contribuir

Este es un proyecto privado. Para modificaciones, consulta la [Guía para Desarrolladores](./DEVELOPER-GUIDE.md).

## 📄 Licencia

Propietario - Todos los derechos reservados

## 🆘 Soporte

Para dudas o problemas:

1. Revisa la documentación en este repositorio
2. Consulta los logs en Vercel
3. Verifica la configuración de Memberstack y Supabase

---

**Desarrollado con ❤️ para proteger a las mascotas de México 🐾**
