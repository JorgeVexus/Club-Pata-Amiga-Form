# 🐾 Club Pata Amiga — Plataforma de Membresías

Bienvenidos al repositorio oficial de **Club Pata Amiga**, la red de protección veterinaria y membresías para mascotas más completa de México. Este proyecto está construido con un stack moderno basado en **Next.js 16.2.6**, **Supabase** y **Memberstack**, e integra múltiples servicios de negocio.

---

## 📋 Tabla de Contenidos

- [1. Visión General](#1-visión-general)
- [2. Módulos del Sistema](#2-módulos-del-sistema)
- [3. Stack Tecnológico](#3-stack-tecnológico)
- [4. Estructura del Proyecto](#4-estructura-del-proyecto)
- [5. Arquitectura de Widgets (Webflow)](#5-arquitectura-de-widgets-webflow)
- [6. Configuración e Instalación Local](#6-configuración-e-instalación-local)
- [7. Variables de Entorno](#7-variables-de-entorno)
- [8. Comandos de Desarrollo](#8-comandos-de-desarrollo)
- [9. Modelo de Seguridad y CORS](#9-modelo-de-seguridad-y-cors)
- [10. Plan de Migración (Memberstack → Supabase Auth)](#10-plan-de-migración-memberstack--supabase-auth)
- [11. Documentación Adicional](#11-documentación-adicional)

---

## 1. Visión General

Club Pata Amiga conecta a dueños de mascotas en México con servicios veterinarios y de bienestar. La plataforma gestiona el flujo completo de adquisición de membresías, validación de identidad (INE, comprobantes de domicilio), registro de mascotas (perros y gatos), cálculo de períodos de carencia, reembolsos por emergencias, y una red completa de beneficios.

### Ciclo de Vida del Registro de un Miembro:
```
[Registro V2] → pending (Paso 1: Datos + INE)
     ↓
[Pago Stripe] → pending_approval (Paso 2: Checkout)
     ↓
[Completar Perfil] → waiting_approval (Paso 3: Firma Contrato)
     ↓
[Aprobación Admin] → approved | rejected (Paso 4: Registro de Mascotas)
     ↓                   ↓
[Miembro Activo]      [Apelación] → appealed → approved | rejected
```

---

## 2. Módulos del Sistema

### 🐾 Registro Integrado V2 (`/registro`)
- Flujo secuencial tipo stepper con persistencia automática intermedia en Supabase y sincronización con Memberstack.
- Auto-completado de direcciones mediante integración con la **API de Sepomex**.
- Carga fluida de documentos obligatorios (INE frente, INE reverso, comprobante de domicilio).

### 🏥 Fondo Solidario
- Sistema de apoyo económico para urgencias veterinarias.
- Aplica reglas estrictas de períodos de carencia: **90 días** para contratantes, **120 días** para perros y **180 días** para gatos.
- Formulario de reclamación y visualización del historial en tiempo real.

### 🤝 Sistema de Embajadores (`/embajadores`)
- Registro de promotores de marca con validación de documentos y aprobación de administración.
- Panel personalizado que muestra referidos, ganancias totales y material de marketing descargable.
- Generación y personalización única de códigos de referido (ej. `PATAMIGA-PEDRO`).

### ⚕️ Directorio de Bienestar (`/bienestar`)
- Catálogo interactivo de clínicas, hospitales y centros de salud de la red afiliados a Club Pata Amiga.
- Buscador y filtros dinámicos por estado, municipio y tipo de servicio (consultas, vacunación, cirugías, estética).

### 🤖 Vet Bot Bridge
- Integración segura con un asistente de inteligencia artificial para brindar orientación veterinaria básica 24/7 a miembros activos.

### 🛡️ Panel de Administración (`/admin/dashboard`)
- Panel completo para administradores del sistema (`admin` y `super_admin`) que permite:
  - Validar documentos y perfiles de nuevos miembros.
  - Aprobar/rechazar registros de embajadores y configurar montos de comisiones.
  - Gestionar solicitudes de reembolso del Fondo Solidario y omitir períodos de carencia si es necesario (`bypass-carencia`).
  - Consultar métricas del negocio (ingresos, miembros por plan, cancelaciones).
  - Enviar campañas informativas (Newsletter).

---

## 3. Stack Tecnológico

| Componente | Tecnología | Versión | Propósito / Rol |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | 16.2.6 | App Router, SSR nativo, API Routes y Middleware |
| **Lenguaje** | TypeScript | ^5.3.3 | Tipado estricto para estabilidad y robustez |
| **UI Library** | React | ^19.0.1 | Desarrollo modular de interfaces reactivas |
| **Auth** | Memberstack v2 | ^1.0.4 | Autenticación y membresías de usuarios finales |
| **Base de Datos** | Supabase (Postgres) | ^2.39.3 | Almacenamiento relacional (64+ migraciones) |
| **Storage** | Supabase Buckets | — | Archivos privados (INE, Comprobantes) y públicos (Fotos) |
| **Pagos** | Stripe | ^20.3.1 | Gestión de suscripciones recurrentes y webhooks |
| **CMS** | Sanity | ^7.14.1 | Repositorio dinámico para documentos legales y contratos |
| **Email** | Resend | ^6.6.0 | Notificaciones transaccionales automáticas |
| **CRM** | LynSales / LeadConnector | — | Sincronización comercial de leads y estado de membresías |
| **Estilos** | CSS Modules | — | Aislamiento de estilos mediante variables globales CSS |

---

## 4. Estructura del Proyecto

```
pet-membership-form/
├── src/
│   ├── app/                          # Next.js App Router (Páginas y API Routes)
│   │   ├── layout.tsx                # Layout principal (scripts externos y providers)
│   │   ├── admin/                    # Panel administrativo (/admin/dashboard)
│   │   ├── embajadores/              # Flujo de registro de embajadores
│   │   ├── usuarios/registro/        # Registro de usuarios finales (Paso 1)
│   │   ├── api/                      # Endpoints Backend (Serverless en Vercel)
│   │   └── ...
│   ├── components/                   # Componentes React
│   │   ├── Admin/                    # Componentes UI de administración
│   │   ├── RegistrationV2/           # Stepper y vistas de Registro V2
│   │   ├── UI/                       # Botones, modales y layouts base
│   │   └── ...
│   ├── services/                     # Servicios de lógica de negocio (Server-side)
│   │   ├── memberstack-admin.service.ts
│   │   ├── supabase.service.ts
│   │   ├── pet.service.ts
│   │   └── crm.service.ts
│   ├── lib/                          # Clientes inicializados (Supabase, Resend, Stripe)
│   └── types/                        # Declaración de tipos TypeScript
├── public/
│   ├── widgets/                      # Widgets JavaScript para Webflow
│   └── fonts/                        # Fuentes tipográficas (Fraiche, Outfit)
├── supabase/migrations/              # Migraciones de base de datos Postgres
├── changelogs/                       # Registro histórico de cambios diarios
├── vercel.json                       # Configuración de Cron Jobs
└── package.json                      # Scripts y dependencias
```

---

## 5. Arquitectura de Widgets (Webflow)

El sitio de marketing principal e interactivo de Club Pata Amiga está alojado en **Webflow**. Para dotarlo de lógica dinámica sin comprometer la seguridad, se inyectan widgets Javascript (`/public/widgets/*.js`) compilados y alojados en la app de Next.js.

### Funcionamiento Estándar:
1. El script busca un ID contenedor específico en el DOM de Webflow (ej: `<div id="pata-membership-dashboard">`).
2. El widget recupera la sesión del usuario cliente mediante `window.$memberstackDom.getCurrentMember()`.
3. Consume los endpoints internos de Next.js mediante peticiones `fetch()` enviando el header de autenticación seguro `x-memberstack-id`.
4. El widget renderiza la interfaz HTML y maneja estados de carga sin exponer credenciales críticas al navegador.

---

## 6. Configuración e Instalación Local

### Requisitos Previos:
- Node.js >= 18.17.0
- npm >= 9.0.0
- Acceso a proyectos de Supabase, Memberstack, Stripe y Resend en modo test.

### Paso 1: Clonar e Instalar
```bash
git clone https://github.com/JorgeVexus/Club-Pata-Amiga-Form.git
cd Club-Pata-Amiga-Form
npm install
```

### Paso 2: Configurar Variables de Entorno
Copia el archivo de ejemplo a tu configuración local:
```bash
cp .env.example .env.local
```
Edita `.env.local` y coloca las API Keys correspondientes de desarrollo.

---

## 7. Variables de Entorno

El archivo `.env.local` debe contener la siguiente estructura base:

```env
# Memberstack
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_...
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # ⚠️ SOLO SERVIDOR

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...                  # ⚠️ SOLO SERVIDOR
STRIPE_WEBHOOK_SECRET=whsec_...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Resend Email
RESEND_API_KEY=re_...

# CRM LynSales / LeadConnector
LYNSALES_API_URL=https://services.leadconnectorhq.com
LYNSALES_API_KEY=...
LYNSALES_LOCATION_ID=...

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. Comandos de Desarrollo

En la terminal puedes ejecutar los siguientes scripts:

```bash
# Iniciar servidor local (http://localhost:3000)
npm run dev

# Validar tipos con TypeScript
npm run type-check

# Analizar la calidad del código
npm run lint

# Generar empaquetado de producción
npm run build

# Levantar el empaquetado de producción localmente
npm start
```

---

## 9. Modelo de Seguridad y CORS

1. **Separación de Privilegios:**
   - En el cliente solo se expone la `anon_key` de Supabase, permitiendo el uso básico de realtime para notificaciones.
   - Las operaciones de creación, actualización y borrado pasan a través de las API Routes utilizando `supabaseAdmin` (habilitada con `service_role_key`) para evadir el RLS en el backend de forma segura y controlada.
2. **CORS Middleware (`src/middleware.ts`):**
   - Limita estrictamente el acceso a las API Routes a dominios autorizados de Club Pata Amiga (`pataamiga.mx`, `app.pataamiga.mx`, servidores locales de desarrollo y ramas de vista previa de Vercel).

---

## 10. Plan de Migración (Memberstack → Supabase Auth)

El roadmap del proyecto contempla una transición paulatina para migrar la autenticación de usuarios finales desde **Memberstack** hacia **Supabase Auth nativo**.

### Razones Clave:
- **Consolidación de Datos:** Evita duplicar información del usuario entre dos bases de datos y la fricción de sincronización manual.
- **Ahorro de Costos:** Supabase Auth es completamente gratuito hasta 50k MAU, mientras que Memberstack escala sus cobros linealmente por miembro.
- **Estructura Relacional:** Los datos complejos de mascotas pasarán a ser filas estructuradas y relacionadas en la base de datos Postgres de Supabase en lugar de campos personalizados planos.
- **Performance:** Al migrar el dashboard del usuario final de Webflow a páginas Next.js nativas, se reduce el bundle-size al eliminar scripts JS pesados (widgets de hasta 300KB).

*Para consultar los detalles de este plan, revisa la sección 19 del archivo [ARQUITECTURA-TECNICA-COMPLETA.md](./Documentacion/ARQUITECTURA-TECNICA-COMPLETA.md).*

---

## 11. Documentación Adicional

Para profundizar en áreas particulares del desarrollo, consulta la carpeta `/Documentacion` y los siguientes archivos Markdown:

- [AGENTS.md](./AGENTS.md) — Reglas operacionales y flujo de trabajo para agentes de Inteligencia Artificial en el repositorio.
- [ARQUITECTURA-TECNICA-COMPLETA.md](./Documentacion/ARQUITECTURA-TECNICA-COMPLETA.md) — Detalle técnico exhaustivo de tablas, endpoints, cron jobs e integraciones.
- [MEMBERSTACK-FIELDS.md](./MEMBERSTACK-FIELDS.md) — Mapeo completo de los campos personalizados de Memberstack para usuarios y mascotas.
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) — Guía práctica de edición de código y convenciones del frontend.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Guía paso a paso para la configuración del despliegue en Vercel.
- [WEBFLOW-DASHBOARD-GUIDE.md](./WEBFLOW-DASHBOARD-GUIDE.md) — Guía técnica para sincronizar y desplegar los widgets JS embebidos en el sitio Webflow.

---

**Club Pata Amiga — Protegiendo la salud de quienes más nos quieren 🐾**
