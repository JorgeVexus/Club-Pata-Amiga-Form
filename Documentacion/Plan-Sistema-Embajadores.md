# 🎯 Plan de Implementación: Sistema de Embajadores

## 📋 Resumen del Sistema

Los **embajadores** son personas que promocionan Club Pata Amiga y ganan comisiones por cada usuario que se registre usando su código de referido.

### Características Principales:
- Formulario de registro en **3 pasos** (similar a usuarios)
- **Dashboard de embajador** con estadísticas y código de referido
- Sistema de **comisiones** por referidos
- **Aprobación manual** por admin antes de activarse
- Los **usuarios existentes** pueden aplicar a ser embajadores
- Los **embajadores** pueden registrarse también como usuarios/miembros

---

## 📊 Cronograma por Chunks

| Chunk | Descripción | Duración Est. |
|-------|-------------|---------------|
| **1** | Base de datos y tipos | 1-2 horas |
| **2** | Formulario de registro (3 pasos) | 3-4 horas |
| **3** | APIs de embajadores | 2-3 horas |
| **4** | Panel Admin: Gestión de embajadores | 2-3 horas |
| **5** | Dashboard del embajador | 3-4 horas |
| **6** | Sistema de códigos de referido | 2-3 horas |
| **7** | Sistema de comisiones | 2-3 horas |
| **8** | Widget Webflow + Integración | 2-3 horas |

**Total estimado: 18-25 horas (3-4 días)**

---

## 🔧 Chunk 1: Base de Datos y Tipos

### Tablas Supabase:

```sql
-- Tabla principal de embajadores
CREATE TABLE ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memberstack_id TEXT UNIQUE NOT NULL,
    
    -- Datos personales (Paso 1)
    first_name TEXT NOT NULL,
    paternal_surname TEXT NOT NULL,
    maternal_surname TEXT,
    gender TEXT, -- 'male', 'female', 'not_specified'
    birth_date DATE NOT NULL,
    curp TEXT UNIQUE NOT NULL,
    ine_front_url TEXT,
    ine_back_url TEXT,
    
    -- Dirección
    postal_code TEXT,
    state TEXT,
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    
    -- Contacto
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Información adicional (Paso 2)
    instagram TEXT,
    facebook TEXT,
    tiktok TEXT,
    other_social TEXT,
    motivation TEXT, -- Por qué quiere ser embajador
    
    -- Datos bancarios (Paso 3)
    rfc TEXT,
    payment_method TEXT, -- 'card', 'clabe', 'pending'
    bank_name TEXT,
    card_last_digits TEXT,
    clabe TEXT,
    
    -- Código de referido
    referral_code TEXT UNIQUE NOT NULL,
    
    -- Estado y metadata
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, suspended
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    
    -- Comisiones
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_payout DECIMAL(10,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de referidos (usuarios que usaron un código)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID REFERENCES ambassadors(id),
    referral_code TEXT NOT NULL,
    
    -- Usuario referido
    referred_user_id TEXT NOT NULL, -- Memberstack ID del usuario
    referred_user_name TEXT,
    referred_user_email TEXT,
    
    -- Membresía
    membership_plan TEXT,
    membership_amount DECIMAL(10,2),
    
    -- Comisión
    commission_amount DECIMAL(10,2),
    commission_status TEXT DEFAULT 'pending', -- pending, paid, cancelled
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pagos a embajadores
CREATE TABLE ambassador_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID REFERENCES ambassadors(id),
    
    amount DECIMAL(10,2) NOT NULL,
    referrals_count INT,
    payment_method TEXT,
    payment_reference TEXT,
    
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMPTZ,
    processed_by TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
CREATE INDEX idx_ambassadors_referral_code ON ambassadors(referral_code);
CREATE INDEX idx_referrals_ambassador ON referrals(ambassador_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### Tipos TypeScript:

```typescript
// src/types/ambassador.types.ts

export interface Ambassador {
    id: string;
    memberstack_id: string;
    
    // Datos personales
    first_name: string;
    paternal_surname: string;
    maternal_surname?: string;
    gender?: 'male' | 'female' | 'not_specified';
    birth_date: string;
    curp: string;
    ine_front_url?: string;
    ine_back_url?: string;
    
    // Dirección
    postal_code?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    
    // Contacto
    email: string;
    phone?: string;
    
    // Redes sociales
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    other_social?: string;
    motivation?: string;
    
    // Datos bancarios
    rfc?: string;
    payment_method?: 'card' | 'clabe' | 'pending';
    bank_name?: string;
    card_last_digits?: string;
    clabe?: string;
    
    // Código y estado
    referral_code: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    rejection_reason?: string;
    approved_at?: string;
    
    // Comisiones
    commission_percentage: number;
    total_earnings: number;
    pending_payout: number;
    
    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface Referral {
    id: string;
    ambassador_id: string;
    referral_code: string;
    referred_user_id: string;
    referred_user_name?: string;
    referred_user_email?: string;
    membership_plan?: string;
    membership_amount: number;
    commission_amount: number;
    commission_status: 'pending' | 'paid' | 'cancelled';
    paid_at?: string;
    created_at: string;
}

export interface AmbassadorPayout {
    id: string;
    ambassador_id: string;
    amount: number;
    referrals_count: number;
    payment_method?: string;
    payment_reference?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processed_at?: string;
    notes?: string;
    created_at: string;
}

// Formulario de registro
export interface AmbassadorFormData {
    // Paso 1
    first_name: string;
    paternal_surname: string;
    maternal_surname: string;
    gender: string;
    birth_date: string;
    curp: string;
    ine_front: File | null;
    ine_back: File | null;
    postal_code: string;
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    email: string;
    phone: string;
    
    // Paso 2
    instagram: string;
    facebook: string;
    tiktok: string;
    other_social: string;
    motivation: string;
    
    // Paso 3
    rfc: string;
    payment_method: string;
    bank_name: string;
    card_number: string;
    clabe: string;
    accept_terms: boolean;
}
```

---

## 🎨 Chunk 2: Formulario de Registro (3 Pasos)

### Estructura de componentes:

```
src/
├── app/
│   └── embajadores/
│       └── registro/
│           └── page.tsx          # Página principal
├── components/
│   └── AmbassadorForm/
│       ├── AmbassadorForm.tsx    # Componente principal
│       ├── AmbassadorForm.module.css
│       ├── Step1PersonalInfo.tsx # Paso 1: Datos personales
│       ├── Step2AdditionalInfo.tsx # Paso 2: Redes + motivación
│       ├── Step3BankingInfo.tsx  # Paso 3: RFC + banco
│       └── SuccessScreen.tsx     # Pantalla de éxito
```

### Campos por paso:

**Paso 1 - Completa tu perfil:**
- Nombre(s)
- Apellido paterno
- Apellido materno
- Género (Hombre/Mujer/Prefiero no especificar)
- Fecha de nacimiento
- CURP
- INE (frente y reverso)
- Código postal
- Estado
- Ciudad
- Colonia
- Dirección
- Email
- Teléfono

**Paso 2 - Información adicional:**
- Instagram (opcional)
- Facebook (opcional)
- TikTok (opcional)
- Otra red social (opcional)
- ¿Por qué quieres ser embajador? (textarea)

**Paso 3 - Datos bancarios y RFC:**
- RFC
- Método de pago:
  - Agregar tarjeta (débito)
  - Ingresar cuenta (CLABE)
  - Agregar después
- Checkbox: Acepto términos y condiciones

---

## 🔌 Chunk 3: APIs de Embajadores

```
src/app/api/
├── ambassadors/
│   ├── route.ts                    # GET (lista), POST (crear)
│   ├── [id]/
│   │   ├── route.ts               # GET, PUT, DELETE
│   │   └── status/
│   │       └── route.ts           # PATCH (aprobar/rechazar)
│   ├── by-code/
│   │   └── [code]/
│   │       └── route.ts           # GET embajador por código
│   └── check-curp/
│       └── route.ts               # POST verificar CURP único
├── referrals/
│   ├── route.ts                   # GET, POST
│   └── validate-code/
│       └── route.ts               # POST validar código
└── payouts/
    └── route.ts                   # GET, POST pagos
```

---

## 👨‍💼 Chunk 4: Panel Admin - Gestión de Embajadores

### Nueva sección en Admin Dashboard:
- **Lista de embajadores** con filtros (pendientes, aprobados, rechazados)
- **Modal de detalle** de embajador
- **Acciones:** Aprobar, Rechazar, Suspender
- **Ver referidos** de cada embajador
- **Historial de pagos**

---

## 📊 Chunk 5: Dashboard del Embajador

### Secciones del dashboard:
1. **Mi código de referido** (copiar, compartir)
2. **Estadísticas:**
   - Total de referidos
   - Referidos este mes
   - Ganancias totales
   - Ganancias pendientes
3. **Lista de referidos** (nombre, fecha, estado)
4. **Historial de pagos**
5. **Mi perfil** (editar datos bancarios)

---

## 🎟️ Chunk 6: Sistema de Códigos de Referido

### Lógica:
- Generar código único automáticamente (ej: `PATA-MARIA-2024`)
- Validar código al registrarse como usuario
- Asociar usuario al embajador
- El código se puede usar en el formulario de registro de usuarios

---

## 💰 Chunk 7: Sistema de Comisiones

### Flujo:
1. Usuario se registra con código de referido
2. Usuario paga membresía
3. Se calcula comisión (% del pago)
4. Se registra en `referrals`
5. Admin procesa pagos mensuales

---

## 🌐 Chunk 8: Widget Webflow + Integración

### Widgets:
- **Widget de registro de embajador** (formulario 3 pasos)
- **Widget de dashboard** (para página de Webflow)
- Actualizar formulario de usuario para aceptar código de referido

---

## 🚀 Orden de Implementación

1. ✅ **Chunk 1:** Base de datos → Crear tablas y tipos
2. ✅ **Chunk 2:** Formulario → Implementar registro en 3 pasos
3. ✅ **Chunk 3:** APIs → Backend para embajadores
4. ✅ **Chunk 4:** Admin → Gestión de solicitudes
5. ✅ **Chunk 5:** Dashboard → Panel del embajador
6. ✅ **Chunk 6:** Códigos → Generación y validación
7. ✅ **Chunk 7:** Comisiones → Tracking y pagos
8. ✅ **Chunk 8:** Webflow → Widgets e integración

---

## ❓ Preguntas para el Cliente

1. **Porcentaje de comisión:** ¿Fijo (ej: 10%) o variable?
2. **Frecuencia de pagos:** ¿Mensual, quincenal?
3. **Monto mínimo para pago:** ¿Hay un mínimo para solicitar pago?
4. **El embajador necesita Memberstack?** ¿O solo registro en Supabase?
5. **¿Los embajadores tienen acceso a alguna área de Webflow?**
