-- ============================================
-- 🎯 Migración: Fix Documentos de Embajadores y Recuperación
-- Fecha: 2026-02-21
-- Propósito: Agregar columnas de URLs y flagged para recuperación
-- ============================================

-- 1. Agregar columnas ine_front_url y ine_back_url (si no existen de migración previa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ambassadors' AND column_name = 'ine_front_url') THEN
        ALTER TABLE public.ambassadors ADD COLUMN ine_front_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ambassadors' AND column_name = 'ine_back_url') THEN
        ALTER TABLE public.ambassadors ADD COLUMN ine_back_url TEXT;
    END IF;

    -- 2. Agregar bandera para requerir re-carga
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ambassadors' AND column_name = 'needs_ine_reupload') THEN
        ALTER TABLE public.ambassadors ADD COLUMN needs_ine_reupload BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Marcar a los embajadores registrados hasta hoy que no tienen documentos
-- Como se perdieron todos los recientes, marcamos a todos los que tengan URLs nulas o vacías
UPDATE public.ambassadors 
SET needs_ine_reupload = TRUE 
WHERE (ine_front_url IS NULL OR ine_front_url = '') 
  OR (ine_back_url IS NULL OR ine_back_url = '');

-- Comentar columnas para claridad
COMMENT ON COLUMN public.ambassadors.ine_front_url IS 'URL del frente de la INE';
COMMENT ON COLUMN public.ambassadors.ine_back_url IS 'URL del reverso de la INE';
COMMENT ON COLUMN public.ambassadors.needs_ine_reupload IS 'Bandera que indica si el embajador debe subir su INE nuevamente por error en sistema';
