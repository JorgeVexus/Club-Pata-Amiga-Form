const https = require('https');

// Read directly from the file system to ensure we are using the saved file's content
require('dotenv').config({ path: '.env.local' });

const adminKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;

if (!adminKey) {
    console.error('❌ Error: MEMBERSTACK_ADMIN_SECRET_KEY no encontrada en .env.local');
    process.exit(1);
}

console.log(`🔐 Usando Admin Key: ${adminKey.substring(0, 8)}...`);

function listMembers() {
    const options = {
        hostname: 'admin.memberstack.com',
        path: '/members?limit=5',
        method: 'GET',
        headers: {
            'X-API-KEY': adminKey
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const json = JSON.parse(data);
                console.log(`✅ Conexión exitosa.`);
                console.log(`📊 Total de miembros encontrados: ${json.totalCount || 'N/A'}`);

                if (json.data && json.data.length > 0) {
                    console.log('📝 Últimos 5 miembros en Memberstack:');
                    json.data.forEach(m => {
                        console.log(` - ID: ${m.id} | Email: ${m.auth?.email} | Status: ${m.customFields ? m.customFields['approval-status'] : 'N/A'}`);
                    });
                } else {
                    console.log('📭 No se encontraron miembros. La lista está vacía.');
                }
            } else {
                console.error(`❌ Error al conectar con Memberstack: Status ${res.statusCode}`);
                console.error('Respuesta:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Error de red: ${e.message}`);
    });

    req.end();
}

console.log('📡 Conectando a Memberstack API...');
listMembers();
