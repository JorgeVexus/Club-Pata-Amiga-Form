-- ============================================================
-- MIGRACIÓN: Sistema de Centros de Bienestar
-- Fecha: Mayo 2026
-- Objetivo: Implementar registro, gestión y dashboard de Centros de Bienestar
-- ============================================================

-- 1. TABLA PRINCIPAL: wellness_centers
CREATE TABLE IF NOT EXISTS wellness_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memberstack_id VARCHAR(255) UNIQUE, -- Vínculo con Memberstack para login
    
    -- Información del establecimiento
    name VARCHAR(255) NOT NULL,
    services TEXT[] DEFAULT '{}', -- Array de servicios: 'Tienda', 'Clínica', etc.
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    promotion_details TEXT, -- Beneficio ofrecido a miembros
    
    -- Dirección y Geolocalización
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    
    -- Redes Sociales
    social_links JSONB DEFAULT '{}', -- {instagram, facebook, tiktok, twitter, etc}
    
    -- Estado de la solicitud
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'appealed', 'cancelled'
    
    -- Administración
    rejection_reason TEXT,
    appeal_message TEXT,
    
    -- Cancelación y Retención
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_wc_status ON wellness_centers(status);
CREATE INDEX IF NOT EXISTS idx_wc_email ON wellness_centers(email);
CREATE INDEX IF NOT EXISTS idx_wc_memberstack_id ON wellness_centers(memberstack_id);

-- 2. TABLA DE PAGOS (Beneficios Económicos)
-- Registra los pagos realizados por Pata Amiga al Centro de Bienestar
CREATE TABLE IF NOT EXISTS wellness_center_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellness_center_id UUID REFERENCES wellness_centers(id) ON DELETE CASCADE,
    solidarity_request_id UUID REFERENCES solidarity_requests(id) ON DELETE SET NULL,
    
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid'
    payment_reference VARCHAR(255), -- ID de transferencia o referencia bancaria
    
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_payments_center ON wellness_center_payments(wellness_center_id);
CREATE INDEX IF NOT EXISTS idx_wc_payments_request ON wellness_center_payments(solidarity_request_id);

-- 3. TABLA DE CITAS / PELUDOS ATENDIDOS
CREATE TABLE IF NOT EXISTS wellness_center_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellness_center_id UUID REFERENCES wellness_centers(id) ON DELETE CASCADE,
    solidarity_request_id UUID REFERENCES solidarity_requests(id) ON DELETE CASCADE,
    
    -- Vínculos directos para facilitar consultas
    pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
    member_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    appointment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
    
    -- Rechazo
    rejection_reason VARCHAR(100), -- 'no_availability', 'out_of_scope', 'other'
    rejection_details TEXT, -- Cuadro de texto para especificar
    
    -- Evidencia (opcional)
    evidence_url TEXT, -- Receta médica o foto de atención
    
    amount DECIMAL(10, 2), -- Monto a cobrar por este servicio
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_appointments_center ON wellness_center_appointments(wellness_center_id);
CREATE INDEX IF NOT EXISTS idx_wc_appointments_status ON wellness_center_appointments(status);
CREATE INDEX IF NOT EXISTS idx_wc_appointments_date ON wellness_center_appointments(appointment_date);

-- 4. POLÍTICAS RLS (Seguridad)
ALTER TABLE wellness_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_center_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_center_appointments ENABLE ROW LEVEL SECURITY;

-- Los centros pueden ver su propia información
CREATE POLICY "Wellness centers can view own profile" ON wellness_centers
    FOR SELECT TO authenticated USING (
        memberstack_id = auth.uid()::text
    );

-- Los centros pueden actualizar su propia información (solo campos permitidos)
CREATE POLICY "Wellness centers can update own profile" ON wellness_centers
    FOR UPDATE TO authenticated USING (
        memberstack_id = auth.uid()::text
    );

-- Los centros pueden ver sus propios pagos
CREATE POLICY "Wellness centers can view own payments" ON wellness_center_payments
    FOR SELECT TO authenticated USING (
        wellness_center_id IN (SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text)
    );

-- Los centros pueden ver sus propias citas
CREATE POLICY "Wellness centers can view own appointments" ON wellness_center_appointments
    FOR SELECT TO authenticated USING (
        wellness_center_id IN (SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text)
    );

-- Los centros pueden actualizar sus citas (para aceptar/rechazar/completar)
CREATE POLICY "Wellness centers can update own appointments" ON wellness_center_appointments
    FOR UPDATE TO authenticated USING (
        wellness_center_id IN (SELECT id FROM wellness_centers WHERE memberstack_id = auth.uid()::text)
    );

-- Service Role tiene acceso total
CREATE POLICY "Service role full access wellness_centers" ON wellness_centers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access wellness_center_payments" ON wellness_center_payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access wellness_center_appointments" ON wellness_center_appointments FOR ALL TO service_role USING (true);

-- 5. TRIGGER PARA ACTUALIZAR updated_at
CREATE TRIGGER update_wellness_centers_updated_at
    BEFORE UPDATE ON wellness_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_center_appointments_updated_at
    BEFORE UPDATE ON wellness_center_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
