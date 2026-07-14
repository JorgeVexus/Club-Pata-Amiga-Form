# 🐾 Club Pata Amiga — Documentación Técnica Completa

> **Propósito de este documento:** Guía técnica exhaustiva para desarrolladores que se integran al proyecto. Cubre arquitectura, integraciones externas, base de datos, APIs, sistema de widgets y recomendaciones de migración.
>
> **Última actualización:** Julio 2026 | **Idioma del código:** Inglés | **Idioma de la UI:** Español

---

## Tabla de Contenidos

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura de Alto Nivel](#3-arquitectura-de-alto-nivel)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Flujo de Registro — Paso a Paso](#5-flujo-de-registro--paso-a-paso)
6. [Integraciones Externas Detalladas](#6-integraciones-externas-detalladas)
7. [Base de Datos — Schema Completo](#7-base-de-datos--schema-completo)
8. [API Routes — Mapa Completo](#8-api-routes--mapa-completo)
9. [Sistema de Widgets (Webflow)](#9-sistema-de-widgets-webflow)
10. [Modelo de Seguridad](#10-modelo-de-seguridad)
11. [Sistema de Autenticación Admin](#11-sistema-de-autenticación-admin)
12. [Cron Jobs y Automatizaciones](#12-cron-jobs-y-automatizaciones)
13. [Servicios de Negocio](#13-servicios-de-negocio)
14. [Sistema de Embajadores](#14-sistema-de-embajadores)
15. [Sistema de Fondo Solidario](#15-sistema-de-fondo-solidario)
16. [Sistema de Centros de Bienestar](#16-sistema-de-centros-de-bienestar)
17. [Variables de Entorno](#17-variables-de-entorno)
18. [Comandos de Desarrollo](#18-comandos-de-desarrollo)
19. [Recomendación de Migración: Next.js + Supabase Auth](#19-recomendación-de-migración-nextjs--supabase-auth)

---

## 1. Visión General del Producto

**Club Pata Amiga** es una plataforma de membresías para mascotas en México. Permite a los dueños registrar a sus mascotas (perros y gatos), pagar una membresía mensual, y acceder a beneficios como:

- **Fondo Solidario**: Apoyo económico en emergencias veterinarias (disponible tras período de espera)
- **Centro de Bienestar**: Red de veterinarias y centros de salud afiliados
- **Bot Veterinario**: Asistente de IA para consultas veterinarias básicas
- **Red de Embajadores**: Sistema de referidos con comisiones

### Estados del ciclo de vida de un miembro:

```
[Registro] → pending
    ↓
[Pago Stripe] → pending_approval
    ↓
[Completar Perfil] → waiting_approval
    ↓
[Revisión Admin] → approved | rejected
    ↓               ↓
[Activo]      [Apelación] → appealed → approved | rejected
```

Aqui se modificara el flujo d eaprobación, los miembros seran aprobados de inmediato al pagar y solo se tendran que aprobar las mascotas individualmente. 
---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión | Rol |
|-----------|-----------|---------|-----|
| **Framework** | Next.js | 16.2.6 | App Router, SSR, API Routes |
| **Lenguaje** | TypeScript | ^5.3.3 | Tipado estricto en todo el proyecto |
| **UI Library** | React | ^19.0.1 | Componentes de interfaz |
| **Autenticación** | Memberstack v2 | ^1.0.4 | Auth de usuarios finales |
| **Base de Datos** | Supabase (PostgreSQL) | ^2.39.3 | BD principal + Storage |
| **Pagos** | Stripe | ^20.3.1 | Suscripciones y webhooks |
| **CMS** | Sanity | ^7.14.1 | Documentos legales y contenido |
| **Email** | Resend | ^6.6.0 | Emails transaccionales |
| **Hosting** | Vercel | — | Deploy, Edge Functions, Crons |
| **Dashboard Usuario** | Webflow | — | Sitio público + dashboard |
| **CRM** | LynSales / LeadConnector | — | Gestión de contactos |
| **Estilos** | CSS Modules + Variables CSS | — | Scoped styles por componente |
| **Formularios** | react-hook-form | ^7.49.3 | Gestión de formularios |
| **Fechas** | date-fns | ^3.0.6 | Manejo de fechas/períodos |
| **IDs** | uuid | ^13.0.0 | Generación de UUIDs |
| **Bcrypt** | bcryptjs | ^3.0.3 | Hash de contraseñas admin |
| **Fuentes** | Google Fonts (Outfit, Fraiche) | — | Tipografía del diseño |

---

## 3. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                                │
└──────────────────────┬──────────────────────┬───────────────────────┘
                       │                      │
              ┌────────▼────────┐    ┌────────▼────────┐
              │    WEBFLOW      │    │   NEXT.JS APP   │
              │ (pataamiga.mx)  │    │(app.pataamiga.mx│
              │                 │    │  / Vercel)      │
              │ • Sitio público │    │                 │
              │ • Dashboard     │    │ • Registro      │
              │   usuario       │    │ • Selec. Plan   │
              │ • Widgets JS    │    │ • Admin Panel   │
              └────────┬────────┘    └────────┬────────┘
                       │                      │
              ┌────────▼──────────────────────▼────────┐
              │          NEXT.JS API ROUTES             │
              │         (/api/* — Vercel Serverless)    │
              └──────┬──────────┬──────────┬───────────┘
                     │          │          │
           ┌─────────▼──┐  ┌───▼────┐  ┌──▼──────────┐
           │ MEMBERSTACK │  │SUPABASE│  │   STRIPE    │
           │             │  │        │  │             │
           │ • Auth      │  │ • DB   │  │ • Pagos     │
           │ • Sesiones  │  │ • Files│  │ • Webhooks  │
           │ • Custom    │  │ • RLS  │  │             │
           │   Fields    │  └───┬────┘  └─────────────┘
           └─────────────┘      │
                                │
              ┌─────────────────▼───────────────────┐
              │          SERVICIOS EXTERNOS          │
              │  Resend • Sanity • LynSales CRM     │
              │  Sepomex • Google Maps • Vet Bot    │
              └─────────────────────────────────────┘
```

### Principio clave de arquitectura:

> **Memberstack es el sistema de identidad (Auth). Supabase es la base de datos operacional.**
> Los datos del usuario viven duplicados: campos básicos en Memberstack (para el dashboard de Webflow)
> y datos extendidos en Supabase (para lógica de negocio y storage).

---

## 4. Estructura del Proyecto

```
pet-membership-form/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout (Memberstack Script, GTM, Meta Pixel)
│   │   ├── globals.css              # Design tokens y variables CSS globales
│   │   ├── page.tsx                 # Redirect a /usuarios/registro
│   │   │
│   │   ├── usuarios/registro/       # Paso 1: Registro inicial del usuario
│   │   ├── seleccion-plan/          # Paso 2: Selección de plan + Stripe Checkout
│   │   ├── completar-perfil/        # Paso 3: Completar docs post-pago
│   │   ├── completar-documentacion/ # Paso 3b: Upload de documentos faltantes
│   │   ├── registrar-mascotas/      # Paso 4: Registro de mascotas (hasta 3)
│   │   │
│   │   ├── admin/                   # Dashboard Administrativo
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/
│   │   │
│   │   ├── embajadores/             # Formulario de registro de embajadores
│   │   ├── bienestar/               # Centros de Bienestar
│   │   ├── notificaciones/          # Centro de notificaciones
│   │   ├── payment-processing/      # Procesamiento de pago
│   │   ├── payment-success/         # Confirmación de pago
│   │   │
│   │   └── api/                     # API Routes
│   │       ├── admin/               # Endpoints de administración
│   │       ├── ambassadors/         # Gestión de embajadores
│   │       ├── auth/                # Autenticación y sesiones
│   │       ├── breeds/              # Catálogo de razas
│   │       ├── crm/                 # Sincronización CRM
│   │       ├── cron/                # Jobs programados (Vercel Crons)
│   │       ├── integrations/        # Integraciones externas (vet-bot)
│   │       ├── legal/               # Documentos legales
│   │       ├── memberstack/         # Proxy hacia Memberstack Admin API
│   │       ├── notifications/       # Sistema de notificaciones
│   │       ├── payouts/             # Pagos a embajadores
│   │       ├── referrals/           # Sistema de referidos
│   │       ├── sepomex/             # API de códigos postales MX
│   │       ├── solidarity/          # Fondo solidario
│   │       ├── stripe/webhook/      # Webhook de Stripe
│   │       ├── upload/              # Upload de archivos a Supabase Storage
│   │       ├── user/                # Endpoints de usuario autenticado
│   │       ├── webflow/             # Endpoints consumidos desde Webflow
│   │       └── wellness/            # Centros de Bienestar
│   │
│   ├── components/
│   │   ├── Admin/                   # Componentes del panel admin
│   │   ├── RegistrationForm/        # Formulario de registro (Este esta en desuso)
│   │   ├── RegistrationV2/          # Versión 2 del registro (stepper)
│   │   ├── PetRegistrationForm/     # Formulario de mascotas (Paso 4)
│   │   ├── PlanSelection/           # Selección de plan (Paso 2)
│   │   ├── AmbassadorForm/          # Formulario de embajadores
│   │   ├── AmbassadorReferralCode/  # Widget de código de referido
│   │   ├── Auth/                    # Componentes de autenticación
│   │   ├── FormFields/              # Campos reutilizables
│   │   ├── Notifications/           # Notificaciones en tiempo real
│   │   ├── Analytics/               # Meta Pixel + Google Tag Manager
│   │   ├── UI/                      # Componentes UI genéricos
│   │   └── WellnessForm/            # Formulario de centros de bienestar
│   │
│   ├── services/                    # Lógica de negocio (server-side)
│   │   ├── memberstack.service.ts
│   │   ├── memberstack-admin.service.ts
│   │   ├── supabase.service.ts
│   │   ├── pet.service.ts
│   │   ├── crm.service.ts
│   │   ├── comm.service.ts
│   │   ├── wellness.service.ts
│   │   ├── postalCode.service.ts
│   │   └── admin-auth.service.ts
│   │
│   ├── lib/                         # Clientes de servicios externos
│   │   ├── supabase.ts              # Clientes Supabase (público + admin)
│   │   ├── admin-auth.ts            # Middleware de autenticación admin
│   │   ├── resend.ts                # Cliente de Resend
│   │   ├── sanity.ts                # Cliente de Sanity CMS
│   │   └── stripe-membership.ts     # Helpers de Stripe
│   │
│   ├── types/                       # TypeScript types del dominio
│   │   ├── form.types.ts
│   │   ├── pet.types.ts
│   │   ├── admin.types.ts
│   │   └── ambassador.types.ts
│   │
│   ├── data/breeds/                 # Catálogos estáticos de razas
│   ├── utils/                       # Utilidades genéricas
│   └── middleware.ts                # CORS middleware para /api/*
│
├── public/
│   ├── widgets/                     # 45+ widgets JS para Webflow
│   ├── fonts/                       # Fuente custom "Fraiche"
│   ├── legal/                       # PDFs de documentos legales
│   └── Icons/ Identidad/            # Assets visuales
│
├── supabase/migrations/             # 64 migraciones SQL en orden cronológico
├── Documentacion/                   # Documentación técnica del proyecto
├── next.config.js
├── vercel.json                      # Cron jobs
├── tsconfig.json
└── .env.local / .env.example
```

---

## 5. Flujo de Registro — Paso a Paso

### Paso 1: Registro Inicial (`/usuarios/registro`)

1. Usuario llena el formulario con datos personales (nombre, CURP, dirección, teléfono, email, contraseña)
2. El código postal se valida con **API Sepomex** → auto-completa estado, ciudad y colonia
3. Usuario sube INE (frente y reverso) y comprobante de domicilio → van a **Supabase Storage** (buckets privados)
4. Al enviar:
   - Se crea la cuenta en **Memberstack** con los custom fields
   - Se guarda el perfil extendido en **Supabase** (tabla `users`)
   - Se crean los documentos en tabla `documents`
   - Se crea el contacto en **CRM LynSales**
   - Estado: `pending`

### Paso 2: Selección de Plan (`/seleccion-plan`)

1. Usuario ve los planes disponibles (obtenidos desde Memberstack Plans)
2. Elige un plan → se inicia **Stripe Checkout Session**
3. Tras pago exitoso → webhook de Stripe actualiza estado a `pending_approval`
4. Redirect a `/payment-success` → luego a `/completar-perfil`

### Paso 3: Completar Perfil (`/completar-perfil`)

1. Usuario revisa sus datos
2. Acepta términos y condiciones (documentos desde **Sanity CMS**)
3. Estado actualizado a `waiting_approval` en Memberstack

### Paso 4: Registro de Mascotas (`/registrar-mascotas`)

1. Usuario registra hasta **3 mascotas**
2. Por cada mascota: nombre, tipo, raza, edad, sexo, color, foto
3. Si la mascota tiene 10+ años → "senior" → requiere certificado veterinario
4. Se calcula el **período de carencia**: 120 días (perros) / 180 días (gatos)
5. Datos guardados en tabla `pets` de Supabase + foto en bucket `pet-photos` (público)

### Revisión Admin

1. Admin accede a `/admin/dashboard`
2. Ve la lista de miembros en estado `waiting_approval`
3. Puede aprobar, rechazar (con motivo), o solicitar documentos adicionales
4. Al aprobar → Memberstack se actualiza a `approved` + email de bienvenida vía **Resend**

---

## 6. Integraciones Externas Detalladas

### 6.1 Memberstack (Autenticación)

**Qué hace:** Sistema de autenticación y gestión de membresías para usuarios finales.

**Cómo se integra:**
- Script cargado en `layout.tsx` → `beforeInteractive`
- Variables de entorno: `NEXT_PUBLIC_MEMBERSTACK_APP_ID`, `MEMBERSTACK_ADMIN_SECRET_KEY`
- Dos modos de uso:
  1. **SDK Cliente** (`@memberstack/nextjs`): Para leer/escribir desde el browser
  2. **Admin REST API**: Para operaciones server-side (crear miembros, actualizar campos)

**Custom Fields clave en Memberstack:**

| Campo | Propósito |
|-------|-----------|
| `approval-status` | Estado del ciclo de vida del miembro |
| `waiting-period-end` | Fin del período de carencia del usuario |
| `ine-front-url`, `ine-back-url` | URLs de documentos en Supabase Storage |
| `proof-of-address-url` | URL comprobante de domicilio |
| `pet-1-name` ... `pet-3-name` | Datos de mascotas (19 campos × 3 = 57 campos) |
| `pet-1-waiting-period-end` | Fin de carencia por mascota |

**Archivo clave:** `src/services/memberstack-admin.service.ts`

**Flujo de sincronización:**
```
Memberstack (Auth + campos básicos)
      ↕ sync manual requerido
Supabase (datos extendidos + storage)
```

> ⚠️ **Gotcha:** Los datos del usuario existen en dos lugares. Si hay discrepancias,
> Supabase es la fuente de verdad para datos extendidos; Memberstack para el estado de auth.

---

### 6.2 Supabase (Base de Datos y Storage)

**Qué hace:** Base de datos PostgreSQL + almacenamiento de archivos + notificaciones en tiempo real.

**Dos clientes en `src/lib/supabase.ts`:**

```typescript
// Cliente PÚBLICO (anon key) — para el browser
export const supabase = createClient(url, anonKey);

// Cliente ADMIN (service role key) — SOLO en el servidor
// Bypasa RLS, acceso total a la BD
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

**Buckets de Storage:**

| Bucket | Contenido | Privacidad |
|--------|-----------|------------|
| `ine-documents` | INE frente y reverso | **Privado** |
| `proof-of-address` | Comprobantes de domicilio | **Privado** |
| `pet-photos` | Fotos de mascotas | **Público** |
| `vet-certificates` | Certificados veterinarios | **Privado** |
| `ambassador-documents` | Documentos de embajadores | **Privado** |
| `ambassador-photos` | Fotos de embajadores | **Público** |
| `ambassador-materials` | Materiales de marketing | **Privado** |
| `wellness-logos` | Logos de centros de bienestar | **Público** |

**Notificaciones en tiempo real:**
- Se usa `supabase.channel()` para escuchar cambios en `notifications`
- Los widgets de Webflow se suscriben via anon key

---

### 6.3 Vercel (Hosting y Serverless)

**Qué hace:** Plataforma de deploy con serverless functions, edge network y cron jobs.

**Configuración `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/missing-info-followup",
      "schedule": "0 16 * * *"
    }
  ]
}
```

**Dominios permitidos (CORS en `middleware.ts`):**
```
https://www.pataamiga.mx
https://pataamiga.mx
https://app.pataamiga.mx
http://localhost:3000
*.vercel.app (staging previews)
*.webflow.io
```

---

### 6.4 Webflow (Dashboard del Usuario)

**Qué hace:** Aloja el sitio público de marketing y el dashboard del usuario final.

**Arquitectura de integración:**
```
Webflow Page
    └── <div id="widget-container">
    
<script src="https://[vercel-url]/widgets/unified-membership-widget.js">
    └── El widget inyecta su UI en el DOM
    └── Llama a /api/* endpoints del Next.js para obtener datos
    └── Usa window.$memberstackDom para la sesión del usuario
```

**Configuración global requerida en Webflow:**
```javascript
window.PATA_AMIGA_CONFIG = {
  apiBaseUrl: 'https://app.pataamiga.mx'
};
```

**Widgets principales disponibles:**

| Widget | Archivo | Tamaño | Función |
|--------|---------|--------|---------|
| Unified Membership | `unified-membership-widget.js` | 303KB | Widget todo-en-uno |
| Home Widget | `home-widget.js` | 82KB | Dashboard principal |
| Pet Cards | `pet-cards-widget.js` | 129KB | Detalle de mascotas |
| User Profile | `user-profile-widget.js` | 68KB | Perfil editable |
| Ambassador | `ambassador-widget.js` | 150KB | Dashboard embajador |
| Solidarity Dashboard | `solidarity-dashboard.js` | 53KB | Fondo solidario |
| Wellness Center | `wellness-center-widget.js` | 101KB | Directorio centros |
| Notification Bell | `notification-bell.js` | 34KB | Notificaciones |
| Complete Profile | `complete-profile-widget.js` | 72KB | Flow post-pago |
| Emergency Button | `emergency-button-widget.js` | 18KB | Emergencias |
| Appeal Widget | `appeal-widget.js` | 15KB | Apelaciones |
| Vet Bot Bridge | `vet-bot-auth-bridge.js` | 15KB | Auth para bot vet |

**Regla de seguridad CRÍTICA:**
> Los widgets **NUNCA** instancian clientes de Supabase directamente. Todo pasa por
> `fetch()` hacia `/api/*`. Las API keys nunca se exponen al cliente.

---

### 6.5 Stripe (Pagos)

**Qué hace:** Procesa suscripciones de membresías.

**Flujo de pago:**
```
Usuario selecciona plan
    → POST /api/stripe/create-session
    → Redirect a Stripe Hosted Checkout
    → Webhook: POST /api/stripe/webhook
        → Actualiza estado en Memberstack
        → Guarda billing_details en Supabase
        → Sincroniza con CRM LynSales
    → Redirect a /payment-success
```

**Variables:**
```
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 6.6 Sanity CMS

**Qué hace:** Gestiona documentos legales (términos, contratos, aviso de privacidad).

**Cómo se integra:**
- Admin crea documentos en Sanity Studio
- App consulta vía `src/lib/sanity.ts`
- Endpoint `GET /api/legal-documents` → devuelve documentos activos
- Usuarios aceptan documentos actuales al completar su perfil

**Variables:**
```
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...
```

---

### 6.7 Resend (Emails Transaccionales)

**Qué hace:** Envía emails automáticos en momentos clave del flujo.

**Emails implementados:**

| Trigger | Email |
|---------|-------|
| Registro completo | Bienvenida + instrucciones |
| Aprobación admin | "Tu membresía está activa" |
| Rechazo admin | Motivo del rechazo + opción de apelación |
| Docs faltantes (cron diario) | Recordatorio de completar perfil |
| Aprobación embajador | Código de referido + materiales |
| Rechazo embajador | Motivo del rechazo |

**Variable:** `RESEND_API_KEY=re_...`

---

### 6.8 LynSales / LeadConnector CRM

**Qué hace:** CRM externo para gestión comercial de contactos.

**API Base:** `https://services.leadconnectorhq.com`

**Operaciones:**
- `POST /contacts/upsert` — crear o actualizar contacto
- `PUT /contacts/:id` — actualizar campos y tags

**Cuándo se sincroniza:**
- Al registrarse (nuevo contacto)
- Al pagar (tags + campos de membresía)
- Al cancelar (actualiza status)

**Campos sincronizados al CRM:**

| Campo | Valor |
|-------|-------|
| `Metodo pago` | card, oxxo, etc. |
| `Fecha de pago` | timestamp |
| `Tipo membresia` | nombre del plan |
| `Estatus membresia` | activo / cancelado / pendiente_pago |
| `Fecha renovacion` | próxima fecha de cobro |
| Tag | `miembro activo` (cuando está approved) |

**Archivo clave:** `src/services/crm.service.ts`

**Variables:**
```
LYNSALES_API_URL=https://services.leadconnectorhq.com
LYNSALES_API_KEY=...
LYNSALES_LOCATION_ID=...
```

---

### 6.9 Sepomex API (Códigos Postales MX)

**Qué hace:** Valida CPs mexicanos y devuelve estado, ciudad y colonias.

**Endpoint:** `GET /api/sepomex?cp={codigo_postal}` → proxy hacia la API de SEPOMEX

Auto-completa los campos de dirección en el formulario de registro.

**Archivo clave:** `src/services/postalCode.service.ts`

---

### 6.10 Google APIs

**Google Places API** (cargado en `layout.tsx`):
- Auto-completado de direcciones
- Usado principalmente en registro de centros de bienestar

**Google Tag Manager (GTM-N3WV4GPT):**
- Tracking de eventos en el flujo de registro
- `src/components/Analytics/GoogleTagManager.tsx`

**Meta Pixel:**
- Tracking de conversiones
- `src/components/Analytics/MetaPixel.tsx`

---

## 7. Base de Datos — Schema Completo

### Tabla `users` — Contratante/Miembro:
```sql
users (
  id UUID PRIMARY KEY,
  memberstack_id VARCHAR(255) UNIQUE,  -- Link con Memberstack
  first_name, last_name, mother_last_name,
  gender, birth_date DATE, curp VARCHAR(18),
  email VARCHAR(255) UNIQUE NOT NULL, phone,
  postal_code, state, city, colony, address,
  nationality, nationality_code VARCHAR(3),
  membership_status VARCHAR(50) DEFAULT 'pending',
  waiting_period_end_date DATE,         -- 90 días desde registro
  solidarity_fund_available BOOLEAN,
  ambassador_code VARCHAR(50),          -- Código del embajador que lo refirió
  role VARCHAR(50),                     -- 'member' | 'admin' | 'super_admin'
  registration_step INTEGER,            -- Progreso del flujo
  pre_payment_completed BOOLEAN,
  post_payment_completed BOOLEAN,
  sepomex_validated BOOLEAN,
  utm_source, utm_medium, utm_campaign, -- Tracking UTM
  created_at, updated_at
)
```

### Tabla `pets` — Mascotas:
```sql
pets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  memberstack_id VARCHAR(255),
  name, type VARCHAR(20),               -- 'dog' | 'cat'
  breed, age INTEGER, age_unit,         -- 'years' | 'months'
  gender, birthday DATE,
  coat_color, nose_color, eye_color,
  primary_photo_url TEXT,
  photos_uploaded BOOLEAN, photos_count,
  is_senior BOOLEAN,                    -- 10+ años → requiere cert vet
  vet_certificate_url TEXT,
  waiting_period_end_date DATE,         -- 120 días perros / 180 días gatos
  is_active BOOLEAN DEFAULT true,
  is_adopted BOOLEAN,
  microchip_number,
  gallery_photos TEXT[],
  created_at, updated_at
)
```

### Tabla `ambassadors` — Embajadores:
```sql
ambassadors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  memberstack_id VARCHAR(255),
  first_name, last_name, email, phone,
  state, city,
  referral_code VARCHAR(50) UNIQUE,
  custom_code VARCHAR(50),
  code_change_count INTEGER DEFAULT 0,  -- Solo se puede cambiar 1 vez
  status VARCHAR(50),                   -- 'pending' | 'approved' | 'rejected' | 'cancelled'
  ine_front_url, ine_back_url TEXT,
  profile_photo_url TEXT,
  rejection_reason TEXT,
  referred_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2),
  created_at, updated_at
)
```

### Tabla `documents` — Documentos subidos:
```sql
documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  document_type VARCHAR(50),  -- 'ine_front' | 'ine_back' | 'proof_of_address'
  file_name, file_path TEXT,
  file_size INTEGER, mime_type VARCHAR(100),
  uploaded_at TIMESTAMP
)
```

### Tabla `billing_details` — Facturación:
```sql
billing_details (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  memberstack_id VARCHAR(255),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT, plan_name TEXT,
  amount DECIMAL(10,2), currency VARCHAR(3),
  status VARCHAR(50),
  current_period_start, current_period_end TIMESTAMP,
  created_at, updated_at
)
```

### Tabla `notifications` — Notificaciones (Realtime):
```sql
notifications (
  id UUID PRIMARY KEY,
  user_memberstack_id VARCHAR(255),
  type VARCHAR(100),
  title TEXT, message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
-- Habilitada para Supabase Realtime
```

### Tabla `solidarity_requests` — Fondo Solidario:
```sql
solidarity_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  pet_id UUID REFERENCES pets(id),
  type VARCHAR(50),
  amount_requested DECIMAL(10,2),
  amount_approved DECIMAL(10,2),
  status VARCHAR(50),                 -- 'pending' | 'approved' | 'rejected'
  description TEXT,
  bank_details JSONB,
  admin_notes TEXT,
  created_at, updated_at
)
```

### Tabla `wellness_centers` — Centros de Bienestar:
```sql
wellness_centers (
  id UUID PRIMARY KEY,
  name TEXT,
  type VARCHAR(100),
  address TEXT, state, city,
  phone, email,
  logo_url TEXT,
  website TEXT,
  status VARCHAR(50),
  services TEXT[],
  created_at
)
```

### Otras tablas importantes:
- `emergency_logs` — Registro de emergencias reportadas
- `member_deletions` — Registro de cancelaciones de membresía
- `vet_bot_sessions` — Sesiones del bot veterinario
- `vet_bot_verification_codes` — Códigos de verificación del bot
- `legal_documents` — Metadatos de documentos legales
- `consultations` — Consultas del bot veterinario
- `wellness_center_locations` — Ubicaciones múltiples por centro
- `catalog_nationalities` — Catálogo de nacionalidades ISO

### Migraciones relevantes:

| Migración | Descripción |
|-----------|-------------|
| `supabase-setup.sql` | Schema inicial: users, documents |
| `001_reestructuracion_flujo.sql` | Reestructuración del flujo (Feb 2026) |
| `20260113_create_ambassador_tables.sql` | Sistema de embajadores |
| `20260507_solidarity_fund.sql` | Fondo solidario |
| `20260515_create_wellness_center_tables.sql` | Centros de bienestar |
| `20260611_create_emergency_logs.sql` | Logs de emergencias |
| `20260709_create_ambassador_materials.sql` | Materiales de embajadores |

---

## 8. API Routes — Mapa Completo

### Admin (`/api/admin/*`)

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/admin/members` | GET | Listar todos los miembros |
| `/api/admin/members/[id]` | GET, PATCH | Ver/editar miembro |
| `/api/admin/members/[id]/approve` | POST | Aprobar miembro |
| `/api/admin/members/[id]/reject` | POST | Rechazar (requiere motivo) |
| `/api/admin/members/[id]/refund` | POST | Reembolsar a un miembro |
| `/api/admin/pets/[petId]` | GET, PATCH | Ver/editar mascota |
| `/api/admin/pets/[petId]/bypass-carencia` | POST | Omitir período de carencia |
| `/api/admin/metrics` | GET | Métricas del dashboard |
| `/api/admin/notifications` | GET | Notificaciones del admin |
| `/api/admin/ambassadors` | GET | Listar embajadores |
| `/api/admin/ambassadors/[id]` | PATCH | Aprobar/rechazar embajador |
| `/api/admin/solidarity` | GET | Solicitudes del fondo solidario |
| `/api/admin/wellness` | GET | Centros de bienestar |
| `/api/admin/wellness-leads` | GET | Leads de wellness |
| `/api/admin/finance` | GET | Reportes financieros |
| `/api/admin/cancellations` | GET | Cancelaciones |
| `/api/admin/reports` | GET | Reportes varios |
| `/api/admin/settings` | GET, POST | Configuración del sistema |
| `/api/admin/register` | POST | Registrar nuevo admin |
| `/api/admin/me` | GET | Info del admin autenticado |
| `/api/admin/activity` | GET | Feed de actividad |
| `/api/admin/newsletter` | POST | Enviar newsletter |

### Usuario (`/api/user/*`)

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/user/profile` | GET, PATCH | Perfil del usuario |
| `/api/user/update-profile` | POST | Actualizar datos |
| `/api/user/pets` | GET, POST | Listar/crear mascotas |
| `/api/user/add-pet` | POST | Agregar mascota |
| `/api/user/update-pet-docs` | POST | Actualizar docs de mascota |
| `/api/user/upload-pet-photo` | POST | Subir foto de mascota |
| `/api/user/appeal` | POST | Crear apelación de rechazo |
| `/api/user/appeal-history` | GET | Historial de apelaciones |
| `/api/user/sync-memberstack` | POST | Sincronizar datos |
| `/api/user/payment-method` | GET, POST | Método de pago |
| `/api/user/preferences` | GET, POST | Preferencias del usuario |
| `/api/user/reactivate` | POST | Reactivar membresía |
| `/api/user/deactivate` | POST | Cancelar membresía |
| `/api/user/emergency` | POST | Reportar emergencia |
| `/api/user/cancellation-end-date` | GET | Fecha de fin de cancelación |

### Autenticación (`/api/auth/*`)

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/auth/session-token` | POST | Generar token de sesión |
| `/api/auth/validate-token` | GET | Validar token |

### Webhooks y Pagos

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/stripe/webhook` | POST | Webhook de Stripe |
| `/api/payouts` | POST | Pagos a embajadores |
| `/api/referrals` | GET, POST | Sistema de referidos |

### Utilitarios

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/sepomex` | GET | Búsqueda por código postal |
| `/api/breeds` | GET | Catálogo de razas |
| `/api/upload` | POST | Upload genérico de archivos |
| `/api/notifications` | GET, POST | Notificaciones |
| `/api/legal-documents` | GET | Documentos legales (Sanity) |
| `/api/legal` | GET | Versión pública de términos |

### Cron Jobs

| Endpoint | Schedule | Función |
|----------|----------|---------|
| `/api/cron/missing-info-followup` | 16:00 UTC diario | Email a usuarios con docs faltantes |

### Integraciones

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/integrations/vet-bot` | GET | Contexto del usuario para el bot vet |
| `/api/crm/sync` | POST | Sincronizar con CRM |
| `/api/memberstack/[...path]` | * | Proxy hacia Memberstack Admin API |
| `/api/solidarity` | GET, POST | Fondo solidario (usuario) |
| `/api/wellness` | GET, POST | Centros de bienestar |
| `/api/ambassador-materials` | GET | Materiales de embajadores |

---

## 9. Sistema de Widgets (Webflow)

### Arquitectura de los Widgets

Los widgets son archivos JavaScript que se cargan como scripts en Webflow. Cada widget:

1. **Se auto-inicializa** al cargar: busca un `div` contenedor con un ID específico
2. **Autenticación**: usa `window.$memberstackDom.getCurrentMember()` para la sesión
3. **Datos**: `fetch()` hacia los `/api/*` del Next.js
4. **UI**: Genera HTML dinámicamente e inyecta estilos

**Patrón estándar:**
```javascript
// Configuración global requerida en Webflow
window.PATA_AMIGA_CONFIG = { apiBaseUrl: 'https://app.pataamiga.mx' };

(async function() {
  const container = document.getElementById('mi-widget-container');
  if (!container) return;

  // 1. Obtener sesión de Memberstack
  const memberstack = window.$memberstackDom;
  const { data: { member } } = await memberstack.getCurrentMember();
  if (!member) return; // No autenticado

  // 2. Obtener datos del backend
  const response = await fetch(
    `${window.PATA_AMIGA_CONFIG.apiBaseUrl}/api/user/profile`,
    { headers: { 'x-memberstack-id': member.id } }
  );
  const data = await response.json();

  // 3. Renderizar
  container.innerHTML = generateHTML(data);
})();
```

### Widgets Críticos

**`unified-membership-widget.js`** (303KB):
- El widget más complejo. Integra: perfil, mascotas, notificaciones, configuración
- Widget principal del dashboard de usuario en Webflow

**`solidarity-dashboard.js`** + **`solidarity-request-form.js`**:
- Sistema completo del Fondo Solidario
- Ver solicitudes, crear nuevas, ver historial

**`wellness-center-widget.js`** (101KB):
- Directorio de centros con mapa
- Búsqueda por estado/ciudad/tipo de servicio

**`ambassador-widget.js`** (150KB):
- Dashboard completo del embajador
- Referidos, comisiones, código personalizable, materiales

**`vet-bot-auth-bridge.js`**:
- Autenticación segura para el bot veterinario externo
- Genera tokens de sesión verificados

---

## 10. Modelo de Seguridad

### Separación de capas:

```
Browser (Webflow/Next.js)
    ├── Solo anon key de Supabase (pública, limitada)
    ├── Solo Memberstack SDK (auth del usuario)
    └── fetch() → /api/* (autenticada con sesión Memberstack)

Servidor (Next.js API Routes en Vercel)
    ├── supabaseAdmin (service role key — NUNCA al browser)
    ├── MEMBERSTACK_ADMIN_SECRET_KEY (NUNCA al browser)
    ├── STRIPE_SECRET_KEY (NUNCA al browser)
    └── RESEND_API_KEY (NUNCA al browser)
```

### CORS (`src/middleware.ts`):
- Solo orígenes de `pataamiga.mx`, `app.pataamiga.mx`, y dominios de staging

### Autenticación de Admin:
- Admins tienen cuenta de miembro en Memberstack con `role: admin` en Supabase
- Cada request a `/api/admin/*` valida el header `x-admin-memberstack-id`
- `getAdminUser()` en `src/lib/admin-auth.ts` verifica el rol en Supabase
- `unauthorizedResponse()` es el "God Node" más conectado del sistema (77+ referencias)

---

## 11. Sistema de Autenticación Admin

### Cómo funciona:

1. Admin va a `/admin/login`
2. Se autentica con email/contraseña en Memberstack
3. Memberstack retorna el `memberstackId`
4. Se guarda en localStorage como `x-admin-memberstack-id`
5. Cada request a `/api/admin/*` incluye ese header
6. `getAdminUser()` verifica contra tabla `users` de Supabase (role: admin | super_admin)

### Roles:
- `admin`: Acceso completo al dashboard
- `super_admin`: Acceso adicional a configuraciones y registro de nuevos admins

---

## 12. Cron Jobs y Automatizaciones

### Cron configurado en Vercel:

**`/api/cron/missing-info-followup`** (16:00 UTC = 10:00 am CDMX):
- Busca usuarios con `waiting_approval` que llevan +3 días sin completar documentos
- Envía email de recordatorio vía Resend
- Máximo 1 email por usuario cada 48 horas

### Webhooks (eventos entrantes):

**Stripe Webhook (`/api/stripe/webhook`)**:
- `checkout.session.completed` → marca pago exitoso
- `customer.subscription.deleted` → cancela membresía
- `invoice.payment_failed` → notifica al usuario

---

## 13. Servicios de Negocio

### `pet.service.ts` — Lógica de mascotas:
- Calcula período de espera: **120 días perros**, **180 días gatos**
- Detección de mascotas senior (10+ años) → requiere certificado veterinario
- `updateMemberStatusFromPets()` — actualiza estado del miembro según sus mascotas

### `memberstack-admin.service.ts`:
- `getMemberDetails(id)` — datos completos de un miembro
- `updateMemberCustomField(id, field, value)` — actualiza campo personalizado
- `listPendingMembers()` — miembros en `waiting_approval`
- `createMember(data)` — crea nueva cuenta

### `comm.service.ts` — Comunicaciones:
- `notifyAmbassadorApproval(id)` — email al embajador aprobado
- `notifyAmbassadorRejection(id)` — email al embajador rechazado
- Notificaciones en tiempo real vía Supabase

### `crm.service.ts` — Integración CRM:
- `syncContactToCRM(contactData)` — upsert en LynSales
- `updateCRMContactStatus(id, status)` — actualizar campos custom
- `addCRMTag(id, tag)` — agregar tags

---

## 14. Sistema de Embajadores

### Flujo completo:

```
1. Embajador llena formulario en /embajadores/registro
   → Se crea registro en ambassadors (status: 'pending')
   → Admin recibe notificación

2. Admin revisa en /admin/dashboard
   → PATCH /api/admin/ambassadors/[id]
   → Puede aprobar o rechazar con motivo

3. Si aprobado:
   → Embajador selecciona su código único
   → Email de bienvenida 
   → Embajador aparece en widget de Webflow

4. Referidos:
   → Nuevo usuario usa el código al registrarse
   → Se registra en tabla referrals
   → Embajador ve conteo en su dashboard

5. Comisiones:
   → Admin gestiona pagos vía /api/admin/payouts
```

### Código personalizado:
- Un embajador puede cambiar su código **solo 1 vez**
- Controlado por tabla `ambassador_code_change_once`

---

## 15. Sistema de Fondo Solidario

### Reglas de negocio:
- Elegibilidad del usuario: `waiting_period_end_date <= CURRENT_DATE` (90 días)
- La mascota: debe tener su período de espera cumplido (120/180 días)
- Una vez cumplidos → `solidarity_fund_available = true`

### Flujo de solicitud:
1. Usuario llena formulario vía widget Webflow
2. Adjunta evidencias → Supabase Storage
3. Admin revisa en `/api/admin/solidarity`
4. Aprueba con monto → actualiza `amount_approved` y `status: approved`

---

## 16. Sistema de Centros de Bienestar

### Qué es:
Red de veterinarias y centros de salud que ofrecen beneficios a miembros de Club Pata Amiga.

### Flujo:
1. Centro llena formulario en Webflow (`wellness-center-registration-widget.js`)
2. Datos llegan a `/api/wellness` → guardado en Supabase
3. Admin aprueba en el panel

### Tablas: `wellness_centers`, `wellness_center_locations`, `wellness_leads`

---

## 17. Variables de Entorno

```bash
# Memberstack
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_...
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjvhntxjkuuobgfslzlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # ⚠️ SOLO SERVIDOR

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...                  # ⚠️ SOLO SERVIDOR
STRIPE_WEBHOOK_SECRET=whsec_...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Resend (Email)
RESEND_API_KEY=re_...

# CRM LynSales
LYNSALES_API_URL=https://services.leadconnectorhq.com
LYNSALES_API_KEY=...
LYNSALES_LOCATION_ID=...

# App Config
NODE_ENV=development | production
NEXT_PUBLIC_APP_URL=https://app.pataamiga.mx
```

---

## 18. Comandos de Desarrollo

```bash
# Instalar
npm install

# Configurar entorno
cp .env.example .env.local
# → Editar .env.local con las credenciales reales

# Desarrollo
npm run dev         # http://localhost:3000

# Verificación
npm run build       # Build de producción
npm run type-check  # tsc --noEmit
npm run lint        # eslint .
```

**Requerimientos:** Node.js >= 18.17.0, npm >= 9.0.0

---

## 19. Recomendación de Migración: Next.js + Supabase Auth

### Contexto Actual

El sistema actual utiliza **Memberstack** como proveedor de autenticación. Si bien funcionó bien en etapas tempranas (Memberstack es rápido de configurar para MVPs), la arquitectura actual presenta **fricciones técnicas y costos crecientes** que justifican una migración a mediano plazo.

---

### Problemas con la Arquitectura Actual

#### 1. Datos duplicados y fricción de sincronización

```
Memberstack (Auth + Custom Fields)
        ↕  sincronización manual requerida
Supabase (BD principal)
```

El usuario existe en **dos sistemas distintos** sin sincronización automática robusta. Cada cambio de datos requiere actualizar ambos sistemas — fuente constante de bugs y datos inconsistentes.

#### 2. Limitación de Custom Fields

Los 57 campos de mascotas (19 × 3) están almacenados como Custom Fields planos en Memberstack. No escala a más mascotas y no permite queries relacionales.

#### 3. Costo Escala con los Usuarios

Memberstack cobra por miembros activos. A medida que Club Pata Amiga crece, el costo escala linealmente. **Supabase Auth es gratuito hasta 50,000 usuarios activos mensuales.**

#### 4. Widgets de Webflow son Pesados y Difíciles de Mantener

Los 45+ widgets en Webflow (algunos de 300KB) son difíciles de debuggear, dependen de `window.$memberstackDom`, y crean una arquitectura frágil. El widget `unified-membership-widget.js` pesa 303KB solo por la lógica de UI.

#### 5. Dashboard del Usuario Fuera de Next.js

El dashboard del usuario está en Webflow con scripts inyectados en lugar de en Next.js, lo que dificulta el mantenimiento y la experiencia de desarrollo.

---

### Nueva Arquitectura Propuesta

```
┌──────────────────────────────────────────────────────────────────┐
│                WEBFLOW (solo marketing público)                   │
│   Landing page, blog, precios → no requiere auth                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │ redirect a la app
┌─────────────────────────▼────────────────────────────────────────┐
│              NEXT.JS APP (app.pataamiga.mx)                       │
│                                                                   │
│  /registro         → Flujo de registro                           │
│  /dashboard/*      → Dashboard del usuario (NUEVO — SSR nativo)  │
│  /admin/dashboard  → Panel admin (ya existe)                     │
│  /api/*            → API Routes (ya existe)                      │
└─────────────────────────┬────────────────────────────────────────┘
                          │ auth nativo
┌─────────────────────────▼────────────────────────────────────────┐
│              SUPABASE AUTH + DATABASE                             │
│                                                                   │
│  Auth: JWT tokens, sesiones, magic links, OAuth                  │
│  Database: Una sola fuente de verdad (sin duplicación)           │
│  Storage: Ya configurado y funcionando                           │
│  RLS: Policies activadas con auth nativa de Supabase             │
│  Realtime: Ya disponible (notificaciones)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

### Plan de Migración por Fases

**Fase 1 — Supabase Auth Setup** (1-2 semanas):
- Habilitar Supabase Auth en el proyecto existente
- Implementar `createServerClient()` de `@supabase/ssr` en Next.js
- Migrar el middleware de autenticación
- Añadir campo `supabase_auth_id` a la tabla `users`

**Fase 2 — Migración del Flujo de Registro** (2-3 semanas):
- Reemplazar la llamada a Memberstack en el registro por `supabase.auth.signUp()`
- Los custom fields de mascotas pasan a ser filas en la tabla `pets` (ya existe)
- Eliminar la duplicación de datos

**Fase 3 — Dashboard del Usuario en Next.js** (3-4 semanas):
- Crear páginas `/dashboard/*` en Next.js con Server Components
- Migrar la lógica de los widgets JS de Webflow a componentes React nativos
- Resultado: UI más rápida, SSR nativo, bundle mucho más pequeño

**Fase 4 — Migración de Usuarios Existentes** (1 semana):
- Script de migración: por cada usuario en Memberstack → crear cuenta en Supabase Auth
- Enviar email de "activa tu nueva cuenta" con magic link de Supabase
- Ventana de migración: 30 días con ambos sistemas activos en paralelo

**Fase 5 — Eliminación de Memberstack** (1 semana):
- Remover script de Memberstack del `layout.tsx`
- Eliminar `@memberstack/nextjs` del `package.json`
- Actualizar widgets de Webflow de marketing (mínimos) para no usar `$memberstackDom`

---

### Comparativa de Costos

| Servicio | Costo Actual | Costo Propuesto |
|---------|-------------|-----------------|
| **Memberstack** | $49–$299/mes (según plan + usuarios) | **$0** (eliminado) |
| **Supabase Auth** | $0 (ya incluido en el plan) | $0 |
| **Supabase BD** | Ya se usa y paga | Sin cambio |
| **Webflow** | Ya se paga | Potencialmente reducido |

**Ahorro estimado: $600–$3,600/año** solo en Memberstack, además de reducir la complejidad operacional.

---

### Beneficios Técnicos

| Aspecto | Situación Actual | Con Migración |
|---------|-----------------|---------------|
| **Fuente de verdad** | Duplicada (Memberstack + Supabase) | **Una sola: Supabase** |
| **Autenticación** | Memberstack (proveedor externo) | **Supabase Auth nativo** |
| **Dashboard usuario** | Widget JS de 300KB en Webflow | **Next.js Server Components** |
| **Row Level Security** | Desactivada (auth externa) | **Activada con auth nativa** |
| **Tipo de sesión** | Cookie propietaria de Memberstack | **JWT estándar de Supabase** |
| **Escalabilidad auth** | Costo crece con usuarios | **Gratis hasta 50K MAU** |
| **Mantenimiento** | 45+ archivos JS separados | **Componentes React unificados** |
| **Debugging** | Difícil (scripts externos en Webflow) | **DevTools de Next.js + React** |
| **Bundle size** | 300KB por widget | **Tree-shaking nativo de Next.js** |

---

### Consideraciones de la Migración

> **⚠️ Riesgo principal:** La migración de usuarios existentes requiere coordinación.
> Los usuarios deberán activar su nueva cuenta. Hacerlo en horario de baja actividad.

> **ℹ️ Compatibilidad:** Los datos en Supabase (tablas `users`, `pets`, `ambassadors`, etc.)
> no necesitan cambiar. Solo cambia la capa de autenticación.

> **✅ Reversibilidad:** La migración puede hacerse de forma gradual.
> Ambos sistemas pueden coexistir durante el período de transición (30-60 días).

---

### Conclusión

La migración a **Next.js + Supabase Auth** es la evolución natural de este proyecto.

La arquitectura actual fue la correcta para el MVP: Memberstack permitió lanzar rápido sin construir un sistema de auth desde cero. **Ahora que el proyecto tiene usuarios reales, múltiples módulos (fondo solidario, embajadores, bienestar, bot veterinario) y está creciendo, es el momento ideal para invertir en la consolidación técnica.**

Al unificar autenticación, base de datos y storage en Supabase:
- Se elimina la fricción de sincronización
- Se reducen los costos operativos
- Se simplifica dramáticamente el stack de widgets
- Se activa Row Level Security correctamente
- Se abre la puerta a features más complejas con seguridad por diseño

Esta inversión técnica pagará dividendos a largo plazo en velocidad de desarrollo, estabilidad y costos.

---

*Documentación técnica — Club Pata Amiga | Julio 2026*
