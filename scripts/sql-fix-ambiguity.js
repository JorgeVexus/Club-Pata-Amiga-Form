const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSqlAmbiguity() {
    console.log('🛠️ Aplicando fix de ambigüedad SQL a get_valid_vet_session...');

    // Vamos a redefinir la función calificando explícitamente las columnas de la tabla
    const sqlFix = `
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
        UPDATE public.vet_bot_sessions s
        SET last_used_at = NOW()
        WHERE s.token = p_token
          AND s.expires_at > NOW()
          AND s.is_active = TRUE
        RETURNING 
            s.id,
            s.memberstack_id,
            s.email,
            s.expires_at,
            TRUE as is_valid;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Intentar ejecutar el SQL via RPC si existe un helper de sql, o mediante un truco de consulta
    // Como no tenemos un endpoint de 'sql' directo, usaremos el mismo error que vimos antes para confirmar
    // Pero espera, puedo simplemente informar al usuario o intentar un truco de migrations si tiene acceso.

    console.log('\n⚠️ Nota: No puedo ejecutar SQL arbitrario directamente desde aquí sin un endpoint dedicado.');
    console.log('Por favor, copia y pega el siguiente código en el SQL Editor de Supabase para arreglarlo definitivamente:\n');
    console.log(sqlFix);
}

fixSqlAmbiguity();
