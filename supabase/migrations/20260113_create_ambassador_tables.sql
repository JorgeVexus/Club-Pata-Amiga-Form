-- ============================================
-- 🎯 Sistema de Embajadores - Club Pata Amiga
-- Migración: Crear tablas para embajadores
-- Fecha: 2026-01-13
-- ============================================

-- ============================================
-- 1. TABLA PRINCIPAL: ambassadors
-- ============================================
CREATE TABLE IF NOT EXISTS ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificador único (generado por el sistema, no Memberstack)
    ambassador_code TEXT UNIQUE NOT NULL, -- Ej: "EMB-2024-001"
    
    -- ========== PASO 1: Datos Personales ==========
    first_name TEXT NOT NULL,
    paternal_surname TEXT NOT NULL,
    maternal_surname TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'not_specified')),
    birth_date DATE,
    curp TEXT UNIQUE,
    ine_front_url TEXT,   -- INE Frente
    ine_back_url TEXT,    -- INE Reverso
    
    -- Dirección
    postal_code TEXT,
    state TEXT,
    city TEXT,
    neighborhood TEXT,
    address TEXT,
    
    -- Contacto
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT, -- Para login propio sin Memberstack
    
    -- ========== PASO 2: Información Adicional ==========
    instagram TEXT,
    facebook TEXT,
    tiktok TEXT,
    other_social TEXT,
    motivation TEXT, -- ¿Por qué quieres ser embajador?
    
    -- ========== PASO 3: Datos Bancarios ==========
    rfc TEXT,
    payment_method TEXT CHECK (payment_method IN ('card', 'clabe', 'pending')),
    bank_name TEXT,
    card_last_digits TEXT, -- Solo últimos 4 dígitos
    clabe TEXT,
    
    -- ========== Código de Referido ==========
    referral_code TEXT UNIQUE NOT NULL, -- Ej: "PATA-MARIA-2024"
    
    -- ========== Estado y Aprobación ==========
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    
    -- ========== Comisiones ==========
    commission_percentage DECIMAL(5,2) DEFAULT 10.00, -- 10% por defecto
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_payout DECIMAL(10,2) DEFAULT 0.00,
    
    -- ========== Vínculo con Usuario Memberstack (opcional) ==========
    -- Si el embajador también es miembro de Club Pata Amiga
    linked_memberstack_id TEXT,
    
    -- ========== Timestamps ==========
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ============================================
-- 2. TABLA: referrals (Usuarios referidos)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Embajador que refirió
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    
    -- Usuario referido
    referred_user_id TEXT NOT NULL, -- Memberstack ID del usuario
    referred_user_name TEXT,
    referred_user_email TEXT,
    
    -- Membresía pagada
    membership_plan TEXT, -- Nombre del plan
    membership_amount DECIMAL(10,2), -- Monto pagado
    
    -- Comisión generada
    commission_percentage DECIMAL(5,2), -- % aplicado
    commission_amount DECIMAL(10,2), -- Monto de comisión
    commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- Cuándo se pagó la comisión
    paid_at TIMESTAMPTZ,
    payout_id UUID, -- Referencia al pago
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: ambassador_payouts (Pagos a embajadores)
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Embajador
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    
    -- Detalles del pago
    amount DECIMAL(10,2) NOT NULL,
    referrals_count INT DEFAULT 0, -- Cuántos referidos incluye
    
    -- Método y referencia
    payment_method TEXT, -- 'transfer', 'card', etc.
    payment_reference TEXT, -- Número de transferencia, etc.
    
    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Procesado
    processed_at TIMESTAMPTZ,
    processed_by TEXT, -- Admin que procesó
    
    -- Notas
    notes TEXT,
    
    -- Período del pago
    period_start DATE,
    period_end DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: ambassador_sessions (Sesiones de login)
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
    
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Info de la sesión
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONFIGURACIÓN DEL SISTEMA
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- Insertar configuración inicial
INSERT INTO ambassador_config (key, value, description) VALUES
    ('default_commission_percentage', '10', 'Porcentaje de comisión por defecto'),
    ('payment_frequency', 'monthly', 'Frecuencia de pagos: monthly, biweekly, weekly'),
    ('minimum_payout_amount', '0', 'Monto mínimo para solicitar pago'),
    ('referral_code_prefix', 'PATA', 'Prefijo para códigos de referido')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ambassadors_status ON ambassadors(status);
CREATE INDEX IF NOT EXISTS idx_ambassadors_email ON ambassadors(email);
CREATE INDEX IF NOT EXISTS idx_ambassadors_referral_code ON ambassadors(referral_code);
CREATE INDEX IF NOT EXISTS idx_ambassadors_curp ON ambassadors(curp);

CREATE INDEX IF NOT EXISTS idx_referrals_ambassador ON referrals(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(commission_status);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(referred_user_id);

CREATE INDEX IF NOT EXISTS idx_payouts_ambassador ON ambassador_payouts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON ambassador_payouts(status);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON ambassador_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_ambassador ON ambassador_sessions(ambassador_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ambassador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ambassadors
DROP TRIGGER IF EXISTS trigger_ambassador_updated_at ON ambassadors;
CREATE TRIGGER trigger_ambassador_updated_at
    BEFORE UPDATE ON ambassadors
    FOR EACH ROW
    EXECUTE FUNCTION update_ambassador_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura (el service role puede leer todo)
CREATE POLICY "Service role can do everything on ambassadors"
    ON ambassadors FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on referrals"
    ON referrals FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on payouts"
    ON ambassador_payouts FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on sessions"
    ON ambassador_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE ambassadors IS 'Embajadores del Club Pata Amiga';
COMMENT ON TABLE referrals IS 'Usuarios referidos por embajadores';
COMMENT ON TABLE ambassador_payouts IS 'Pagos realizados a embajadores';
COMMENT ON TABLE ambassador_sessions IS 'Sesiones de login de embajadores';
COMMENT ON TABLE ambassador_config IS 'Configuración del sistema de embajadores';
