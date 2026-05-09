-- ============================================================
-- MIGRACIÓN: Extensión de Campos de Fondo Solidario
-- Fecha: 9 de Mayo, 2026
-- Objetivo: Soportar campos de emergencias médicas y asegurar bucket
-- ============================================================

-- 1. ASEGURAR BUCKET DE STORAGE
-- Nota: Esto asume que la extensión de storage está habilitada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('solidarity-documents', 'solidarity-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. AGREGAR NUEVOS CAMPOS A solidarity_requests
ALTER TABLE solidarity_requests 
ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS clinic_postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS clinic_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS vet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS vet_license VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_appointment_time VARCHAR(50);

-- 4. TABLA DE CENTROS ALIADOS
CREATE TABLE IF NOT EXISTS allied_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar centros iniciales
INSERT INTO allied_centers (name, city, state, is_active)
VALUES 
('Hospital Veterinario Pata Amiga Centro', 'CDMX', 'CDMX', true),
('Clínica ProPet', 'CDMX', 'CDMX', true)
ON CONFLICT DO NOTHING;

-- 5. SEGURIDAD (RLS)
ALTER TABLE allied_centers ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de centros (necesario para el widget)
CREATE POLICY "Centros aliados son visibles para todos" ON allied_centers
    FOR SELECT USING (is_active = true);

-- Service Role tiene acceso total
CREATE POLICY "Service role full access allied_centers" ON allied_centers
    FOR ALL TO service_role USING (true);

-- 6. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON COLUMN solidarity_requests.total_paid_amount IS 'Monto total pagado a la clínica en reembolsos';
COMMENT ON COLUMN solidarity_requests.clinic_name IS 'Nombre de la veterinaria donde se atendió la emergencia';
COMMENT ON COLUMN solidarity_requests.vet_name IS 'Nombre del médico veterinario que atendió';
COMMENT ON COLUMN solidarity_requests.vet_license IS 'Cédula profesional del médico veterinario';
