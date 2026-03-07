# Guía de Implementación a Producción

> **Proyecto:** Pet Membership Form - Nuevo Flujo de Registro  
> **Versión:** 2.0  
> **Fecha:** 26 Febrero 2026  
> **Estado:** Listo para producción

---

## 📋 Tabla de Contenidos

1. [Resumen del Cambio](#1-resumen-del-cambio)
2. [Arquitectura del Nuevo Flujo](#2-arquitectura-del-nuevo-flujo)
3. [Archivos del Sistema](#3-archivos-del-sistema)
4. [Migraciones de Base de Datos](#4-migraciones-de-base-de-datos)
5. [Configuración de Variables de Entorno](#5-configuración-de-variables-de-entorno)
6. [Configuración de Memberstack](#6-configuración-de-memberstack)
7. [Configuración de SEPOMEX](#7-configuración-de-sepomex-códigos-postales)
8. [Configuración de Stripe](#8-configuración-de-stripe)
9. [Pasos de Implementación](#9-pasos-de-implementación)
10. [Checklist Pre-Deploy](#10-checklist-pre-deploy)
11. [Rollback Plan](#11-rollback-plan)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Resumen del Cambio

### Objetivo
Reducir la tasa de abandono del 15% a menos del 5% optimizando el flujo de registro de ~12 clicks a solo 4-5 clicks antes del pago.

### Comparativa: Antes vs Después

| Aspecto | Flujo Anterior | Nuevo Flujo |
|---------|---------------|-------------|
| **Pasos pre-pago** | 3 (Usuario, Mascota, Plan) | 3 (Cuenta, Mascota básica, Plan) |
| **Campos pre-pago** | ~30 campos | 5 campos |
| **Clicks hasta pago** | ~12 | 4-5 |
| **Tiempo estimado** | 8 minutos | < 3 minutos |
| **Fotos mascota** | Obligatorias | Opcionales (15 días) |
| **Límite de edad** | 9 años | Sin límite (certificado si 10+) |
| **Documentos INE** | Pre-pago | Eliminado |
| **Validación CURP** | Pre-pago | Post-pago |

### Flujo de Estados

```
Paso 1: Cuenta (email, password)
    ↓
Paso 2: Mascota básica (tipo, nombre, edad)
    ↓
Paso 3: Plan + Términos + Pago (Stripe)
    ↓ [POST-PAGO]
Paso 4: Perfil completo (CURP, dirección, nacionalidad...)
    ↓
Paso 5: Mascota completa (raza, colores, fotos opcionales)
    ↓
✅ Registro completo → Esperando aprobación
```

---

## 2. Arquitectura del Nuevo Flujo

### Componentes Principales

```
src/components/RegistrationV2/
├── NewRegistrationFlow.tsx              # Orquestador producción
├── NewRegistrationFlow.demo.tsx         # Versión demo/test
├── PetTypeSelector.tsx                  # Selector perro/gato
├── AgeInput.tsx                         # Input edad años/meses
├── NationalitySelect.tsx               # Selector nacionalidad
├── BenefitsBanner.tsx                   # Franja beneficios sticky
├── StepIndicator.tsx                    # Indicador de pasos
├── TermsModalEnhanced.tsx              # Modal términos mejorado
└── steps/
    ├── Step1Account.tsx                 # Crear cuenta
    ├── Step2PetBasic.tsx                # Mascota básica
    ├── Step3PlanSelection.tsx           # Plan + pago
    ├── Step4CompleteProfile.tsx         # Perfil post-pago
    └── Step5CompletePet.tsx             # Mascota post-pago
```

### APIs Nuevas

```
src/app/api/
├── sepomex/route.ts                    # Consulta CP con cache (?cp=XXXXX)
└── catalogs/
    ├── nationalities/route.ts          # Catálogo países
    ├── coat-colors/route.ts            # Colores de pelo
    └── breeds/route.ts                 # Razas por tipo
```

### Integraciones

| Servicio | Uso | Estado Requerido |
|----------|-----|------------------|
| **Memberstack** | Auth, custom fields, checkout | ✅ Configurado |
| **Supabase** | Base de datos, storage | ✅ Configurado |
| **SEPOMEX** | Códigos postales | ✅ [Ver sección 7](#7-configuración-de-sepomex-códigos-postales) |
| **Stripe** | Pagos vía Memberstack | ✅ Configurado |
| **Resend** | Emails (opcional) | ⚪ Opcional |

---

## 3. Archivos del Sistema

### Nuevos Archivos

```
src/
├── app/
│   ├── registro-v2/
│   │   └── page.tsx                    # Entry point nuevo flujo
│   ├── api/
│   │   ├── sepomex/
│   │   │   └── route.ts              # Endpoint CP (query param)
│   │   └── catalogs/
│   │       ├── nationalities/
│   │       │   └── route.ts
│   │       ├── coat-colors/
│   │       │   └── route.ts
│   │       └── breeds/
│   │           └── route.ts
│   └── actions/
│       └── user.actions.ts             # Actualizado con nuevos campos
│
├── components/
│   └── RegistrationV2/                 # Nuevos componentes
│
├── types/
│   └── registration.types.ts           # Tipos del nuevo flujo
│
supabase/
└── migrations/
    └── 001_reestructuracion_flujo.sql  # Migración BD
```

### Archivos Modificados

```
src/components/FormFields/
├── TextInput.module.css                # Borde visible
├── PhoneInput.module.css               # Borde visible
├── DatePicker.module.css               # Borde visible
├── SelectWithInfo.module.css           # Borde visible
├── PostalCodeInput.module.css          # Borde visible
└── FileUpload.module.css               # Sin cambios
```

---

## 4. Migraciones de Base de Datos

### 4.1 Ejecutar Migración SQL

**Archivo:** `supabase/migrations/001_reestructuracion_flujo.sql`

```bash
# Opción 1: SQL Editor de Supabase
# Copiar contenido del archivo y pegar en Supabase → SQL Editor → New query

# Opción 2: psql (si tienes acceso directo)
psql -h tu-host-supabase.co -U postgres -d postgres -f supabase/migrations/001_reestructuracion_flujo.sql
```

### 4.2 Cambios en la Base de Datos

#### Tabla `users` - Nuevas Columnas

```sql
-- Nuevos campos para el contratante
ALTER TABLE users ADD COLUMN nationality VARCHAR(100);
ALTER TABLE users ADD COLUMN nationality_code VARCHAR(3);

-- Tracking de registro
ALTER TABLE users ADD COLUMN registration_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN pre_payment_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN post_payment_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN payment_completed_at TIMESTAMP;

-- SEPOMEX
ALTER TABLE users ADD COLUMN sepomex_validated BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN sepomex_last_query TIMESTAMP;
```

#### Tabla `pets` - Nuevas Columnas

```sql
-- Nuevos campos de color
ALTER TABLE pets ADD COLUMN coat_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN coat_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN nose_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN nose_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN eye_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN eye_color_code VARCHAR(50);

-- Campos modificados para edad
ALTER TABLE pets ADD COLUMN age_unit VARCHAR(10) DEFAULT 'years';
ALTER TABLE pets ADD COLUMN age_value INTEGER;

-- Sistema de fotos con deadline
ALTER TABLE pets ADD COLUMN photos_uploaded BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN photos_upload_deadline TIMESTAMP;
ALTER TABLE pets ADD COLUMN photos_count INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN primary_photo_url TEXT;

-- Mascotas senior
ALTER TABLE pets ADD COLUMN is_senior BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN vet_certificate_required BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN vet_certificate_uploaded BOOLEAN DEFAULT false;

-- Para mestizos
ALTER TABLE pets ADD COLUMN is_adopted BOOLEAN;
ALTER TABLE pets ADD COLUMN adoption_story TEXT;
ALTER TABLE pets ADD COLUMN is_mixed_breed BOOLEAN DEFAULT false;

-- Tracking
ALTER TABLE pets ADD COLUMN basic_info_completed BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN complementary_info_completed BOOLEAN DEFAULT false;
```

#### Nuevas Tablas de Catálogos

```sql
-- Catálogo de nacionalidades
CREATE TABLE catalog_nationalities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colores de pelo
CREATE TABLE catalog_coat_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_common BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- Catálogo de colores de nariz
CREATE TABLE catalog_nose_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true
);

-- Catálogo de colores de ojos
CREATE TABLE catalog_eye_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true
);

-- Cache de SEPOMEX
CREATE TABLE catalog_sepomex (
    id SERIAL PRIMARY KEY,
    cp VARCHAR(5) NOT NULL,
    colony VARCHAR(200) NOT NULL,
    municipality VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    city VARCHAR(200),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(cp, colony)
);

CREATE INDEX idx_sepomex_cp ON catalog_sepomex(cp);
```

#### Tabla de Tracking de Registro

```sql
CREATE TABLE registration_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    step_completed INTEGER DEFAULT 0,
    pre_payment_completed BOOLEAN DEFAULT false,
    payment_completed BOOLEAN DEFAULT false,
    post_payment_completed BOOLEAN DEFAULT false,
    contract_data_completed BOOLEAN DEFAULT false,
    pet_data_completed BOOLEAN DEFAULT false,
    invoice_completed BOOLEAN DEFAULT false,
    abandoned_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla de Fotos Pendientes

```sql
CREATE TABLE pending_photos_tracking (
    id SERIAL PRIMARY KEY,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deadline TIMESTAMP NOT NULL,
    reminder_7_sent BOOLEAN DEFAULT false,
    reminder_13_sent BOOLEAN DEFAULT false,
    reminder_14_sent BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### 4.3 Políticas RLS

La migración incluye políticas RLS para todas las tablas nuevas. Verificar que estén activas:

```sql
-- Verificar RLS está habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## 5. Configuración de Variables de Entorno

### 5.1 Variables Requeridas

```bash
# .env.local

# ==========================================
# SUPABASE (OBLIGATORIO)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ==========================================
# MEMBERSTACK (OBLIGATORIO)
# ==========================================
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_tu_app_id
MEMBERSTACK_ADMIN_SECRET_KEY=sk_sb_tu_secret_key

# ==========================================
# STRIPE (VIA MEMBERSTACK)
# ==========================================
# Stripe se configura directamente en Memberstack Dashboard
# Los price IDs se obtienen de Memberstack:
# - prc_mensual-452k30jah (Mensual)
# - prc_anual-o9d101ta (Anual)

# ==========================================
# SEPOMEX (OPCIONAL - TIENE FALLBACK)
# ==========================================
NEXT_PUBLIC_SEPOMEX_API_URL=https://api-sepomex.datos.gob.mx/v1/
SEPOMEX_CACHE_TTL=86400

# ==========================================
# CONFIGURACIÓN DE FOTOS (OPCIONAL)
# ==========================================
PHOTO_REMINDER_DAYS=7,13,14
PHOTO_DEADLINE_DAYS=15

# ==========================================
# EMAIL (OPCIONAL)
# ==========================================
RESEND_API_KEY=re_tu_api_key
NEXT_PUBLIC_APP_URL=https://tudominio.com

# ==========================================
# OTROS
# ==========================================
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_NATIONALITY=México
```

### 5.2 Verificación de Variables

```bash
# Crear archivo .env.local
cp .env.example .env.local

# Editar con tus credenciales
nano .env.local

# Verificar que todas las variables estén cargadas
npm run build
```

---

## 6. Configuración de Memberstack

> **IMPORTANTE:** Memberstack se usa **exclusivamente** para autenticación y pagos.
> **Supabase es el Source of Truth** de todos los datos de usuario, mascota y catálogos.
> No se deben duplicar datos en Memberstack custom fields.

### 6.1 Custom Fields Requeridos (Mínimos)

En el Dashboard de Memberstack, solo se necesitan estos campos para controlar el flujo:

```json
{
  "fields": [
    {
      "name": "registration-step",
      "type": "number",
      "label": "Paso de Registro",
      "default": 0
    },
    {
      "name": "registration-completed",
      "type": "checkbox",
      "label": "Registro Completado",
      "default": false
    },
    {
      "name": "first-name",
      "type": "text",
      "label": "Nombre (para personalización del dashboard)"
    }
  ]
}
```

> **Nota:** Campos como `nationality`, `coat-color`, `nose-color`, `eye-color`, `pet-age-unit`, `pre-payment-completed`, `post-payment-completed`, y `payment-status` se eliminaron de Memberstack. Toda esa información se gestiona directamente en Supabase.

### 6.2 Planes de Memberstack (Stripe)

Verificar que los planes estén configurados:

| Plan | Price ID Memberstack | Precio |
|------|---------------------|--------|
| Mensual | `prc_mensual-452k30jah` | $159 |
| Anual | `prc_anual-o9d101ta` | $1,699 |

### 6.3 Webhooks (Opcional)

```
POST /api/webhooks/memberstack
Eventos: user.created, user.updated, user.deleted
```

---

## 7. Configuración de SEPOMEX (Códigos Postales)

### 7.1 API Endpoint

El sistema incluye un endpoint para consultar códigos postales vía la API oficial de SEPOMEX:

```
GET /api/sepomex?cp=37545
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cp": "37545",
    "state": "Guanajuato",
    "municipality": "León",
    "city": "León",
    "colonies": ["Colonia 1", "Colonia 2", "..."]
  },
  "fromCache": false
}
```

### 7.2 Cache de SEPOMEX

El sistema implementa **dos niveles de cache** para reducir dependencia del API gubernamental:

| Nivel | Tipo | TTL | Requiere Supabase |
|-------|------|-----|-------------------|
| 1 | Memoria (Map) | 24 horas | ❌ No |
| 2 | Supabase (`catalog_sepomex`) | Permanente | ✅ Sí |

### 7.3 Variables de Entorno Opcionales

```bash
# Opcional - el endpoint funciona sin estas variables
# pero sin cache persistente en Supabase
NEXT_PUBLIC_SEPOMEX_API_URL=https://api-sepomex.datos.gob.mx/v1/
SEPOMEX_CACHE_TTL=86400  # 24 horas en segundos
```

### 7.4 Configuración de Tabla en Supabase

**Obligatorio** para cache persistente:

```sql
CREATE TABLE catalog_sepomex (
    id SERIAL PRIMARY KEY,
    cp VARCHAR(5) NOT NULL,
    colony VARCHAR(200) NOT NULL,
    municipality VARCHAR(200) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    city VARCHAR(200),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(cp, colony)
);

CREATE INDEX idx_sepomex_cp ON catalog_sepomex(cp);
```

### 7.5 Comportamiento: Desarrollo vs Producción

| Aspecto | Desarrollo Local | Producción (Vercel) |
|---------|-----------------|---------------------|
| Ruta dinámica `[cp]` | ⚠️ Puede dar 404 | ✅ Funciona perfecto |
| Query param `?cp=` | ✅ Funciona | ✅ Funciona perfecto |
| Cache en memoria | ✅ Disponible | ✅ Disponible |
| Cache en Supabase | ⚠️ Solo si configuras variables | ✅ Recomendado |
| Timeout API | 5 segundos | 5 segundos |
| Fallback si API falla | Cache o error | Cache o error |

### 7.6 Troubleshooting SEPOMEX

**Error 404 en desarrollo:**
```
GET http://localhost:3000/api/sepomex?cp=37545 404 (Not Found)
```
- **Causa:** Next.js no detectó la ruta
- **Solución:** Reiniciar servidor (`Ctrl+C` → `npm run dev`)

**Error "Código postal no encontrado":**
- El CP no existe en la base de datos de SEPOMEX
- El servicio gubernamental está caído
- **Solución:** El usuario puede ingresar dirección manualmente

**Timeout o lentitud:**
- La API de SEPOMEX puede ser lenta (>2s)
- **Solución:** Implementar loading state y cache agresivo

---

## 8. Configuración de Stripe

### 8.1 Stripe via Memberstack

La integración con Stripe se maneja completamente por Memberstack. Verificar:

1. En Memberstack Dashboard → Payments → Conectar Stripe
2. Configurar planes con precios
3. Habilitar webhook de Memberstack a Stripe

### 7.2 Webhook de Stripe (Opcional)

Si necesitas webhook directo:

```bash
# Endpoint
POST /api/webhooks/stripe

# Eventos a escuchar:
- checkout.session.completed
- invoice.payment_succeeded
- customer.subscription.created
```

---

## 9. Pasos de Implementación

### 8.1 Preparación (1-2 horas antes)

```bash
# 1. Backup de base de datos
supabase db dump > backup_pre_flujo_nuevo.sql

# 2. Crear branch de git
git checkout -b feature/nuevo-flujo-registro

# 3. Verificar build local
npm run build
npm run type-check
```

### 8.2 Deploy Paso a Paso

```bash
# Paso 1: Migraciones de BD (5 min)
# Ejecutar en Supabase SQL Editor
# Archivo: supabase/migrations/001_reestructuracion_flujo.sql

# Paso 2: Variables de entorno (5 min)
# Configurar en Vercel/Hosting:
# - Dashboard → Settings → Environment Variables
# - Agregar todas las variables del paso 5

# Paso 3: Deploy de código (10 min)
git add .
git commit -m "feat: nuevo flujo de registro optimizado"
git push origin feature/nuevo-flujo-registro

# Crear PR y mergear a main
# Vercel hará deploy automático

# Paso 4: Verificación (15 min)
# Ver sección 9 (Checklist)
```

### 8.3 Cambiar a Producción el Código

```typescript
// src/app/registro-v2/page.tsx

// ANTES (Demo):
import NewRegistrationFlowDemo from '@/components/RegistrationV2/NewRegistrationFlow.demo';
export default function RegistroV2Page() {
    return <NewRegistrationFlowDemo />;
}

// DESPUÉS (Producción):
import NewRegistrationFlow from '@/components/RegistrationV2/NewRegistrationFlow';
export default function RegistroV2Page() {
    return <NewRegistrationFlow />;
}
```

### 8.4 Redirigir Tráfico

```typescript
// src/app/usuarios/registro/page.tsx
// O en next.config.js

import { redirect } from 'next/navigation';

export default function OldRegistrationPage() {
    redirect('/registro-v2');
}
```

O en `next.config.js`:

```javascript
async redirects() {
  return [
    {
      source: '/usuarios/registro',
      destination: '/registro-v2',
      permanent: true,
    },
  ];
}
```

---

## 10. Checklist Pre-Deploy

### Base de Datos
- [ ] Migraciones ejecutadas sin errores
- [ ] Nuevas columnas visibles en Supabase
- [ ] Catálogos poblados (nacionalidades, colores)
- [ ] RLS habilitado en tablas nuevas
- [ ] Índices creados correctamente

### Memberstack (Solo auth + pagos)
- [ ] Custom fields mínimos creados (`registration-step`, `registration-completed`, `first-name`)
- [ ] Planes configurados con price IDs correctos
- [ ] Stripe conectado y funcionando
- [ ] Webhooks configurados (si aplica)

### Variables de Entorno
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] NEXT_PUBLIC_MEMBERSTACK_APP_ID
- [ ] MEMBERSTACK_ADMIN_SECRET_KEY
- [ ] Todas las variables cargadas en Vercel

### Funcionalidad
- [ ] Crear usuario de prueba completo
- [ ] Persistencia al navegar entre pasos
- [ ] Modal de términos funciona
- [ ] Checkout de Stripe procesa pago
- [ ] Post-pago guarda datos en Supabase
- [ ] Email de confirmación enviado (si aplica)

### Performance
- [ ] Build sin errores (`npm run build`)
- [ ] Lighthouse score > 90
- [ ] Tiempo de carga < 3s
- [ ] No hay memory leaks

### Seguridad
- [ ] Secrets no expuestos en cliente
- [ ] RLS protegiendo datos sensibles
- [ ] Validación en frontend y backend
- [ ] Sanitización de inputs

---

## 11. Rollback Plan

### Si Algo Sale Mal

```bash
# Opción 1: Revertir código
git revert HEAD
 git push origin main

# Opción 2: Usar branch anterior
git checkout main
git branch -D feature/nuevo-flujo-registro
 git checkout previous-stable-branch

# Opción 3: Rollback de migraciones (cuidado)
# Ejecutar script de rollback SQL (crear primero)
```

### Datos de Usuarios

Los usuarios creados con el nuevo flujo se identifican por:
- `registration-step` en custom fields
- Nuevas columnas en Supabase

No debería haber conflictos con usuarios antiguos.

### Contactos de Emergencia

| Rol | Contacto | Uso |
|-----|----------|-----|
| Dev Lead | Jorge | Problemas técnicos |
| Product Owner | Lucero | Decisiones de producto |
| Infra | - | Problemas de deploy |

---

## 12. Troubleshooting

### Problema: Se queda cargando infinitamente

**Causa:** Memberstack no carga o error de conexión

**Solución:**
```javascript
// Verificar en consola:
window.$memberstackDom

// Si es undefined:
// 1. Verificar APP_ID
// 2. Verificar que script de Memberstack cargue
// 3. En localhost, puede necesitar recarga
```

### Problema: Error "email-already-in-use"

**Causa:** Usuario ya existe en Memberstack

**Solución:**
- Verificar si es el mismo usuario → permitir continuar
- Si es diferente → mostrar opción de login

### Problema: No guarda en Supabase

**Causa:** Service Role Key incorrecto o RLS bloqueando

**Solución:**
```sql
-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Deshabilitar temporalmente para debug (NO EN PROD)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Problema: Modal de términos no abre

**Causa:** Error en componente o estado

**Solución:**
- Verificar que `selectedPlan` no esté vacío
- Revisar consola por errores de React

### Problema: Checkout de Stripe falla

**Causa:** Configuración incorrecta en Memberstack

**Solución:**
1. Verificar Stripe conectado en Memberstack
2. Verificar price IDs correctos
3. Verificar que usuario tenga email válido

### Problema: SEPOMEX no funciona en desarrollo local (404)

**Causa:** Next.js App Router en Windows/OneDrive a veces no detecta rutas dinámicas `[cp]` en desarrollo.

**Solución:**
- **Desarrollo:** El endpoint usa query params (`/api/sepomex?cp=37545`) que es más confiable
- **Producción (Vercel):** Funciona perfectamente ambos formatos

**Ver en sección:** [7. Configuración de SEPOMEX](#7-configuración-de-sepomex-códigos-postales)

**Causa:** Next.js App Router en Windows/OneDrive a veces no detecta rutas dinámicas `[cp]` en desarrollo.

**Solución:**
- **Desarrollo:** El endpoint usa query params (`/api/sepomex?cp=37545`) que es más confiable
- **Producción (Vercel):** Funciona perfectamente ambos formatos

**Nota importante:** En producción el endpoint funciona correctamente. El error 404 solo ocurre en entorno de desarrollo local.

---

## 📊 Métricas Post-Deploy

Monitorear después del deploy:

| Métrica | Valor Actual | Meta | Frecuencia |
|---------|-------------|------|------------|
| Tasa de abandono | 15% | < 5% | Diaria |
| Clicks hasta pago | ~12 | 4-5 | Semanal |
| Tiempo de registro | ~8 min | < 3 min | Diaria |
| Completitud post-pago | N/A | > 90% | Semanal |

---

## 📞 Soporte

Para problemas durante la implementación:

1. **Revisar logs:** Vercel Dashboard → Functions
2. **Verificar Supabase:** SQL Editor → Query logs
3. **Memberstack:** Dashboard → Logs
4. **Documentación:** Este archivo y AGENTS.md

---

## ✅ Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Dev Lead | | | |
| Product Owner | | | |
| QA Lead | | | |
| Infra/DevOps | | | |

---

## 🎨 Catálogo de Colores de Pelo (Actualización)

Ejecutar este SQL para poblar los nuevos colores predictivos.

```sql
-- Limpiar catálogo actual (opcional, si se desea empezar de cero)
-- TRUNCATE catalog_coat_colors;

-- Insertar colores para Perros
INSERT INTO catalog_coat_colors (pet_type, name, is_common, display_order) VALUES
('dog', 'Arena', true, 1),
('dog', 'Arlequín', true, 2),
('dog', 'Atigrado (brindle)', true, 3),
('dog', 'Azul (gris azulado)', true, 4),
('dog', 'Bicolor', true, 5),
('dog', 'Blanco', true, 6),
('dog', 'Brindle invertido', true, 7),
('dog', 'Canela', true, 8),
('dog', 'Carbón (charcoal)', true, 9),
('dog', 'Champagne', true, 10),
('dog', 'Chocolate', true, 11),
('dog', 'Chocolate diluido', true, 12),
('dog', 'Crema / Beige', true, 13),
('dog', 'Dorado', true, 14),
('dog', 'Gris', true, 15),
('dog', 'Isabella', true, 16),
('dog', 'Lavanda', true, 17),
('dog', 'Lila', true, 18),
('dog', 'Manchado', true, 19),
('dog', 'Marrón', true, 20),
('dog', 'Merle', true, 21),
('dog', 'Merle críptico', true, 22),
('dog', 'Merle fantasma', true, 23),
('dog', 'Negro', true, 24),
('dog', 'Otro', false, 100),
('dog', 'Piebald', true, 25),
('dog', 'Piebald extremo', true, 26),
('dog', 'Pizarra', true, 27),
('dog', 'Plateado / Silver', true, 28),
('dog', 'Platinum', true, 29),
('dog', 'Rojo', true, 30),
('dog', 'Rojo hígado', true, 31),
('dog', 'Sable', true, 32),
('dog', 'Sable sombreado extremo', true, 33),
('dog', 'Tricolor', true, 34);

-- Insertar colores para Gatos
INSERT INTO catalog_coat_colors (pet_type, name, is_common, display_order) VALUES
('cat', 'Amber', true, 1),
('cat', 'Apricot', true, 2),
('cat', 'Atigrado (tabby)', true, 3),
('cat', 'Bicolor', true, 4),
('cat', 'Blanco', true, 5),
('cat', 'Calicó', true, 6),
('cat', 'Cameo', true, 7),
('cat', 'Canela', true, 8),
('cat', 'Caramel', true, 9),
('cat', 'Carey', true, 10),
('cat', 'Chinchilla', true, 11),
('cat', 'Chocolate', true, 12),
('cat', 'Clásico / Marmoleado', true, 13),
('cat', 'Colorpoint', true, 14),
('cat', 'Crema', true, 15),
('cat', 'Fawn', true, 16),
('cat', 'Golden', true, 17),
('cat', 'Golden shaded', true, 18),
('cat', 'Gris / Azul', true, 19),
('cat', 'Lavanda', true, 20),
('cat', 'Lila', true, 21),
('cat', 'Manchado', true, 22),
('cat', 'Marrón', true, 23),
('cat', 'Mink', true, 24),
('cat', 'Naranja', true, 25),
('cat', 'Negro', true, 26),
('cat', 'Otro', false, 100),
('cat', 'Rayado', true, 27),
('cat', 'Sepia', true, 28),
('cat', 'Shaded Silver', true, 29),
('cat', 'Silver shaded', true, 30),
('cat', 'Smoke', true, 31),
('cat', 'Ticked', true, 32),
('cat', 'Ticked extremo', true, 33),
('cat', 'Torbie', true, 34),
('cat', 'Tricolor', true, 35),
('cat', 'Tuxedo', true, 36);
```

---

## 🔴 BYPASSES TEMPORALES DE PAGO (Reactivar cuando se activen cobros)

> **CRÍTICO:** Estos cambios fueron hechos el 7 de Marzo 2026 para permitir pruebas del dashboard sin que el sistema redirija a la página de pago. **Cuando se activen los cobros en producción, TODOS estos puntos deben revertirse.**

### Resumen de Cambios Temporales

| # | Archivo | Descripción | Estado Actual |
|---|---------|-------------|---------------|
| 1 | `webflow-components/login-redirect-handler-v3.html` | Redirección post-login para `pending_payment` | ⚠️ Bypassed → va al dashboard |
| 2 | `webflow-components/payment-status-checker.html` | Mensaje de pago requerido en dashboard | ⚠️ Bypassed → no muestra mensaje |
| 3 | `webflow-components/dashboard-protector.html` | Protección de acceso al dashboard sin pago | ⚠️ Bypassed → permite acceso |
| 4 | `public/widgets/unified-membership-widget.js` | Widget unificado no carga mascotas si no ha pagado | ⚠️ Bypassed → carga mascotas normalmente |

---

### 1️⃣ `login-redirect-handler-v3.html` (Script Webflow)

**Archivo:** `webflow-components/login-redirect-handler-v3.html`  
**Qué hace:** Después del login, redirige a los usuarios según su rol.

**Estado actual (TEMPORAL):** El caso `pending_payment` redirige al dashboard del miembro en lugar de la página de pago.

**Para reactivar cobros:**

```javascript
// BUSCAR este bloque (dentro de case 'pending_payment'):
// TEMPORAL: Redirigir al dashboard mientras se prueba
logger.log('⚠️ TEMPORAL: Permitiendo acceso al dashboard sin pago (MODO PRUEBA)');
window.location.href = CONFIG.dashboards.member;

// REEMPLAZAR POR:
logger.log('⚠️ Usuario sin plan activo, redirigiendo a registro...');
window.location.href = 'https://app.pataamiga.mx/usuarios/registro';
```

> **NOTA:** La URL antigua era `https://www.pataamiga.mx/seleccion-plan`. La **nueva URL** apunta al flujo de registro-v2: `https://app.pataamiga.mx/usuarios/registro`

---

### 2️⃣ `payment-status-checker.html` (Script Webflow)

**Archivo:** `webflow-components/payment-status-checker.html`  
**Qué hace:** Verifica el estado de pago dentro del dashboard y muestra mensaje si no ha pagado.

**Estado actual (TEMPORAL):**
- `CONFIG.paymentUrl` ya apunta a la nueva URL ✅
- La lógica de `pending_payment` está comentada (no muestra mensaje ni redirige)

**Para reactivar cobros:**

```javascript
// BUSCAR este bloque dentro de checkPaymentStatus():
case 'pending_payment':
    // TEMPORAL: Permitir acceso al dashboard en pruebas
    logger.log('⚠️ TEMPORAL: Permitiendo paso sin pago (MODO PRUEBA)');
    // showPaymentRequiredMessage();  ← DESCOMENTARLA
    break;

// REEMPLAZAR POR:
case 'pending_payment':
    logger.log('⚠️ Usuario sin plan activo');
    showPaymentRequiredMessage();
    break;
```

---

### 3️⃣ `dashboard-protector.html` (Script Webflow)

**Archivo:** `webflow-components/dashboard-protector.html`  
**Qué hace:** Protege el acceso al dashboard. Si el usuario no ha pagado, lo expulsa a la página de pago.

**Estado actual (TEMPORAL):**
- El bloque `pending_payment` está comentado (permite acceso libre al dashboard)
- Ya tiene la nueva URL lista en un comentario

**Para reactivar cobros:**

```javascript
// BUSCAR este bloque:
if (data.role === 'pending_payment') {
    // TEMPORAL: Permitir acceso al dashboard en pruebas
    logger.log('⚠️ Usuario sin plan activo, pero permitiendo paso al dashboard (MODO PRUEBA)');
    
    // Cuando actives los cobros, descomenta la siguiente línea con la NUEVA URL:
    // window.location.href = 'https://app.pataamiga.mx/usuarios/registro';
    
    // Comentado para permitir el paso
    // return;
}

// REEMPLAZAR POR:
if (data.role === 'pending_payment') {
    logger.log('⚠️ Usuario sin plan activo, redirigiendo a registro...');
    window.location.href = 'https://app.pataamiga.mx/usuarios/registro';
    return;
}
```

> **IMPORTANTE:** Actualizar también el script en **Webflow** (copiar/pegar el archivo completo actualizado).

---

### 4️⃣ `unified-membership-widget.js` (Widget del Dashboard)

**Archivo:** `public/widgets/unified-membership-widget.js`  
**Qué hace:** El widget principal del dashboard que muestra periodo de carencia, mascotas, etc. Cuando el usuario no ha pagado, **no carga mascotas** y muestra una vista de "pago requerido".

**Estado actual (TEMPORAL):**
- El bloque `pending_payment` en `loadData()` está comentado
- El widget carga mascotas normalmente aunque el usuario no haya pagado

**Para reactivar cobros:**

```javascript
// BUSCAR este bloque dentro de loadData():
if (roleData.role === 'pending_payment') {
    console.log('⚠️ Unified Widget: User has no active plan, pero permitiendo carga de mascotas (MODO PRUEBA)');
    // this.membershipStatus = 'pending_payment';
    // this.pets = [];
    // return;
}

// REEMPLAZAR POR:
if (roleData.role === 'pending_payment') {
    console.log('⚠️ Unified Widget: User has no active plan!');
    this.membershipStatus = 'pending_payment';
    this.pets = [];
    return; // No cargar mascotas, mostrar vista de pago
}
```

---

### Checklist de Reactivación de Cobros

Cuando se reactiven los cobros, seguir este orden:

- [ ] **Paso 1:** Reactivar `unified-membership-widget.js` (descomentar bloque `pending_payment` en `loadData()`)
- [ ] **Paso 2:** Reactivar `dashboard-protector.html` (descomentar `return` y redirección)
- [ ] **Paso 3:** Reactivar `payment-status-checker.html` (descomentar `showPaymentRequiredMessage()`)
- [ ] **Paso 4:** Reactivar `login-redirect-handler-v3.html` (cambiar redirección a nueva URL de registro)
- [ ] **Paso 5:** Copiar los scripts actualizados a **Webflow** y publicar el sitio
- [ ] **Paso 6:** Hacer `git push` para que Vercel despliegue los cambios del widget
- [ ] **Paso 7:** Probar flujo completo: login → redirección a pago → pago → dashboard

> **URL NUEVA de pago/registro:** `https://app.pataamiga.mx/usuarios/registro`  
> **URL VIEJA (ya NO usar):** `https://www.pataamiga.mx/seleccion-plan` ❌

---

**Documento versión:** 2.2  
**Última actualización:** 07 Marzo 2026  
**Próxima revisión:** Post-deploy (día 1, 7, 30)
