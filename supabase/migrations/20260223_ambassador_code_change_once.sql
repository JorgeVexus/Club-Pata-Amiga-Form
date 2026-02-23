-- ============================================
-- 🔄 Permitir cambio de código una sola vez
-- Fecha: 2026-02-23
-- ============================================

-- Agregar campo para controlar si puede cambiar el código
ALTER TABLE ambassadors 
    ADD COLUMN IF NOT EXISTS can_change_referral_code BOOLEAN DEFAULT false;

-- Agregar campo para trackear si ya se cambió el código
ALTER TABLE ambassadors 
    ADD COLUMN IF NOT EXISTS referral_code_changed_at TIMESTAMPTZ;

-- Agregar campo para guardar el código anterior
ALTER TABLE ambassadors 
    ADD COLUMN IF NOT EXISTS previous_referral_code TEXT;

-- ============================================
-- FUNCIÓN PARA CAMBIAR CÓDIGO (una sola vez)
-- ============================================
CREATE OR REPLACE FUNCTION change_ambassador_referral_code(
    p_ambassador_id UUID,
    p_new_code TEXT,
    p_confirmed BOOLEAN
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    old_code TEXT,
    new_code TEXT
) AS $$
DECLARE
    v_ambassador RECORD;
    v_clean_code TEXT;
BEGIN
    -- Normalizar código
    v_clean_code := UPPER(TRIM(p_new_code));
    
    -- Verificar que se confirmó
    IF NOT p_confirmed THEN
        RETURN QUERY SELECT false, 'Debes confirmar el cambio de código'::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Obtener embajador
    SELECT * INTO v_ambassador 
    FROM ambassadors 
    WHERE id = p_ambassador_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Embajador no encontrado'::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Verificar que tiene permiso para cambiar
    IF NOT v_ambassador.can_change_referral_code THEN
        RETURN QUERY SELECT false, 'No tienes permitido cambiar tu código'::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Verificar que no ha cambiado antes
    IF v_ambassador.referral_code_changed_at IS NOT NULL THEN
        RETURN QUERY SELECT false, 'Ya has cambiado tu código anteriormente'::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Verificar que el nuevo código es diferente al actual
    IF v_ambassador.referral_code = v_clean_code THEN
        RETURN QUERY SELECT false, 'El nuevo código debe ser diferente al actual'::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Guardar código anterior en historial
    INSERT INTO ambassador_referral_codes_history (
        code, 
        ambassador_id, 
        used_at
    ) VALUES (
        v_ambassador.referral_code,
        v_ambassador.id,
        NOW()
    );
    
    -- Actualizar embajador
    UPDATE ambassadors 
    SET 
        previous_referral_code = referral_code,
        referral_code = v_clean_code,
        referral_code_changed_at = NOW(),
        can_change_referral_code = false, -- Ya no puede cambiar más
        updated_at = NOW()
    WHERE id = p_ambassador_id;
    
    RETURN QUERY SELECT 
        true, 
        'Código cambiado exitosamente'::TEXT,
        v_ambassador.referral_code,
        v_clean_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRACIÓN: Permitir cambio a embajadores existentes
-- ============================================

-- Para embajadores existentes que tienen código activo, 
-- permitirles cambiar una vez
UPDATE ambassadors 
SET can_change_referral_code = true
WHERE status = 'approved' 
  AND referral_code IS NOT NULL 
  AND referral_code_status = 'active'
  AND referral_code_changed_at IS NULL;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON COLUMN ambassadors.can_change_referral_code IS 'Indica si el embajador puede cambiar su código una vez';
COMMENT ON COLUMN ambassadors.referral_code_changed_at IS 'Fecha cuando el embajador cambió su código';
COMMENT ON COLUMN ambassadors.previous_referral_code IS 'Código anterior antes del cambio';
COMMENT ON FUNCTION change_ambassador_referral_code IS 'Cambia el código de referido del embajador una sola vez';
