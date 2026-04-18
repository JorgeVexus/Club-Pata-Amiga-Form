-- Migration: Remove RUAC column from pets table
-- Date: 2026-04-18
-- Description: The RUAC system is no longer used for waiting period reductions and has been deprecated.

ALTER TABLE IF EXISTS public.pets 
DROP COLUMN IF EXISTS ruac;

-- Update types if necessary (though usually handled at ORM/app level)
-- COMMENT ON TABLE public.pets IS 'Tabla de mascotas (RUAC deprecado y removido)';
