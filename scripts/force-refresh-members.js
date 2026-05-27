/**
 * Script para forzar la recarga de datos de miembros en el dashboard de admin
 * Este script invalida el caché de Memberstack y fuerza la recarga de la página
 */

console.log('🔄 Iniciando recarga forzada de datos de miembros...');

// 1. Invalidar caché de Memberstack
if (window.memberstackAdmin) {
    try {
        window.memberstackAdmin.invalidateCache();
        console.log('✅ Caché de Memberstack invalidado');
    } catch (error) {
        console.error('❌ Error al invalidar caché:', error);
    }
}

// 2. Forzar recarga de la página después de un breve delay
setTimeout(() => {
    console.log('🔄 Recargando página para obtener datos actualizados...');
    window.location.reload();
}, 1000);

// 3. Si estamos en el dashboard, podemos intentar recargar los datos manualmente
if (window.location.pathname === '/admin/dashboard') {
    // Disparar evento personalizado para recargar datos
    window.dispatchEvent(new CustomEvent('force-refresh-members'));
    console.log('📡 Evento de recarga forzada disparado');
}

console.log('✅ Script de recarga forzada completado. La página se recargará en 1 segundo.');