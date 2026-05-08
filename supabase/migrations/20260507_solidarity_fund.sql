-- ============================================================
-- MIGRACIÓN: Sistema de Fondo Solidario
-- Fecha: Mayo 2026
-- Objetivo: Implementar solicitudes de apoyo, reembolsos y chat
-- ============================================================

-- 1. TABLA DE SOLICITUDES DEL FONDO SOLIDARIO
CREATE TABLE IF NOT EXISTS solidarity_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    
    -- Información de la solicitud
    type VARCHAR(50) NOT NULL, -- 'reimbursement', 'allied_center_appointment'
    benefit_type VARCHAR(50) NOT NULL, -- 'medical_emergency', 'annual_vaccination', 'death'
    
    -- Estado de la solicitud
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_review', 'needs_info', 'approved', 'rejected', 'completed'
    
    -- Detalles financieros
    requested_amount DECIMAL(10, 2),
    approved_amount DECIMAL(10, 2),
    
    -- Detalles de la cita (opcional, para centros aliados)
    case_title VARCHAR(200),
    case_description TEXT,
    incident_date DATE,
    preferred_appointment_date TIMESTAMP WITH TIME ZONE,
    allied_center_id VARCHAR(100), -- ID del centro veterinario
    
    -- Chat / Notas internas
    admin_notes TEXT,
    last_admin_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexar para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_solidarity_user ON solidarity_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_solidarity_pet ON solidarity_requests(pet_id);
CREATE INDEX IF NOT EXISTS idx_solidarity_status ON solidarity_requests(status);

-- 2. TABLA DE DOCUMENTOS DEL FONDO SOLIDARIO
CREATE TABLE IF NOT EXISTS solidarity_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES solidarity_requests(id) ON DELETE CASCADE,
    
    -- Información del archivo
    document_type VARCHAR(50) NOT NULL, -- 'evidence_photo', 'prescription', 'receipt'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solidarity_docs_request ON solidarity_documents(request_id);

-- 3. POLÍTICAS RLS (Seguridad)
ALTER TABLE solidarity_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE solidarity_documents ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view own solidarity requests" ON solidarity_requests
    FOR SELECT TO authenticated USING (
        user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
    );

-- Usuarios pueden crear sus propias solicitudes
CREATE POLICY "Users can create own solidarity requests" ON solidarity_requests
    FOR INSERT TO authenticated WITH CHECK (
        user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
    );

-- Usuarios pueden actualizar sus propias solicitudes (solo si están en estado editable)
CREATE POLICY "Users can update own solidarity requests" ON solidarity_requests
    FOR UPDATE TO authenticated USING (
        user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
        AND status IN ('new', 'needs_info')
    );

-- Documentos siguen la misma lógica
CREATE POLICY "Users can view own solidarity documents" ON solidarity_documents
    FOR SELECT TO authenticated USING (
        request_id IN (
            SELECT id FROM solidarity_requests 
            WHERE user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can upload own solidarity documents" ON solidarity_documents
    FOR INSERT TO authenticated WITH CHECK (
        request_id IN (
            SELECT id FROM solidarity_requests 
            WHERE user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
        )
    );

-- Service Role tiene acceso total para el dashboard admin
CREATE POLICY "Service role full access solidarity_requests" ON solidarity_requests
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access solidarity_documents" ON solidarity_documents
    FOR ALL TO service_role USING (true);

-- 4. BUCKET DE STORAGE (Comentado para ejecución manual o vía script de setup)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('solidarity-documents', 'solidarity-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']);

-- 5. TRIGGER PARA ACTUALIZAR updated_at
CREATE TRIGGER update_solidarity_requests_updated_at
    BEFORE UPDATE ON solidarity_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
