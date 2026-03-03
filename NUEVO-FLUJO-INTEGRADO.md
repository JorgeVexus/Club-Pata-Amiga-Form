# Nuevo Flujo de Registro - Integración Completa

> **Fecha:** 26 de Febrero 2026  
> **Estado:** Implementado y listo para pruebas  
> **Objetivo:** Rediseñar el formulario actual con el flujo optimizado de 4-5 clicks

---

## 🎯 Cambios Principales

### Flujo Anterior (Problema: 15% abandono)
1. RegistrationForm - Datos completos del usuario (~15 campos)
2. PetRegistrationForm - Datos completos de mascota (~12 campos)
3. PlanSelection - Selección de plan
4. Pago

### Nuevo Flujo (Meta: <5% abandono)
1. **Step1Account** - Solo email + contraseña (2 campos)
2. **Step2PetBasic** - Tipo, nombre, edad (3 campos)
3. **Step3PlanSelection** - Selección de plan + pago Stripe
4. **Step4CompleteProfile** - Datos del contratante post-pago (~7 campos)
5. **Step5CompletePet** - Datos complementarios mascota

---

## 📁 Estructura de Archivos

### Componente Principal
```
src/components/RegistrationV2/
├── NewRegistrationFlow.tsx          # Orquestador del flujo
├── NewRegistrationFlow.module.css
├── PetTypeSelector.tsx              # Selector perro/gato
├── PetTypeSelector.module.css
├── AgeInput.tsx                     # Input edad con toggle años/meses
├── AgeInput.module.css
├── NationalitySelect.tsx            # Selector de nacionalidad
├── NationalitySelect.module.css
├── BenefitsBanner.tsx               # Franja de beneficios
├── BenefitsBanner.module.css
├── StepIndicator.tsx                # Indicador de pasos
├── StepIndicator.module.css
└── steps/                           # Pasos individuales
    ├── Step1Account.tsx             # Crear cuenta
    ├── Step2PetBasic.tsx            # Datos básicos mascota
    ├── Step3PlanSelection.tsx       # Selección de plan
    ├── Step4CompleteProfile.tsx     # Completar perfil (post-pago)
    ├── Step5CompletePet.tsx         # Completar mascota (post-pago)
    └── steps.module.css             # Estilos compartidos
```

### Página Nueva
```
src/app/registro-v2/
└── page.tsx                         # Punto de entrada del nuevo flujo
```

### APIs Nuevas
```
src/app/api/
├── sepomex/[cp]/
│   └── route.ts                     # Consulta CP con cache
└── catalogs/
    ├── nationalities/
    │   └── route.ts                 # Catálogo de países
    ├── coat-colors/
    │   └── route.ts                 # Colores de pelo
    └── breeds/
        └── route.ts                 # Razas por tipo
```

### Migraciones
```
supabase/migrations/001_reestructuracion_flujo.sql
```

---

## 🚀 Cómo Usar

### 1. Probar el nuevo flujo
```bash
npm run dev
```
Acceder a: `http://localhost:3000/registro-v2`

### 2. Flujo de datos

**Paso 1: Cuenta**
- Crea usuario en Memberstack con estado `pending_payment`
- Guarda email y password
- Actualiza `registration-step: 2`

**Paso 2: Mascota básica**
- Guarda en localStorage temporalmente
- Actualiza Memberstack con tipo, nombre, edad
- Muestra warning si es senior (10+ años)

**Paso 3: Plan y Pago**
- Usa el checkout de Stripe via Memberstack
- Al completar pago: `payment-status: completed`
- Redirige a paso 4

**Paso 4: Completar Perfil**
- Usa API SEPOMEX con cache para dirección
- Guarda en Supabase con datos completos
- Campos: nombre, CURP, teléfono, dirección, nacionalidad

**Paso 5: Completar Mascota**
- Usa catálogo de razas existente
- Guarda colores, sexo, raza
- Opcional: foto, historia de adopción (mestizos)
- Opcional: certificado veterinario (seniors)

---

## 🔧 Integraciones Mantenidas

### Memberstack
- ✅ Creación de usuarios: `signupMemberEmailPassword`
- ✅ Actualización de custom fields: `updateMember`
- ✅ Checkout de Stripe: `purchasePlansWithCheckout`
- ✅ Campos custom: `registration-step`, `payment-status`, etc.

### Supabase
- ✅ Registro de usuarios: `registerUserInSupabase`
- ✅ Cache de SEPOMEX: `catalog_sepomex`
- ✅ Catálogos: nacionalidades, colores

### Servicios Existentes
- ✅ `memberstack.service.ts` - Funciones adaptadas
- ✅ `user.actions.ts` - Server actions reutilizadas
- ✅ `pet.service.ts` - Servicio de mascotas existente

---

## 📊 Diferencias Clave

| Aspecto | Antes | Después |
|---------|-------|---------|
| Clicks hasta pago | ~12 | 4-5 |
| Campos pre-pago | ~30 | 5 |
| Tiempo estimado | 8 min | < 3 min |
| Validación INE | Pre-pago | Post-pago (eliminar) |
| Fotos mascota | Obligatorias | Opcionales (15 días) |
| Edad máxima | 9 años | Sin límite (certificado si 10+) |

---

## ⚙️ Configuración

### Variables de Entorno Necesarias
```env
# Supabase (ya existentes)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (ya existentes)
STRIPE_WEBHOOK_SECRET=

# Nuevas opcionales
SEPOMEX_CACHE_TTL=86400
PHOTO_DEADLINE_DAYS=15
```

### Migraciones de BD
Ejecutar:
```bash
# En consola de Supabase SQL Editor
\i supabase/migrations/001_reestructuracion_flujo.sql
```

---

## 🔄 Estados del Registro (Memberstack Custom Fields)

```
registration-step: 1-5
pre-payment-completed: true/false
payment-status: pending/completed/failed
registration-completed: true/false
approval-status: waiting_approval
```

---

## 📝 Pendientes para Producción

1. **Validación de CURP** - Integrar validador real
2. **Subida de fotos** - Conectar con Supabase Storage
3. **Emails** - Templates post-pago y recordatorios
4. **Cron jobs** - Recordatorios día 7, 13, 14 de fotos
5. **Redirección** - Cambiar /usuarios/registro a nuevo flujo
6. **Tests** - Probar flujo completo end-to-end

---

## 🧪 Testing

### Casos de prueba:
1. Registro completo con datos válidos
2. Mascota senior (12 años) - debe mostrar warning
3. Raza mestizo - debe mostrar campos de adopción
4. CP válido (01000) - autocompletar estado/municipio
5. Sin subir fotos - permitir y recordar después

### Datos de prueba:
- CP: 01000 (CDMX)
- CURP: ABCD123456HDFRNN09
- Email: test@example.com

---

## 📞 Soporte

Para cambiar al nuevo flujo en producción:
1. Reemplazar contenido de `/usuarios/registro/page.tsx`
2. O redirigir `/usuarios/registro` → `/registro-v2`
3. Actualizar links en otras páginas

---

**Documento versión:** 1.0  
**Última actualización:** 26 Febrero 2026
