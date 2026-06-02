-- =====================================================
-- MIGRACIÓN: Agregar estado 'cancelled' y columna 'cancelled_at' a ambassadors
-- Fecha: 2026-06-01
-- =====================================================

-- 1. Eliminar la restricción de CHECK actual (que PostgreSQL autogenera como ambassadors_status_check o check_status)
ALTER TABLE public.ambassadors
DROP CONSTRAINT IF EXISTS ambassadors_status_check;

ALTER TABLE public.ambassadors
DROP CONSTRAINT IF EXISTS check_status;

-- 2. Agregar la nueva restricción que incluye 'cancelled'
ALTER TABLE public.ambassadors
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'cancelled'));

-- 3. Agregar la columna cancelled_at si no existe
ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 4. Comentarios de documentación
COMMENT ON COLUMN public.ambassadors.status IS 'Estado de aprobación o baja: pending, approved, rejected, suspended, cancelled';
COMMENT ON COLUMN public.ambassadors.cancelled_at IS 'Fecha y hora de la baja voluntaria del embajador';
