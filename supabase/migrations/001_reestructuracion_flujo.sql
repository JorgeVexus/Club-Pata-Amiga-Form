-- ============================================================
-- MIGRACIÓN: Reestructuración del Flujo de Registro
-- Fecha: Febrero 2026
-- Objetivo: Reducir abandono del 15% optimizando flujo a 4-5 clicks
-- ============================================================

-- ============================================================
-- 1. NUEVAS COLUMNAS EN TABLA users
-- ============================================================

-- Nuevos campos para el contratante
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality_code VARCHAR(3); -- ISO 3166-1 alpha-3

-- Cambios en dirección (verificación de SEPOMEX)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sepomex_validated BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sepomex_last_query TIMESTAMP;

-- Campos de tracking del registro
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pre_payment_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_payment_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;

-- Campos rápidos de mascota (para tracking en Step 2)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_age_unit VARCHAR(10);

-- ============================================================
-- 2. NUEVAS COLUMNAS EN TABLA pets
-- ============================================================

-- Nuevos campos de color
ALTER TABLE pets ADD COLUMN IF NOT EXISTS coat_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS coat_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS nose_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS nose_color_code VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS eye_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS eye_color_code VARCHAR(50);

-- Campos modificados para edad
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age_unit VARCHAR(10) DEFAULT 'years'; -- 'years' o 'months'
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age_value INTEGER; -- Edad numérica separada

-- Campos para sistema de fotos con deadline
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photos_uploaded BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photos_upload_deadline TIMESTAMP;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photos_count INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;

-- Mascotas senior (10+ años)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_certificate_required BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_certificate_uploaded BOOLEAN DEFAULT false;

-- Para mestizos - historia de adopción
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS adoption_story TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_mixed_breed BOOLEAN DEFAULT false;

-- Tracking de completitud
ALTER TABLE pets ADD COLUMN IF NOT EXISTS basic_info_completed BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS complementary_info_completed BOOLEAN DEFAULT false;

-- Tipo de mascota
ALTER TABLE pets ADD COLUMN IF NOT EXISTS pet_type VARCHAR(20);
COMMENT ON COLUMN pets.pet_type IS 'Tipo de mascota: dog o cat';

-- ============================================================
-- 3. NUEVAS TABLAS DE CATÁLOGOS
-- ============================================================

-- Catálogo de nacionalidades
CREATE TABLE IF NOT EXISTS catalog_nationalities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colores de pelo (por tipo de mascota)
CREATE TABLE IF NOT EXISTS catalog_coat_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL, -- 'dog' o 'cat'
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_common BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colores de nariz
CREATE TABLE IF NOT EXISTS catalog_nose_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colores de ojos
CREATE TABLE IF NOT EXISTS catalog_eye_colors (
    id SERIAL PRIMARY KEY,
    pet_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Catálogo de colonias (cache de SEPOMEX)
CREATE TABLE IF NOT EXISTS catalog_sepomex (
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

CREATE INDEX IF NOT EXISTS idx_sepomex_cp ON catalog_sepomex(cp);
CREATE INDEX IF NOT EXISTS idx_sepomex_state ON catalog_sepomex(state);

-- ============================================================
-- 4. TABLA DE SEGUIMIENTO DE REGISTRO
-- ============================================================

CREATE TABLE IF NOT EXISTS registration_progress (
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

CREATE INDEX IF NOT EXISTS idx_reg_progress_user ON registration_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_progress_abandoned ON registration_progress(abandoned_at) WHERE abandoned_at IS NOT NULL;

-- ============================================================
-- 5. TABLA PARA TRACKING DE FOTOS PENDIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_photos_tracking (
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

CREATE INDEX IF NOT EXISTS idx_pending_photos_deadline ON pending_photos_tracking(deadline);
CREATE INDEX IF NOT EXISTS idx_pending_photos_completed ON pending_photos_tracking(completed);

-- ============================================================
-- 6. FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para registration_progress
DROP TRIGGER IF EXISTS update_registration_progress_updated_at ON registration_progress;
CREATE TRIGGER update_registration_progress_updated_at
    BEFORE UPDATE ON registration_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. DATOS INICIALES DE CATÁLOGOS
-- ============================================================

-- Nacionalidades principales
INSERT INTO catalog_nationalities (code, name_es, name_en, phone_code, display_order) VALUES
('MEX', 'México', 'Mexico', '+52', 1),
('USA', 'Estados Unidos', 'United States', '+1', 2),
('GTM', 'Guatemala', 'Guatemala', '+502', 3),
('COL', 'Colombia', 'Colombia', '+57', 4),
('VEN', 'Venezuela', 'Venezuela', '+58', 5),
('ARG', 'Argentina', 'Argentina', '+54', 6),
('ESP', 'España', 'Spain', '+34', 7),
('CHL', 'Chile', 'Chile', '+56', 8),
('PER', 'Perú', 'Peru', '+51', 9),
('CUB', 'Cuba', 'Cuba', '+53', 10),
('DOM', 'República Dominicana', 'Dominican Republic', '+1', 11),
('ECU', 'Ecuador', 'Ecuador', '+593', 12),
('BOL', 'Bolivia', 'Bolivia', '+591', 13),
('PRY', 'Paraguay', 'Paraguay', '+595', 14),
('URY', 'Uruguay', 'Uruguay', '+598', 15),
('BRA', 'Brasil', 'Brazil', '+55', 16),
('CAN', 'Canadá', 'Canada', '+1', 17),
('CHN', 'China', 'China', '+86', 18),
('JPN', 'Japón', 'Japan', '+81', 19),
('KOR', 'Corea del Sur', 'South Korea', '+82', 20)
ON CONFLICT (code) DO NOTHING;

-- Colores de pelo para PERROS
INSERT INTO catalog_coat_colors (pet_type, name, hex_code, is_common, display_order) VALUES
('dog', 'Negro', '#000000', true, 1),
('dog', 'Blanco', '#FFFFFF', true, 2),
('dog', 'Café/Marrón', '#8B4513', true, 3),
('dog', 'Rubio/Dorado', '#DAA520', true, 4),
('dog', 'Gris', '#808080', true, 5),
('dog', 'Rojo/Fire', '#B22222', false, 6),
('dog', 'Crema', '#FFFDD0', true, 7),
('dog', 'Plateado', '#C0C0C0', true, 8),
('dog', 'Manchado (blanco con negro)', '#FFFFFF', true, 9),
('dog', 'Tricolor', '#FFFFFF', true, 10),
('dog', 'Merle', '#808080', false, 11),
('dog', 'Atigrado', '#FFA500', false, 12),
('dog', 'Otro', '#CCCCCC', true, 99)
ON CONFLICT DO NOTHING;

-- Colores de pelo para GATOS
INSERT INTO catalog_coat_colors (pet_type, name, hex_code, is_common, display_order) VALUES
('cat', 'Negro', '#000000', true, 1),
('cat', 'Blanco', '#FFFFFF', true, 2),
('cat', 'Gris/Plata', '#C0C0C0', true, 3),
('cat', 'Naranja/Rojo', '#FFA500', true, 4),
('cat', 'Crema/Beige', '#F5F5DC', true, 5),
('cat', 'Café/Marrón', '#8B4513', false, 6),
('cat', 'Tricolor (Calicó)', '#FFFFFF', true, 7),
('cat', 'Carey (Tortuga)', '#000000', true, 8),
('cat', 'Tabby (Atigrado)', '#FFA500', true, 9),
('cat', 'Smoke', '#808080', false, 10),
('cat', 'Bicolor', '#FFFFFF', true, 11),
('cat', 'Otro', '#CCCCCC', true, 99)
ON CONFLICT DO NOTHING;

-- Colores de nariz para PERROS
INSERT INTO catalog_nose_colors (pet_type, name, hex_code, display_order) VALUES
('dog', 'Negra', '#000000', 1),
('dog', 'Rosa', '#FFB6C1', 2),
('dog', 'Marrón/Liver', '#8B4513', 3),
('dog', 'Azul/Gris', '#708090', 4),
('dog', 'Manzana (rosada con manchas)', '#FF69B4', 5),
('dog', 'Butterfly (mitad mitad)', '#FFB6C1', 6),
('dog', 'Dudley (falta de pigmento)', '#F5DEB3', 7)
ON CONFLICT DO NOTHING;

-- Colores de nariz para GATOS
INSERT INTO catalog_nose_colors (pet_type, name, hex_code, display_order) VALUES
('cat', 'Rosa', '#FFB6C1', 1),
('cat', 'Negro', '#000000', 2),
('cat', 'Marrón', '#8B4513', 3),
('cat', 'Naranja', '#FFA500', 4),
('cat', 'Coral', '#FF7F50', 5),
('cat', 'Multicolor', '#CCCCCC', 6)
ON CONFLICT DO NOTHING;

-- Colores de ojos para PERROS
INSERT INTO catalog_eye_colors (pet_type, name, hex_code, display_order) VALUES
('dog', 'Marrón oscuro', '#8B4513', 1),
('dog', 'Marrón claro/Ámbar', '#DAA520', 2),
('dog', 'Avellana', '#D2691E', 3),
('dog', 'Verde', '#228B22', 4),
('dog', 'Azul', '#4169E1', 5),
('dog', 'Heterocromía (uno de cada color)', '#CCCCCC', 6),
('dog', 'Gris', '#808080', 7)
ON CONFLICT DO NOTHING;

-- Colores de ojos para GATOS
INSERT INTO catalog_eye_colors (pet_type, name, hex_code, display_order) VALUES
('cat', 'Amarillo/Dorado', '#FFD700', 1),
('cat', 'Verde', '#228B22', 2),
('cat', 'Azul', '#4169E1', 3),
('cat', 'Cobre/Naranja', '#FF8C00', 4),
('cat', 'Heterocromía', '#CCCCCC', 5),
('cat', 'Avellana', '#D2691E', 6),
('cat', 'Dicromía (dos colores en un ojo)', '#CCCCCC', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. POLÍTICAS RLS PARA NUEVAS TABLAS
-- ============================================================

-- Habilitar RLS en tablas nuevas
ALTER TABLE catalog_nationalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_coat_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_nose_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_eye_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_sepomex ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_photos_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas para catálogos (lectura pública)
CREATE POLICY "Allow public read nationalities" ON catalog_nationalities
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read coat colors" ON catalog_coat_colors
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read nose colors" ON catalog_nose_colors
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read eye colors" ON catalog_eye_colors
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read sepomex" ON catalog_sepomex
    FOR SELECT TO public USING (true);

-- Políticas para registration_progress
CREATE POLICY "Users can view own progress" ON registration_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON registration_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Service role can manage progress" ON registration_progress
    FOR ALL TO service_role USING (true);

-- Políticas para pending_photos_tracking
CREATE POLICY "Users can view own pending photos" ON pending_photos_tracking
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Service role can manage pending photos" ON pending_photos_tracking
    FOR ALL TO service_role USING (true);

-- ============================================================
-- 9. COMENTARIOS DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE catalog_nationalities IS 'Catálogo de países para selección de nacionalidad';
COMMENT ON TABLE catalog_coat_colors IS 'Catálogo de colores de pelo por tipo de mascota';
COMMENT ON TABLE catalog_nose_colors IS 'Catálogo de colores de nariz por tipo de mascota';
COMMENT ON TABLE catalog_eye_colors IS 'Catálogo de colores de ojos por tipo de mascota';
COMMENT ON TABLE catalog_sepomex IS 'Cache de consultas SEPOMEX para códigos postales';
COMMENT ON TABLE registration_progress IS 'Tracking del progreso de registro de usuarios';
COMMENT ON TABLE pending_photos_tracking IS 'Seguimiento de fotos pendientes con deadline de 15 días';

-- ============================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================
