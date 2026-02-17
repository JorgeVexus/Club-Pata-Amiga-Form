# AGENTS.md - Pet Membership Form

> Este archivo contiene información esencial para agentes de IA que trabajen en este proyecto. El proyecto está documentado principalmente en español.

## Visión General del Proyecto

**Pet Membership Form** es un sistema completo de registro de membresías para mascotas que integra múltiples tecnologías para gestionar usuarios, mascotas, pagos y un dashboard administrativo.

### Propósito Principal
- Registro de usuarios con datos personales y documentos (INE, comprobante de domicilio)
- Registro de hasta 3 mascotas por usuario con fotos y documentación veterinaria
- Período de carencia automático (90 días para usuarios, 120-180 días para mascotas)
- Sistema de apelaciones para rechazos
- Dashboard administrativo completo
- Sistema de embajadores con códigos de referido
- Integración CRM con LynSales

---

## Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js | 15.5.9 |
| Lenguaje | TypeScript | 5.3.3 |
| UI | React | 19.0.1 |
| Autenticación | Memberstack v2 | @memberstack/nextjs ^1.0.2 |
| Base de Datos | Supabase | @supabase/supabase-js ^2.39.3 |
| CMS | Sanity | @sanity/client ^7.14.1 |
| Email | Resend | ^6.6.0 |
| Pagos | Stripe | ^20.3.1 |
| Estilos | CSS Modules + Variables CSS | - |
| Fonts | Google Fonts (Outfit, Fraiche) | - |

---

## Estructura del Proyecto

```
pet-membership-form/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Layout principal con Memberstack
│   │   ├── globals.css              # Variables CSS y estilos globales
│   │   ├── page.tsx                 # Página principal
│   │   ├── completar-perfil/        # Flujo post-pago
│   │   ├── registrar-mascotas/      # Registro de mascotas
│   │   ├── seleccion-plan/          # Selección de plan y pago
│   │   ├── embajadores/registro/    # Registro de embajadores
│   │   ├── admin/                   # Dashboard admin
│   │   │   ├── login/               # Login admin
│   │   │   ├── register/            # Registro admin
│   │   │   └── dashboard/           # Panel principal admin
│   │   ├── api/                     # API Routes
│   │   │   ├── admin/               # Endpoints de administración
│   │   │   ├── user/                # Endpoints de usuario
│   │   │   ├── upload/              # Subida de archivos
│   │   │   └── ...
│   │   └── usuarios/registro/       # Registro inicial de usuarios
│   ├── components/
│   │   ├── Admin/                   # Componentes del dashboard admin
│   │   ├── AmbassadorForm/          # Formulario de embajadores
│   │   ├── FormFields/              # Campos de formulario reutilizables
│   │   ├── PetRegistrationForm/     # Registro de mascotas
│   │   ├── PlanSelection/           # Selección de planes
│   │   ├── RegistrationForm/        # Registro de usuarios
│   │   └── UI/                      # Componentes UI genéricos
│   ├── services/                    # Lógica de negocio
│   │   ├── memberstack.service.ts   # Integración Memberstack
│   │   ├── supabase.service.ts      # Operaciones de storage
│   │   ├── pet.service.ts           # Lógica de mascotas
│   │   └── ...
│   ├── lib/                         # Configuraciones
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── sanity.ts                # Cliente Sanity
│   │   └── resend.ts                # Cliente Resend
│   ├── types/                       # TypeScript types
│   │   ├── form.types.ts            # Tipos de formularios
│   │   ├── pet.types.ts             # Tipos de mascotas
│   │   ├── admin.types.ts           # Tipos del admin
│   │   └── ambassador.types.ts      # Tipos de embajadores
│   ├── utils/                       # Utilidades
│   └── data/                        # Datos estáticos (razas, etc.)
├── webflow-components/              # Componentes para Webflow
├── Documentacion/                   # Documentación extensa del proyecto
├── supabase-setup.sql               # Schema de base de datos
├── supabase-approval-system.sql     # Schema de sistema de aprobaciones
└── ... archivos de configuración
```

---

## Comandos de Build y Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev              # http://localhost:3000

# Build de producción
npm run build

# Iniciar producción local
npm start

# Type checking
npm run type-check       # tsc --noEmit

# Linting
npm run lint             # next lint
```

---

## Variables de Entorno

Crear archivo `.env.local` (copiar de `.env.example`):

```env
# Memberstack
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmiqkcuzv00670ssogle4ah3n
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjvhntxjkuuobgfslzlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Places API (hardcodeada en layout.tsx para desarrollo)
# AIzaSyAei8wBZ0fQRWGY9nInhuCep5K8cHkDtqs

# Ambiente
NODE_ENV=development
```

---

## Sistema de Diseño

### Variables CSS Principales (`src/app/globals.css`)

```css
:root {
  --color-primary: #7DD8D5;        /* Turquesa principal */
  --color-white: #FFFFFF;
  --color-text-dark: #2D3748;
  --color-text-light: #718096;
  --color-error: #E53E3E;
  --color-success: #38A169;
  
  --opacity-60: 0.6;               /* Opacidad de inputs */
  
  --radius-input: 50px;            /* Inputs redondeados */
  --radius-container: 50px;        /* Contenedores redondeados */
  
  --font-heading: 'Fraiche', sans-serif;
  --font-body: 'Outfit', sans-serif;
}
```

### Botones (Estilos Globales)

- **Primario** (Siguiente/Enviar): Background `#FE8F15` (naranja)
- **Secundario** (Anterior/Cancelar): Background `#00BBB4` (turquesa)
- **Borde**: `2px solid #000000`
- **Border-radius**: `50px`
- **Font**: Fraiche Light

---

## Arquitectura de Datos

### Flujo de Registro

1. **Registro de Usuario** (`/usuarios/registro`)
   - Datos personales + documentos
   - Crea usuario en Memberstack
   - Guarda datos en Supabase
   - Estado: `pending` (esperando pago)

2. **Selección de Plan** (`/seleccion-plan`)
   - Muestra planes disponibles
   - Integración con Stripe
   - Estado post-pago: `pending_approval`

3. **Completar Perfil** (`/completar-perfil`)
   - Revisión de datos
   - Firma de contrato
   - Estado: `waiting_approval`

4. **Registro de Mascotas** (`/registrar-mascotas`)
   - Hasta 3 mascotas
   - Fotos y documentos
   - Cálculo de período de carencia

### Estados de Aprobación (Memberstack Custom Fields)

- `pending` - Esperando pago
- `pending_approval` - Pago realizado, esperando completar perfil
- `waiting_approval` - Perfil completo, esperando revisión admin
- `approved` - Aprobado
- `rejected` - Rechazado
- `appealed` - Apelado

### Campos de Memberstack

Ver `MEMBERSTACK-FIELDS.md` para lista completa. Campos clave:

**Usuario (20 campos):**
- `first-name`, `paternal-last-name`, `maternal-last-name`
- `gender`, `birth-date`, `curp`
- `postal-code`, `state`, `city`, `colony`, `address`
- `phone`, `email`, `password`
- `ine-front-url`, `ine-back-url`, `proof-of-address-url`
- `registration-date`, `waiting-period-end`, `approval-status`

**Mascotas (57 campos - 19 por mascota × 3):**
- `pet-1-name`, `pet-1-type`, `pet-1-breed`, `pet-1-age`, etc.
- `pet-1-waiting-period-end`, `pet-1-is-active`

---

## Buckets de Supabase Storage

| Bucket | Propósito | Privacidad |
|--------|-----------|------------|
| `ine-documents` | INE (frente y reverso) | Privado |
| `proof-of-address` | Comprobantes de domicilio | Privado |
| `pet-photos` | Fotos de mascotas | Público |
| `vet-certificates` | Certificados veterinarios | Privado |
| `ambassador-documents` | Documentos de embajadores | Privado |

---

## Convenciones de Código

### TypeScript
- **Estricto**: `strict: true` en tsconfig.json
- **No usar `any`**: Definir tipos específicos siempre
- **Imports con alias**: Usar `@/components`, `@/services`, etc.

### Estructura de Componentes
```typescript
// 1. Imports
import { useState } from 'react';
import styles from './ComponentName.module.css';

// 2. Types (si no están en archivo separado)
interface Props { ... }

// 3. Componente
export default function ComponentName({ prop1, prop2 }: Props) {
  // Lógica
  return ( ... );
}
```

### CSS Modules
- Nombre: `ComponentName.module.css`
- Clases: camelCase
- Variables CSS: Usar las globales definidas en `:root`

### Manejo de Errores
```typescript
try {
  await someOperation();
} catch (error) {
  console.error('❌ Error específico:', error);
  // Mostrar mensaje al usuario
}
```

---

## API Routes Principales

### Admin
- `GET/POST /api/admin/members` - Listar/crear miembros
- `POST /api/admin/members/[id]/approve` - Aprobar miembro
- `POST /api/admin/members/[id]/reject` - Rechazar miembro
- `POST /api/admin/members/[id]/refund` - Reembolsar
- `GET /api/admin/metrics` - Métricas del dashboard
- `GET /api/admin/notifications` - Notificaciones admin

### User
- `GET/POST /api/user/pets` - Gestionar mascotas
- `POST /api/user/appeal` - Crear apelación
- `GET /api/user/appeal-history` - Historial de apelaciones

### Upload
- `POST /api/upload/pet-photo` - Subir foto de mascota
- `POST /api/upload/ambassador-doc` - Subir documento de embajador

---

## Testing

### Datos de Prueba
- **CP**: 01000 (Ciudad de México)
- **CURP**: ABCD123456HDFRNN09
- **Email**: test@example.com
- **Teléfono**: 555 555 5555

### Verificaciones Post-Cambios
1. Registro de usuario completo
2. Subida de documentos
3. Integración con Memberstack
4. Dashboard admin funcional
5. Responsive design (mobile/desktop)

---

## Documentación Adicional

| Archivo | Contenido |
|---------|-----------|
| `README.md` | Guía de inicio rápido |
| `DEVELOPER-GUIDE.md` | Guía completa para desarrolladores |
| `DEPLOYMENT.md` | Guía de deployment a Vercel |
| `MEMBERSTACK-FIELDS.md` | Lista completa de campos Memberstack |
| `WEBFLOW-DASHBOARD-GUIDE.md` | Integración con Webflow |
| `TROUBLESHOOTING-WAITING-PERIOD.md` | Solución de problemas |
| `Documentacion/` | Carpeta con documentación extensa |

---

## Consideraciones de Seguridad

1. **Variables de entorno**: Nunca hardcodear secrets en el código
2. **Buckets privados**: Documentos sensibles (INE) en buckets privados
3. **RLS**: Row Level Security habilitado en Supabase
4. **Validación**: Doble validación (frontend + backend)
5. **HTTPS**: Requerido en producción (automático en Vercel)

---

## Despliegue

### Plataforma: Vercel (Recomendado)

1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push

### Integración Webflow
- El formulario se embebe en Webflow via iframe
- Dashboard de usuario implementado en Webflow directamente
- Comunicación via postMessage y Memberstack DOM API

---

## Contacto y Soporte

Para dudas técnicas:
1. Revisar documentación en `/Documentacion/`
2. Consultar logs en Vercel
3. Verificar configuración en Memberstack y Supabase

---

**Última actualización**: Febrero 2026
**Idioma principal del proyecto**: Español
