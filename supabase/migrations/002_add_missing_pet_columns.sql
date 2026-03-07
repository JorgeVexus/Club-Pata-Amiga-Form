-- ===========================================
-- Migración: Agregar columnas faltantes a pets
-- Fecha: 07 Marzo 2026
-- Descripción: Agrega columnas del registro-v2
-- que se usan en el widget de pet-cards y el
-- flujo de registro.
-- ===========================================

-- Tipo de mascota (dog/cat)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS pet_type VARCHAR(20);

-- Sexo (macho/hembra)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Mestizo
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_mixed_breed BOOLEAN DEFAULT false;

-- Adoptado
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN DEFAULT false;

-- Historia de adopción
ALTER TABLE pets ADD COLUMN IF NOT EXISTS adoption_story TEXT;

-- Senior
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT false;

-- Colores
ALTER TABLE pets ADD COLUMN IF NOT EXISTS coat_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS nose_color VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS eye_color VARCHAR(100);

-- Edad con unidad
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age_value INTEGER;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age_unit VARCHAR(10) DEFAULT 'years';

-- Foto principal (usado en registro-v2)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;

-- Tracking de completitud
ALTER TABLE pets ADD COLUMN IF NOT EXISTS basic_info_completed BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS complementary_info_completed BOOLEAN DEFAULT false;

-- Notas del admin (si no existe)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ===========================================
-- Verificación
-- ===========================================
-- Ejecutar después para confirmar:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pets' ORDER BY ordinal_position;
