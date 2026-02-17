-- =============================================
-- Migración: Sistema de Sesiones para Vet-Bot
-- Fecha: 2026-02-17
-- Objetivo: Permitir identificación automática de usuarios
-- =============================================

-- =============================================
-- TABLA: vet_bot_sessions
-- Almacena tokens de sesión temporales para autenticación del bot
-- =============================================
CREATE TABLE IF NOT EXISTS public.vet_bot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memberstack_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_token 
    ON public.vet_bot_sessions(token);

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_memberstack_id 
    ON public.vet_bot_sessions(memberstack_id);

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_expires 
    ON public.vet_bot_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_active 
    ON public.vet_bot_sessions(is_active, expires_at);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE public.vet_bot_sessions ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede gestionar sesiones
CREATE POLICY "Service role full access on vet_bot_sessions"
    ON public.vet_bot_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- FUNCIÓN: Limpiar sesiones expiradas
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_vet_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.vet_bot_sessions 
    WHERE expires_at < NOW() 
       OR (last_used_at IS NOT NULL AND last_used_at < NOW() - INTERVAL '24 hours')
       OR (last_used_at IS NULL AND created_at < NOW() - INTERVAL '24 hours');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Validar y obtener sesión por token
-- =============================================
CREATE OR REPLACE FUNCTION get_valid_vet_session(p_token VARCHAR)
RETURNS TABLE (
    id UUID,
    memberstack_id VARCHAR,
    email VARCHAR,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN
) AS $$
BEGIN
    -- Actualizar last_used_at y retornar datos
    RETURN QUERY
    UPDATE public.vet_bot_sessions
    SET last_used_at = NOW()
    WHERE token = p_token
      AND expires_at > NOW()
      AND is_active = TRUE
    RETURNING 
        vet_bot_sessions.id,
        vet_bot_sessions.memberstack_id,
        vet_bot_sessions.email,
        vet_bot_sessions.expires_at,
        TRUE as is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Crear nueva sesión
-- =============================================
CREATE OR REPLACE FUNCTION create_vet_session(
    p_memberstack_id VARCHAR,
    p_email VARCHAR,
    p_duration_hours INTEGER DEFAULT 2
)
RETURNS VARCHAR AS $$
DECLARE
    new_token VARCHAR(64);
    new_expires_at TIMESTAMPTZ;
BEGIN
    -- Generar token aleatorio
    new_token := encode(gen_random_bytes(32), 'hex');
    new_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
    
    -- Desactivar sesiones previas del mismo usuario
    UPDATE public.vet_bot_sessions
    SET is_active = FALSE
    WHERE memberstack_id = p_memberstack_id 
      AND is_active = TRUE;
    
    -- Insertar nueva sesión
    INSERT INTO public.vet_bot_sessions (
        memberstack_id,
        email,
        token,
        expires_at,
        created_at,
        is_active
    ) VALUES (
        p_memberstack_id,
        LOWER(TRIM(p_email)),
        new_token,
        new_expires_at,
        NOW(),
        TRUE
    );
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.vet_bot_sessions IS 'Tokens de sesión temporales para autenticación automática del Vet-Bot';
COMMENT ON COLUMN public.vet_bot_sessions.token IS 'Token único de 64 caracteres hex generado aleatoriamente';
COMMENT ON COLUMN public.vet_bot_sessions.expires_at IS 'Fecha de expiración del token (default 2 horas)';
COMMENT ON COLUMN public.vet_bot_sessions.last_used_at IS 'Última vez que el token fue usado para identificar al usuario';

-- =============================================
-- LIMPIEZA INICIAL (opcional)
-- =============================================
-- SELECT cleanup_expired_vet_sessions();
