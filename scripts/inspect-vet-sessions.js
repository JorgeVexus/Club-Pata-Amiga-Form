const { createClient } = require('@supabase/supabase-js');

// Configuración directa para debug
const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSessions() {
    const email = 'asahizv1@gmail.com';
    console.log(`\n🔍 Inspeccionando sesiones para: ${email}`);

    const { data, error } = await supabase
        .from('vet_bot_sessions')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error al consultar DB:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No se encontraron sesiones para este email.');
        return;
    }

    console.log(`Se encontraron ${data.length} sesiones:`);
    data.forEach((s, i) => {
        const now = new Date();
        const expires = new Date(s.expires_at);
        const isValid = s.is_active && expires > now;

        console.log(`\n[${i + 1}] Token: ${s.token.substring(0, 8)}...`);
        console.log(`    Status: ${s.is_active ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`    Created: ${s.created_at}`);
        console.log(`    Expires: ${s.expires_at}`);
        console.log(`    Valid now?: ${isValid ? 'SÍ ✅' : 'NO ❌'}`);
        if (!isValid) {
            if (!s.is_active) console.log('    Reason: Marcado como inactivo manualmente.');
            if (expires <= now) console.log(`    Reason: Expirado (hace ${Math.floor((now - expires) / 1000 / 60)} min).`);
        }
    });

    // Probar el RPC de validación manualmente con el último token
    const token = data[0].token;
    console.log(`\n🧪 Probando RPC get_valid_vet_session con el último token...`);
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_valid_vet_session', { p_token: token });

    if (rpcError) {
        console.error('Error en RPC:', rpcError);
    } else {
        console.log('Resultado RPC:', JSON.stringify(rpcData, null, 2));
    }
}

inspectSessions();
