/**
 * Utilidad para redirección basada en status de aprobación
 * Se usa en Webflow para redirigir usuarios según su estado
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'appealed';

/**
 * Mapeo de estados a URLs de Webflow
 */
const STATUS_ROUTES: Record<ApprovalStatus, string> = {
    pending: '/solicitud-en-revision',
    approved: '/dashboard',
    rejected: '/solicitud-rechazada',
    appealed: '/apelacion-enviada',
};

/**
 * Obtiene la URL correcta según el status de aprobación
 */
export function getPageForStatus(status: ApprovalStatus | string): string {
    if (!status || !(status in STATUS_ROUTES)) {
        // Si no hay status o es inválido, asumir pending
        return STATUS_ROUTES.pending;
    }

    return STATUS_ROUTES[status as ApprovalStatus];
}

/**
 * Verifica si el usuario puede acceder a una página protegida
 */
export function canAccessProtectedPage(
    currentStatus: ApprovalStatus | string,
    requiredStatus: ApprovalStatus = 'approved'
): boolean {
    return currentStatus === requiredStatus;
}

/**
 * Script para Webflow que redirige según el status
 * Copiar y pegar en el <head> de páginas protegidas en Webflow
 */
export const WEBFLOW_REDIRECT_SCRIPT = `
<script>
// Redirección automática basada en approval-status
(async function() {
    try {
        // Esperar a que Memberstack se cargue
        if (!window.$memberstackDom) {
            console.warn('Memberstack no está cargado');
            return;
        }

        // Obtener miembro actual
        const { data: member } = await window.$memberstackDom.getCurrentMember();
        
        if (!member) {
            // Si no hay sesión, redirigir al login
            window.location.href = '/';
            return;
        }

        // Obtener status de aprobación
        const approvalStatus = member.customFields?.['approval-status'];
        
        // Mapeo de estados a URLs
        const statusRoutes = {
            'pending': '/solicitud-en-revision',
            'approved': '/dashboard',
            'rejected': '/solicitud-rechazada',
            'appealed': '/apelacion-enviada'
        };

        // Obtener la página actual
        const currentPath = window.location.pathname;
        const correctPath = statusRoutes[approvalStatus] || '/solicitud-en-revision';

        // Si no está en la página correcta, redirigir
        if (currentPath !== correctPath) {
            console.log(\`Redirigiendo de \${currentPath} a \${correctPath}\`);
            window.location.href = correctPath;
        }
    } catch (error) {
        console.error('Error en redirección automática:', error);
    }
})();
</script>
`;

/**
 * Función helper para usar en componentes React/Next.js
 */
export async function redirectBasedOnStatus(
    getMemberFunction: () => Promise<any>
): Promise<string | null> {
    try {
        const member = await getMemberFunction();

        if (!member) {
            return '/'; // Redirigir al login
        }

        const status = member.customFields?.['approval-status'] || 'pending';
        return getPageForStatus(status);

    } catch (error) {
        console.error('Error obteniendo status:', error);
        return '/solicitud-en-revision'; // Fallback seguro
    }
}
