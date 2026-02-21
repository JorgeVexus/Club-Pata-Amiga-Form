-- ============================================
-- 🎯 Migración: Agregar URLs de INE a tabla ambassadors
-- Fecha: 2026-02-21
-- Propósito: Agregar columnas para almacenar URLs de INE
-- ============================================

-- Agregar columna ine_front_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ambassadors' 
        AND column_name = 'ine_front_url'
    ) THEN
        ALTER TABLE public.ambassadors ADD COLUMN ine_front_url TEXT;
        COMMENT ON COLUMN public.ambassadors.ine_front_url IS 'URL del frente de la INE';
        RAISE NOTICE 'Columna ine_front_url agregada';
    ELSE
        RAISE NOTICE 'Columna ine_front_url ya existe';
    END IF;
END $$;

-- Agregar columna ine_back_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ambassadors' 
        AND column_name = 'ine_back_url'
    ) THEN
        ALTER TABLE public.ambassadors ADD COLUMN ine_back_url TEXT;
        COMMENT ON COLUMN public.ambassadors.ine_back_url IS 'URL del reverso de la INE';
        RAISE NOTICE 'Columna ine_back_url agregada';
    ELSE
        RAISE NOTICE 'Columna ine_back_url ya existe';
    END IF;
END $$;

-- Verificar que las columnas existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ambassadors' 
AND column_name IN ('ine_front_url', 'ine_back_url');
