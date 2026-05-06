-- =====================================================
-- MIGRACIÓN: Agregar estado 'cancelled' a approval_status
-- =====================================================

-- 1. Eliminar la restricción actual (si existe)
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS check_approval_status;

-- 2. Crear la nueva restricción incluyendo 'cancelled'
ALTER TABLE public.users
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'appealed', 'cancelled'));

-- 3. Actualizar el comentario de la columna
COMMENT ON COLUMN public.users.approval_status IS 'Estado de aprobación: pending, approved, rejected, appealed, cancelled';

-- 4. Opcional: Agregar función al trigger para guardar timestamp de cancelación
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.cancelled_at IS 'Fecha en que se canceló o desactivó la cuenta';

CREATE OR REPLACE FUNCTION update_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
        NEW.approved_at = NOW();
    END IF;
    
    IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
        NEW.rejected_at = NOW();
    END IF;
    
    IF NEW.approval_status = 'appealed' AND OLD.approval_status != 'appealed' THEN
        NEW.appealed_at = NOW();
    END IF;
    
    IF NEW.approval_status = 'cancelled' AND OLD.approval_status != 'cancelled' THEN
        NEW.cancelled_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
