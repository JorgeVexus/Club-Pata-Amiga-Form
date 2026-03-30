import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

/**
 * GET /api/admin/debug-members
 *
 * Debug endpoint para ver qué miembros tiene Memberstack y por qué
 * el dashboard los está filtrando.
 *
 * Muestra:
 * - Todos los miembros con sus customFields
 * - Quién tiene approval-status
 * - Quién tiene planConnections activo
 * - Quién debería aparecer en el dashboard
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Debug: Obteniendo todos los miembros...');

        // Obtener todos los miembros (sin filtro de status)
        const result = await memberstackAdmin.listMembers();

        if (!result.success || !result.data) {
            return NextResponse.json(
                { error: 'Error obteniendo miembros', details: result.error },
                { status: 500 }
            );
        }

        const members = result.data;

        // Analizar cada miembro
        const analysis = members.map((member: any) => {
            const customFields = member.customFields || {};
            const planConnections = member.planConnections || [];

            const approvalStatus = customFields['approval-status'];
            const paymentStatus = customFields['payment-status'];
            const registrationStep = customFields['registration-step'];

            // Verificar si tiene plan activo
            const hasActivePlan = planConnections.some((p: any) =>
                p.status?.toLowerCase() === 'active' ||
                p.status?.toLowerCase() === 'trialing'
            );

            // Verificar si debería aparecer en dashboard
            const shouldShowInDashboard =
                approvalStatus === 'pending' &&
                hasActivePlan;

            return {
                id: member.id,
                email: member.auth?.email || 'sin-email',
                name: `${customFields['first-name'] || ''} ${customFields['paternal-last-name'] || ''}`.trim() || 'Sin nombre',
                customFields: {
                    'approval-status': approvalStatus || 'NO DEFINIDO',
                    'payment-status': paymentStatus || 'NO DEFINIDO',
                    'registration-step': registrationStep || 'NO DEFINIDO',
                },
                planConnections: planConnections.map((p: any) => ({
                    priceId: p.priceId,
                    status: p.status,
                })),
                hasActivePlan,
                shouldShowInDashboard,
            };
        });

        // Separar por categorías
        const wouldShowInDashboard = analysis.filter(m => m.shouldShowInDashboard);
        const missingApprovalStatus = analysis.filter(m => !m.customFields['approval-status'] && m.hasActivePlan);
        const missingActivePlan = analysis.filter(m => m.customFields['approval-status'] === 'pending' && !m.hasActivePlan);

        return NextResponse.json({
            totalMembers: members.length,
            summary: {
                wouldShowInDashboard: wouldShowInDashboard.length,
                missingApprovalStatus: missingApprovalStatus.length,
                missingActivePlan: missingActivePlan.length,
            },
            wouldShowInDashboard,
            missingApprovalStatus,
            missingActivePlan,
            allMembers: analysis,
        });

    } catch (error: any) {
        console.error('Error en debug:', error);
        return NextResponse.json(
            { error: 'Error interno', details: error.message },
            { status: 500 }
        );
    }
}
