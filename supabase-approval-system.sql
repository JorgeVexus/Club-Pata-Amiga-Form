-- =====================================================
-- ACTUALIZACIÓN: Sistema de Aprobación de Miembros
-- =====================================================
-- Este script agrega columnas para rastrear el proceso
-- de aprobación de miembros en Supabase
-- =====================================================

-- Agregar columnas de aprobación a la tabla users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS appealed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS appeal_message TEXT;

-- Crear índice para búsquedas por status
CREATE INDEX IF NOT EXISTS idx_users_approval_status 
ON public.users(approval_status);

-- Crear índice para búsquedas por fecha de envío
CREATE INDEX IF NOT EXISTS idx_users_submitted_at 
ON public.users(submitted_at DESC);

-- Comentarios para documentación
COMMENT ON COLUMN public.users.approval_status IS 'Estado de aprobación: pending, approved, rejected, appealed';
COMMENT ON COLUMN public.users.submitted_at IS 'Fecha en que se envió la solicitud';
COMMENT ON COLUMN public.users.approved_at IS 'Fecha en que se aprobó la solicitud';
COMMENT ON COLUMN public.users.approved_by IS 'ID del admin que aprobó';
COMMENT ON COLUMN public.users.rejected_at IS 'Fecha en que se rechazó la solicitud';
COMMENT ON COLUMN public.users.rejected_by IS 'ID del admin que rechazó';
COMMENT ON COLUMN public.users.rejection_reason IS 'Razón del rechazo';
COMMENT ON COLUMN public.users.appealed_at IS 'Fecha en que se apeló el rechazo';
COMMENT ON COLUMN public.users.appeal_message IS 'Mensaje de apelación del usuario';

-- Constraint para validar valores de approval_status
ALTER TABLE public.users
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'appealed'));

-- Función para actualizar timestamp automáticamente
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps automáticamente
DROP TRIGGER IF EXISTS trigger_update_approval_timestamp ON public.users;
CREATE TRIGGER trigger_update_approval_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_timestamp();

-- Vista para admins: solicitudes pendientes
CREATE OR REPLACE VIEW admin_pending_applications AS
SELECT 
    id,
    memberstack_id,
    first_name,
    last_name,
    email,
    phone,
    curp,
    submitted_at,
    approval_status,
    created_at
FROM public.users
WHERE approval_status = 'pending'
ORDER BY submitted_at DESC;

-- Vista para admins: apelaciones
CREATE OR REPLACE VIEW admin_appealed_applications AS
SELECT 
    id,
    memberstack_id,
    first_name,
    last_name,
    email,
    approval_status,
    rejected_at,
    rejected_by,
    rejection_reason,
    appealed_at,
    appeal_message
FROM public.users
WHERE approval_status = 'appealed'
ORDER BY appealed_at DESC;

-- Permisos para las vistas (ajustar según tus necesidades)
GRANT SELECT ON admin_pending_applications TO authenticated;
GRANT SELECT ON admin_appealed_applications TO authenticated;

-- =====================================================
-- FIN DE ACTUALIZACIÓN
-- =====================================================
