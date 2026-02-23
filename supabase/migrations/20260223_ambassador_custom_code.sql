-- ============================================
-- 🎯 Sistema de Códigos Personalizados para Embajadores
-- Fecha: 2026-02-23
-- ============================================

-- ============================================
-- 1. TABLA: Códigos Reservados/Blacklist
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_reserved_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- Código reservado en MAYÚSCULAS
    type TEXT NOT NULL CHECK (type IN ('blacklist', 'reserved', 'system')),
    reason TEXT, -- Razón de la reserva
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABLA: Códigos de Referido ya Usados
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_referral_codes_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- Código que fue usado
    ambassador_id UUID REFERENCES ambassadors(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ -- Si se libera el código
);

-- ============================================
-- 3. MODIFICAR TABLA AMBASSADORS
-- ============================================
-- El código de referido ahora puede ser NULL inicialmente
-- Se llenará después de que el embajador elija su código
ALTER TABLE ambassadors 
    ALTER COLUMN referral_code DROP NOT NULL;

-- Agregar campo para tracking del estado del código
ALTER TABLE ambassadors 
    ADD COLUMN IF NOT EXISTS referral_code_status TEXT DEFAULT 'pending' 
    CHECK (referral_code_status IN ('pending', 'active', 'inactive', 'changed'));

-- Agregar campo para tracking de cuando se eligió el código
ALTER TABLE ambassadors 
    ADD COLUMN IF NOT EXISTS referral_code_selected_at TIMESTAMPTZ;

-- ============================================
-- 4. INSERTAR BLACKLIST DE CÓDIGOS
-- ============================================
INSERT INTO ambassador_reserved_codes (code, type, reason) VALUES
    -- Términos administrativos/oficiales
    ('OFICIAL', 'blacklist', 'Término administrativo reservado'),
    ('ADMIN', 'blacklist', 'Término administrativo reservado'),
    ('SOPORTE', 'blacklist', 'Término administrativo reservado'),
    ('STAFF', 'blacklist', 'Término administrativo reservado'),
    ('TEAM', 'blacklist', 'Término administrativo reservado'),
    ('OWNER', 'blacklist', 'Término administrativo reservado'),
    ('CEO', 'blacklist', 'Término administrativo reservado'),
    ('GERENTE', 'blacklist', 'Término administrativo reservado'),
    ('FUNDADOR', 'blacklist', 'Término administrativo reservado'),
    ('DIRECTOR', 'blacklist', 'Término administrativo reservado'),
    ('AYUDA', 'blacklist', 'Término administrativo reservado'),
    ('HELP', 'blacklist', 'Término administrativo reservado'),
    ('HQ', 'blacklist', 'Término administrativo reservado'),
    ('MARCA', 'blacklist', 'Término administrativo reservado'),
    
    -- Términos promocionales/comerciales
    ('DESCUENTO', 'blacklist', 'Término promocional reservado'),
    ('GRATIS', 'blacklist', 'Término promocional reservado'),
    ('FREE', 'blacklist', 'Término promocional reservado'),
    ('PROMO', 'blacklist', 'Término promocional reservado'),
    ('PROMOCION', 'blacklist', 'Término promocional reservado'),
    ('SALE', 'blacklist', 'Término promocional reservado'),
    ('CUPON', 'blacklist', 'Término promocional reservado'),
    ('CUPON', 'blacklist', 'Término promocional reservado'),
    ('OFERTA', 'blacklist', 'Término promocional reservado'),
    ('BONO', 'blacklist', 'Término promocional reservado'),
    ('REGALO', 'blacklist', 'Término promocional reservado'),
    ('GARANTIA', 'blacklist', 'Término promocional reservado'),
    ('CASH', 'blacklist', 'Término promocional reservado'),
    ('DINERO', 'blacklist', 'Término promocional reservado'),
    ('REEMBOLSO', 'blacklist', 'Término promocional reservado'),
    ('MONEY', 'blacklist', 'Término promocional reservado'),
    ('DEAL', 'blacklist', 'Término promocional reservado'),
    
    -- Términos de riesgo/seguridad
    ('TEST', 'blacklist', 'Término de prueba reservado'),
    ('PRUEBA', 'blacklist', 'Término de prueba reservado'),
    ('HACK', 'blacklist', 'Término de seguridad bloqueado'),
    ('FAKE', 'blacklist', 'Término de seguridad bloqueado'),
    ('SCAM', 'blacklist', 'Término de seguridad bloqueado'),
    ('FRAUDE', 'blacklist', 'Término de seguridad bloqueado'),
    ('FRAUD', 'blacklist', 'Término de seguridad bloqueado'),
    ('SEGuro', 'blacklist', 'Término comercial reservado'),
    
    -- Códigos PATA estratégicos (marca)
    ('PATA', 'reserved', 'Código principal de marca'),
    ('PATITA', 'reserved', 'Variante de marca'),
    ('PATITAS', 'reserved', 'Variante de marca'),
    ('PATAMIGA', 'reserved', 'Nombre del club'),
    ('CLUBPATA', 'reserved', 'Nombre del club'),
    ('CLUB', 'reserved', 'Término principal'),
    ('VIP', 'reserved', 'Término premium'),
    ('PATAVIP', 'reserved', 'Código estratégico de marca'),
    ('PATASTORE', 'reserved', 'Código estratégico de marca'),
    ('PATAPROMO', 'reserved', 'Código estratégico de marca'),
    ('PATAGLOBAL', 'reserved', 'Código estratégico de marca'),
    ('PATAADMIN', 'reserved', 'Código estratégico de marca'),
    ('PATASTAFF', 'reserved', 'Código estratégico de marca'),
    ('PATAHELP', 'reserved', 'Código estratégico de marca'),
    ('PATATEAM', 'reserved', 'Código estratégico de marca'),
    ('PATAHQ', 'reserved', 'Código estratégico de marca'),
    ('PATAMARCA', 'reserved', 'Código estratégico de marca'),
    ('PATASHOP', 'reserved', 'Código estratégico de marca'),
    ('PATACLUB', 'reserved', 'Código estratégico de marca'),
    ('PATAPATITA', 'reserved', 'Código estratégico de marca'),
    ('PATADRAPATI', 'reserved', 'Código estratégico de marca'),
    ('PATAPRINCIPAL', 'reserved', 'Código estratégico de marca'),
    ('PATASALE', 'reserved', 'Código estratégico de marca'),
    ('PATADEAL', 'reserved', 'Código estratégico de marca'),
    ('PATACUPON', 'reserved', 'Código estratégico de marca'),
    ('PATAXMAS', 'reserved', 'Código estratégico de marca'),
    ('PATASPRING', 'reserved', 'Código estratégico de marca'),
    ('PATA2024', 'reserved', 'Código estratégico de marca'),
    ('PATA2025', 'reserved', 'Código estratégico de marca'),
    ('PATA2026', 'reserved', 'Código estratégico de marca'),
    ('PATA2027', 'reserved', 'Código estratégico de marca'),
    ('PATAEVENTO', 'reserved', 'Código estratégico de marca'),
    ('PATANEWYEAR', 'reserved', 'Código estratégico de marca'),
    ('PATACEO', 'reserved', 'Código estratégico de marca'),
    ('PATADIRECTOR', 'reserved', 'Código estratégico de marca'),
    ('PATAGERENTE', 'reserved', 'Código estratégico de marca'),
    ('PATAAYUDA', 'reserved', 'Código estratégico de marca'),
    ('PATAFUNDADOR', 'reserved', 'Código estratégico de marca'),
    ('PATAEMBAJADOR', 'reserved', 'Código estratégico de marca'),
    ('EMBAJADOR', 'reserved', 'Código estratégico'),
    ('EMBAJADORES', 'reserved', 'Código estratégico')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 5. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reserved_codes_type ON ambassador_reserved_codes(type);
CREATE INDEX IF NOT EXISTS idx_reserved_codes_code ON ambassador_reserved_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_history_code ON ambassador_referral_codes_history(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_history_ambassador ON ambassador_referral_codes_history(ambassador_id);

-- ============================================
-- 6. FUNCIÓN PARA VALIDAR CÓDIGO
-- ============================================
CREATE OR REPLACE FUNCTION validate_referral_code(p_code TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    suggestions JSONB
) AS $$
DECLARE
    v_clean_code TEXT;
    v_is_valid BOOLEAN := TRUE;
    v_error_message TEXT := '';
    v_suggestions JSONB := '[]'::JSONB;
    v_suggestion TEXT;
    v_counter INT;
BEGIN
    -- Limpiar y normalizar el código
    v_clean_code := UPPER(TRIM(p_code));
    
    -- Validar longitud
    IF LENGTH(v_clean_code) < 2 THEN
        v_is_valid := FALSE;
        v_error_message := 'El código debe tener al menos 2 caracteres';
    ELSIF LENGTH(v_clean_code) > 8 THEN
        v_is_valid := FALSE;
        v_error_message := 'El código debe tener máximo 8 caracteres';
    END IF;
    
    -- Validar caracteres permitidos (solo A-Z, 0-9)
    IF v_clean_code !~ '^[A-Z0-9]+$' THEN
        v_is_valid := FALSE;
        v_error_message := 'Solo se permiten letras (A-Z) y números (0-9)';
    END IF;
    
    -- Validar letras confusas (O, I, L)
    IF v_clean_code ~ '[OIL]' THEN
        v_is_valid := FALSE;
        v_error_message := 'Evita usar O (cero), I (uno) o L para prevenir confusiones';
    END IF;
    
    -- Verificar blacklist
    IF EXISTS (SELECT 1 FROM ambassador_reserved_codes WHERE code = v_clean_code AND type IN ('blacklist', 'reserved')) THEN
        v_is_valid := FALSE;
        v_error_message := 'Este código no está disponible';
    END IF;
    
    -- Verificar si ya está en uso
    IF EXISTS (SELECT 1 FROM ambassadors WHERE referral_code = v_clean_code) THEN
        v_is_valid := FALSE;
        v_error_message := 'Este código ya está en uso';
        
        -- Generar sugerencias
        FOR v_counter IN 1..5 LOOP
            v_suggestion := v_clean_code || (FLOOR(RANDOM() * 99) + 1)::TEXT;
            IF LENGTH(v_suggestion) <= 8 AND NOT EXISTS (SELECT 1 FROM ambassadors WHERE referral_code = v_suggestion) THEN
                v_suggestions := v_suggestions || to_jsonb(v_suggestion);
            END IF;
        END LOOP;
        
        -- Si no hay suficientes con números, intentar con prefijo
        IF jsonb_array_length(v_suggestions) < 3 THEN
            FOR v_counter IN 1..3 LOOP
                v_suggestion := 'P' || v_clean_code || (FLOOR(RANDOM() * 9) + 1)::TEXT;
                IF LENGTH(v_suggestion) <= 8 AND NOT EXISTS (SELECT 1 FROM ambassadors WHERE referral_code = v_suggestion) THEN
                    v_suggestions := v_suggestions || to_jsonb(v_suggestion);
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN QUERY SELECT v_is_valid, v_error_message, v_suggestions;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCIÓN PARA GENERAR CÓDIGO TEMPORAL
-- ============================================
CREATE OR REPLACE FUNCTION generate_temp_referral_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generar código temporal único (TMP + 5 caracteres aleatorios)
        v_code := 'TMP' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 5));
        
        -- Verificar que no exista
        SELECT EXISTS(SELECT 1 FROM ambassadors WHERE referral_code = v_code) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. RLS
-- ============================================
ALTER TABLE ambassador_reserved_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_referral_codes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage reserved codes"
    ON ambassador_reserved_codes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can manage codes history"
    ON ambassador_referral_codes_history FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 9. COMENTARIOS
-- ============================================
COMMENT ON TABLE ambassador_reserved_codes IS 'Códigos de referido reservados o bloqueados';
COMMENT ON TABLE ambassador_referral_codes_history IS 'Histórico de códigos de referido usados';
COMMENT ON FUNCTION validate_referral_code IS 'Valida un código de referido según las reglas del negocio';
COMMENT ON FUNCTION generate_temp_referral_code IS 'Genera un código temporal único para embajadores pendientes';
