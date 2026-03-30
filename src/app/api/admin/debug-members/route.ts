import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/debug-members
 *
 * Debug endpoint para ver qué miembros tiene Memberstack y por qué
 * el dashboard los está filtrando.
 *
 * Muestra la respuesta RAW de Memberstack API incluyendo paginación.
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Debug: Obteniendo miembros de Memberstack...');

        const secretKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json(
                { error: 'MEMBERSTACK_ADMIN_SECRET_KEY no configurada' },
                { status: 500 }
            );
        }

        // Hacer petición directa a Memberstack sin procesamiento
        const response = await fetch('https://admin.memberstack.com/members?limit=200', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': secretKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Memberstack API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const rawData = await response.json();

        // Analizar estructura de la respuesta
        const members = rawData.data || [];
        const pagination = rawData.pagination || null;

        // Buscar específicamente los emails mencionados
        const targetEmails = [
            'efrain.rabago@rabadoub.com.mx',
            'globalcanecata@gmail.com',
            'efrain.institucional@gmail.com'
        ];

        const foundMembers = members.filter((m: any) => {
            const email = m.auth?.email?.toLowerCase();
            return targetEmails.some(target => email?.includes(target.toLowerCase()));
        });

        const notFoundEmails = targetEmails.filter(target => {
            return !members.some((m: any) =>
                m.auth?.email?.toLowerCase()?.includes(target.toLowerCase())
            );
        });

        // Análisis completo de todos los miembros
        const analysis = members.map((member: any) => {
            const customFields = member.customFields || {};
            const planConnections = member.planConnections || [];

            return {
                id: member.id,
                email: member.auth?.email || 'sin-email',
                name: `${customFields['first-name'] || ''} ${customFields['paternal-last-name'] || ''}`.trim() || 'Sin nombre',
                approvalStatus: customFields['approval-status'] || 'NO DEFINIDO',
                paymentStatus: customFields['payment-status'] || 'NO DEFINIDO',
                planConnections: planConnections.map((p: any) => ({
                    priceId: p.priceId,
                    status: p.status,
                })),
                hasActivePlan: planConnections.some((p: any) =>
                    p.status?.toLowerCase() === 'active' ||
                    p.status?.toLowerCase() === 'trialing'
                ),
            };
        });

        return NextResponse.json({
            summary: {
                totalMembersInResponse: members.length,
                hasPagination: !!pagination,
                pagination: pagination,
                targetMembersFound: foundMembers.length,
                targetMembersNotFound: notFoundEmails,
            },
            targetMembers: foundMembers,
            notInResponse: notFoundEmails,
            allMembers: analysis,
            rawResponse: rawData, // Respuesta completa para debugging
        });

    } catch (error: any) {
        console.error('Error en debug:', error);
        return NextResponse.json(
            { error: 'Error interno', details: error.message },
            { status: 500 }
        );
    }
}
