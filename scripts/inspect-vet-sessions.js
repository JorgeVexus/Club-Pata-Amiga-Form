const { createClient } = require('@supabase/supabase-js');

// Configuración directa para debug
const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSessions() {
    console.log(`\n🔍 Inspeccionando las últimas 10 sesiones globales...`);

    const { data, error } = await supabase
        .from('vet_bot_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error al consultar DB:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No se encontraron sesiones.');
        return;
    }

    console.log(`Se encontraron ${data.length} sesiones:`);
    data.forEach((session, index) => {
        const expires = new Date(session.expires_at);
        const now = new Date();
        const isValid = session.is_active && expires > now;

        console.log(`${index + 1}. Token: ${session.token.substring(0, 8)}... | Email: ${session.email} | Active: ${session.is_active} | Valid: ${isValid}`);
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
