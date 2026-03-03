# Nuevo Flujo de Registro - Implementación Local

> **Fecha:** 26 de Febrero 2026  
> **Estado:** Implementado en ambiente local  
> **Objetivo:** Reducir abandono del 15% a <5% optimizando flujo a 4-5 clicks

---

## 📋 Resumen del Cambio

### Antes (Flujo Actual)
1. Registro de usuario (~15 campos)
2. Registro de mascota (~12 campos)
3. Selección de plan
4. Pago
5. **Resultado:** 15% de abandono

### Después (Nuevo Flujo)
1. **Paso 1:** Cuenta (email, contraseña) - 2 campos
2. **Paso 2:** Mascota básica (tipo, nombre, edad) - 3 campos
3. **Paso 3:** Plan + Pago
4. **Post-pago:** Datos contratante (~7 campos)
5. **Post-pago:** Datos complementarios mascota
6. **Resultado esperado:** <5% de abandono

---

## 🗂️ Estructura de Archivos Creados

### Base de Datos
```
supabase/migrations/001_reestructuracion_flujo.sql
```

### Tipos TypeScript
```
src/types/registration.types.ts
```

### Componentes UI Nuevos
```
src/components/RegistrationV2/
├── PetTypeSelector.tsx       # Selector visual perro/gato
├── PetTypeSelector.module.css
├── AgeInput.tsx              # Input edad con toggle años/meses
├── AgeInput.module.css
├── NationalitySelect.tsx     # Selector de nacionalidad
├── NationalitySelect.module.css
├── BenefitsBanner.tsx        # Franja de beneficios sticky
├── BenefitsBanner.module.css
├── StepIndicator.tsx         # Indicador de pasos
└── StepIndicator.module.css
```

### Páginas de Registro
```
src/app/registro/
├── paso-1-cuenta/
│   ├── page.tsx              # Email + contraseña
│   └── page.module.css
├── paso-2-mascota/
│   ├── page.tsx              # Tipo, nombre, edad
│   └── page.module.css
├── paso-3-plan/
│   ├── page.tsx              # Selección de plan
│   └── page.module.css
├── completar-perfil/
│   ├── page.tsx              # Datos contratante post-pago
│   └── page.module.css
├── completar-mascota/
│   ├── page.tsx              # Datos complementarios
│   └── page.module.css
└── confirmacion/
    ├── page.tsx              # Página de éxito
    └── page.module.css
```

### API Endpoints
```
src/app/api/
├── sepomex/[cp]/
│   └── route.ts              # Consulta CP con cache
└── catalogs/
    ├── nationalities/
    │   └── route.ts          # Catálogo nacionalidades
    └── coat-colors/
        └── route.ts          # Catálogo colores de pelo
```

---

## 🚀 Cómo Probar el Nuevo Flujo

### 1. Iniciar el servidor de desarrollo
```bash
npm run dev
```

### 2. Acceder al nuevo flujo
Abrir en navegador: `http://localhost:3000/registro/paso-1-cuenta`

### 3. Flujo de prueba
- **Paso 1:** Ingresar email y contraseña
- **Paso 2:** Seleccionar tipo de mascota, nombre y edad
- **Paso 3:** Seleccionar plan y simular pago
- **Post-pago:** Completar datos personales
- **Confirmación:** Ver página de éxito

### 4. Datos persistentes
Los datos se guardan en `localStorage` durante el proceso:
- `registration_step1` - Datos de cuenta
- `registration_step2` - Datos básicos de mascota
- `registration_step3` - Plan seleccionado
- `registration_contractor` - Datos del contratante
- `registration_pet_complementary` - Datos complementarios
- `registration_completed` - Flag de completitud

---

## 🗃️ Migraciones de Base de Datos

### Para aplicar migraciones en local:

1. Conectar a Supabase local o remoto
2. Ejecutar el archivo SQL:
   ```bash
   # Usando psql
   psql -h localhost -U postgres -d pet_membership -f supabase/migrations/001_reestructuracion_flujo.sql
   
   # O desde consola de Supabase
   ```

### Cambios incluidos:
- Nuevas columnas en tabla `users` (nacionalidad, tracking de registro)
- Nuevas columnas en tabla `pets` (colores, sistema de fotos, edad)
- Nuevas tablas de catálogos (nacionalidades, colores, cache SEPOMEX)
- Tabla de tracking de registro
- Tabla de fotos pendientes con deadline

---

## 🔧 Variables de Entorno (Nuevas)

Agregar a `.env.local`:
```env
# SEPOMEX
SEPOMEX_CACHE_TTL=86400

# Stripe
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# Recordatorios fotos
PHOTO_REMINDER_DAYS=7,13,14
PHOTO_DEADLINE_DAYS=15

NEXT_PUBLIC_DEFAULT_NATIONALITY=México
```

---

## ⚠️ Consideraciones para Producción

### Antes de deployar:
1. [ ] Ejecutar migraciones de BD
2. [ ] Configurar webhooks de Stripe
3. [ ] Configurar campos custom en Memberstack
4. [ ] Probar integración SEPOMEX
5. [ ] Configurar envío de emails post-pago
6. [ ] Probar flujo completo end-to-end

### Cambios necesarios para producción:
- Reemplazar `localStorage` por API calls reales
- Integrar checkout de Stripe
- Configurar Memberstack para crear usuarios reales
- Implementar envío de emails
- Configurar cron jobs para recordatorios de fotos

---

## 📊 Métricas a Monitorear

| Métrica | Valor Actual | Meta |
|---------|-------------|------|
| Tasa de abandono | 15% | < 5% |
| Clicks hasta pago | ~12 | 4-5 |
| Tiempo en formulario | ~8 min | < 3 min |
| Completitud post-pago | N/A | > 90% |

---

## 🔄 Flujo de Estados (Memberstack)

```
pending → pre_payment_completed → payment_completed → 
contract_data_pending → pet_data_pending → completed
```

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar logs en consola del navegador
2. Verificar estado de localStorage
3. Consultar documentación en `PLAN-REESTRUCTURACION-FLUJO.md`

---

**Nota:** Esta implementación es para pruebas locales. Para producción se requiere integración completa con Stripe, Memberstack y envío de emails.
