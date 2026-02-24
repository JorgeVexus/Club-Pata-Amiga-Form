/**
 * Script de prueba para los endpoints de Vet-Bot
 * 
 * Uso:
 * node scripts/test-pet-api.js --local --email test@example.com
 * node scripts/test-pet-api.js --prod --email test@example.com
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1] ||
    (args.indexOf('--email') !== -1 ? args[args.indexOf('--email') + 1] : 'test@example.com');
const memberstackId = args.find(a => a.startsWith('--id='))?.split('=')[1] || 'usr_test_123';

const CONFIG = {
    local: {
        host: 'localhost',
        port: 3000,
        protocol: http
    },
    prod: {
        host: 'app.pataamiga.mx',
        port: 443,
        protocol: https
    }
};

const target = isLocal ? CONFIG.local : CONFIG.prod;
const API_KEY = 'pata-amiga-vet-bot-secret-2026';

console.log(`\n🚀 Iniciando pruebas en ${isLocal ? 'LOCAL (localhost:3000)' : 'PRODUCCIÓN (app.pataamiga.mx)'}`);
console.log(`📧 Email objetivo: ${emailArg}`);
console.log(`🆔 Memberstack ID: ${memberstackId}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...\n`);

async function runTests() {
    try {
        // 1. Probar Contexto por Email
        console.log('--- 1. Probando Contexto por Email ---');
        const contextByEmail = await makeRequest({
            method: 'GET',
            path: `/api/integrations/vet-bot/context?email=${encodeURIComponent(emailArg)}`,
            headers: { 'x-vet-bot-key': API_KEY }
        });
        console.log('Respuesta:', JSON.stringify(contextByEmail, null, 2));

        // 2. Generar Session Token
        console.log('\n--- 2. Generando Session Token ---');
        const sessionTokenRes = await makeRequest({
            method: 'POST',
            path: '/api/auth/session-token',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberstackId, email: emailArg })
        });
        console.log('Respuesta:', JSON.stringify(sessionTokenRes, null, 2));

        if (sessionTokenRes.success && sessionTokenRes.sessionToken) {
            const token = sessionTokenRes.sessionToken;

            // 2.5 Validación directa del token (Diagnóstico)
            console.log('\n--- 2.5 Diagnóstico: Validando token directamente ---');
            const validationRes = await makeRequest({
                method: 'GET',
                path: `/api/auth/session-token?token=${token}`,
            });
            console.log('Respuesta Diagnóstico:', JSON.stringify(validationRes, null, 2));

            // 3. Probar Contexto por Token
            console.log('\n--- 3. Probando Contexto por Session Token ---');
            const contextByToken = await makeRequest({
                method: 'GET',
                path: `/api/integrations/vet-bot/context?sessionToken=${token}`,
                headers: { 'x-vet-bot-key': API_KEY }
            });
            console.log('Respuesta:', JSON.stringify(contextByToken, null, 2));
        } else {
            console.log('\n❌ No se pudo generar el token, saltando prueba 3.');
        }

    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
    }
}

function makeRequest({ method, path, headers = {}, body }) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: target.host,
            port: target.port,
            path: path,
            method: method,
            headers: headers
        };

        const req = target.protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ statusCode: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

runTests();
