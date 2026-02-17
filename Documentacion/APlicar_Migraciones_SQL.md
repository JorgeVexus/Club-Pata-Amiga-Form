# Cómo Aplicar las Migraciones SQL en Supabase

## Método 1: SQL Editor de Supabase (Recomendado - Más fácil)

### Paso 1: Abrir SQL Editor
1. Ve a tu Dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a la sección **"SQL Editor"** en el menú lateral
4. Click en **"New query"**

### Paso 2: Ejecutar Primera Migración
Copia y pega el siguiente SQL:

```sql
-- =============================================
-- Migración: Sistema de Sesiones para Vet-Bot
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

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_token 
    ON public.vet_bot_sessions(token);

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_memberstack_id 
    ON public.vet_bot_sessions(memberstack_id);

CREATE INDEX IF NOT EXISTS idx_vet_bot_sessions_expires 
    ON public.vet_bot_sessions(expires_at) 
    WHERE expires_at < NOW();

ALTER TABLE public.vet_bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on vet_bot_sessions"
    ON public.vet_bot_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

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

CREATE OR REPLACE FUNCTION get_valid_vet_session(p_token VARCHAR)
RETURNS TABLE (
    id UUID,
    memberstack_id VARCHAR,
    email VARCHAR,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN
) AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION create_vet_session(
    p_memberstack_id VARCHAR,
    p_email VARCHAR,
    p_duration_hours INTEGER DEFAULT 2
)
RETURNS VARCHAR AS $$
DECLARE
    new_token VARCHAR(64);
BEGIN
    new_token := encode(gen_random_bytes(32), 'hex');
    
    UPDATE public.vet_bot_sessions
    SET is_active = FALSE
    WHERE memberstack_id = p_memberstack_id 
      AND is_active = TRUE;
    
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
        NOW() + (p_duration_hours || ' hours')::INTERVAL,
        NOW(),
        TRUE
    );
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Click en **"Run"** ▶️

### Paso 3: Ejecutar Segunda Migración
Nueva query, copia y pega:

```sql
-- =============================================
-- Migración: Códigos de Verificación para Vet-Bot
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

ALTER TABLE public.vet_bot_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on vet_bot_verification_codes"
    ON public.vet_bot_verification_codes
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION generate_vet_verification_code(
    p_user_id UUID,
    p_expiry_minutes INTEGER DEFAULT 30
)
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::INTEGER::TEXT, 6, '0');
        
        SELECT EXISTS(
            SELECT 1 FROM public.vet_bot_verification_codes 
            WHERE code = new_code 
            AND is_used = FALSE 
            AND expires_at > NOW()
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE public.vet_bot_verification_codes
    SET is_used = TRUE
    WHERE user_id = p_user_id 
      AND is_used = FALSE;
    
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
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
```

Click en **"Run"** ▶️

### Paso 4: Verificar
Ejecuta esta query para confirmar:

```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vet_bot_sessions', 'vet_bot_verification_codes');
```

Deberías ver ambas tablas listadas.

---

## Método 2: Supabase CLI (Si lo tienes instalado)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref tu-project-ref

# Aplicar migraciones
supabase db push
```

---

## Método 3: Script de PowerShell (Automático)

```powershell
# Configurar variables
$env:NEXT_PUBLIC_SUPABASE_URL = "https://hjvhntxjkuuobgfslzlf.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ejecutar script
.\scripts\apply-vet-bot-migrations.ps1
```

---

## ✅ Verificación Final

Después de aplicar las migraciones, ejecuta:

```sql
-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%vet%'
ORDER BY routine_name;
```

Deberías ver:
- **Tablas:** `vet_bot_sessions`, `vet_bot_verification_codes`
- **Funciones:** `cleanup_expired_vet_codes`, `cleanup_expired_vet_sessions`, `create_vet_session`, `generate_vet_verification_code`, `get_valid_vet_session`, `verify_vet_code`

---

## 🚀 Próximos Pasos

1. ✅ Migraciones aplicadas
2. ⏭️ Deploy a Vercel: `git push`
3. ⏭️ Instalar widget en Webflow
4. ⏭️ Coordinar con la agencia del bot

¿Necesitas ayuda con algún paso?
