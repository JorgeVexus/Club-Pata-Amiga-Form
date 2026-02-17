# Fix para Error SQL: "functions in index predicate must be marked IMMUTABLE"

## Problema
El error ocurre porque PostgreSQL no permite usar `NOW()` en la cláusula `WHERE` de un índice, ya que `NOW()` no es una función `IMMUTABLE` (su valor cambia con el tiempo).

## Solución: SQL Corregido

Copia y pega este SQL en el Editor de Supabase:

```sql
-- =============================================
-- MIGRACIÓN 1: Tokens de Sesión (CORREGIDA)
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

-- Índices sin funciones volátiles en WHERE
CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_token ON public.vet_bot_sessions(token);
CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_memberstack_id ON public.vet_bot_sessions(memberstack_id);
CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_expires ON public.vet_bot_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_active ON public.vet_bot_sessions(is_active, expires_at);

ALTER TABLE public.vet_bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on vet_bot_sessions"
    ON public.vet_bot_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION get_valid_vet_session(p_token VARCHAR)
RETURNS TABLE (id UUID, memberstack_id VARCHAR, email VARCHAR, expires_at TIMESTAMPTZ, is_valid BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.vet_bot_sessions SET last_used_at = NOW()
    WHERE token = p_token AND expires_at > NOW() AND is_active = TRUE
    RETURNING vet_bot_sessions.id, vet_bot_sessions.memberstack_id, vet_bot_sessions.email, vet_bot_sessions.expires_at, TRUE as is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRACIÓN 2: Códigos de Verificación (CORREGIDA)
-- =============================================
CREATE TABLE IF NOT EXISTS public.vet_bot_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    CONSTRAINT valid_code_format CHECK (code ~ '^[0-9]{6}$')
);

-- Índices sin funciones volátiles en WHERE
CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_code ON public.vet_bot_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_user_id ON public.vet_bot_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_expires ON public.vet_bot_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_vet_bot_codes_used ON public.vet_bot_verification_codes(is_used, expires_at);

ALTER TABLE public.vet_bot_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on vet_bot_verification_codes"
    ON public.vet_bot_verification_codes FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION generate_vet_verification_code(p_user_id UUID, p_expiry_minutes INTEGER DEFAULT 30)
RETURNS VARCHAR(6) AS $$
DECLARE 
    new_code VARCHAR(6); 
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::INTEGER::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.vet_bot_verification_codes 
                     WHERE code = new_code AND is_used = FALSE AND expires_at > NOW()) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE public.vet_bot_verification_codes SET is_used = TRUE WHERE user_id = p_user_id AND is_used = FALSE;
    
    INSERT INTO public.vet_bot_verification_codes (user_id, code, expires_at, is_used)
    VALUES (p_user_id, new_code, NOW() + (p_expiry_minutes || ' minutes')::INTERVAL, FALSE);
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MENSAJE DE ÉXITO
-- =============================================
SELECT 'Migraciones aplicadas exitosamente!' as status;
```

## Cambios Realizados

### Antes (causaba error):
```sql
CREATE INDEX ... WHERE expires_at < NOW();  -- ❌ NOW() no es IMMUTABLE
```

### Después (funciona):
```sql
CREATE INDEX idx_vet_bot_sessions_expires ON public.vet_bot_sessions(expires_at);  -- ✅ Simple
CREATE INDEX idx_vet_bot_sessions_active ON public.vet_bot_sessions(is_active, expires_at);  -- ✅ Compuesto
```

## Por qué funciona esto

- Los **índices parciales** (con `WHERE`) solo pueden usar funciones `IMMUTABLE` (cuyo resultado no cambia)
- `NOW()` es `STABLE` (puede cambiar dentro de una transacción)
- La solución es crear índices en las columnas y dejar que las queries usen esos índices con condiciones normales

## Verificación

Después de ejecutar, prueba:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'vet_bot_%';
```

Debe retornar:
- `vet_bot_sessions`
- `vet_bot_verification_codes`
