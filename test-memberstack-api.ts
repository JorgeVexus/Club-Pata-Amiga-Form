/**
 * Script de prueba para verificar conexión con Memberstack Admin API
 * Ejecutar con: node --loader ts-node/esm test-memberstack-api.ts
 * O simplemente llamar desde un endpoint temporal
 */

import { listPendingMembers } from './src/services/memberstack-admin.service';

async function testMemberstackAPI() {
    console.log('🧪 Probando conexión con Memberstack Admin API...\n');

    try {
        // Intentar listar miembros pendientes
        const result = await listPendingMembers();

        if (result.success) {
            console.log('✅ Conexión exitosa!');
            console.log(`📊 Miembros pendientes encontrados: ${result.data?.length || 0}`);

            if (result.data && result.data.length > 0) {
                console.log('\n📋 Primeros 3 miembros:');
                result.data.slice(0, 3).forEach((member, i) => {
                    console.log(`\n${i + 1}. ${member.auth.email}`);
                    console.log(`   Status: ${member.customFields?.['approval-status'] || 'N/A'}`);
                    console.log(`   ID: ${member.id}`);
                });
            }
        } else {
            console.error('❌ Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error inesperado:', error);
    }
}

// Ejecutar prueba
testMemberstackAPI();
