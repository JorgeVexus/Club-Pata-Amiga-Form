-- =============================================
-- Migración: Códigos de Verificación para Vet-Bot
-- Fecha: 2026-02-17
-- Objetivo: Sistema alternativo de identificación vía código de 6 dígitos
-- =============================================

-- =============================================
-- TABLA: vet_bot_verification_codes
-- Almacena códigos temporales de 6 dígitos para identificación
-- =============================================
CREATE TABLE IF NOT EXISTS public.vet_bot_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    
    -- Asegurar que los códigos sean únicos y no reutilizables
    CONSTRAINT valid_code_format CHECK (code ~ '^[0-9]{6}$')
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_code 
    ON public.vet_bot_verification_codes(code);

CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_user_id 
    ON public.vet_bot_verification_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_expires 
    ON public.vet_bot_verification_codes(expires_at) 
    WHERE expires_at < NOW();

CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_active 
    ON public.vet_bot_verification_codes(code, is_used, expires_at) 
    WHERE is_used = FALSE AND expires_at > NOW();

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE public.vet_bot_verification_codes ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede gestionar códigos
CREATE POLICY "Service role full access on vet_bot_verification_codes"
    ON public.vet_bot_verification_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- FUNCIÓN: Generar código de verificación
-- =============================================
CREATE OR REPLACE FUNCTION generate_vet_verification_code(
    p_user_id UUID,
    p_expiry_minutes INTEGER DEFAULT 30
)
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    -- Generar código aleatorio de 6 dígitos
    LOOP
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::INTEGER::TEXT, 6, '0');
        
        -- Verificar que no exista
        SELECT EXISTS(
            SELECT 1 FROM public.vet_bot_verification_codes 
            WHERE code = new_code 
            AND is_used = FALSE 
            AND expires_at > NOW()
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Invalidar códigos anteriores del mismo usuario
    UPDATE public.vet_bot_verification_codes
    SET is_used = TRUE
    WHERE user_id = p_user_id 
      AND is_used = FALSE;
    
    -- Insertar nuevo código
    INSERT INTO public.vet_bot_verification_codes (
        user_id,
        code,
        expires_at,
        is_used
    ) VALUES (
        p_user_id,
        new_code,
        NOW() + (p_expiry_minutes || ' minutes')::INTERVAL,
        FALSE
    );
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Validar código de verificación
-- =============================================
CREATE OR REPLACE FUNCTION verify_vet_code(p_code VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    user_id UUID,
    code_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH updated AS (
        UPDATE public.vet_bot_verification_codes
        SET is_used = TRUE, used_at = NOW()
        WHERE code = p_code
          AND is_used = FALSE
          AND expires_at > NOW()
        RETURNING id, user_id
    )
    SELECT 
        TRUE as is_valid,
        updated.user_id,
        updated.id as code_id
    FROM updated;
    
    -- Si no se actualizó nada, retornar falso
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Limpiar códigos expirados
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_vet_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.vet_bot_verification_codes 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON TABLE public.vet_bot_verification_codes IS 
    'Códigos de verificación temporales de 6 dígitos para identificación en Vet-Bot';

COMMENT ON COLUMN public.vet_bot_verification_codes.code IS 
    'Código numérico de 6 dígitos (ej: 123456)';

COMMENT ON FUNCTION generate_vet_verification_code IS 
    'Genera un nuevo código de verificación único para un usuario';

COMMENT ON FUNCTION verify_vet_code IS 
    'Valida un código de verificación y lo marca como usado';
