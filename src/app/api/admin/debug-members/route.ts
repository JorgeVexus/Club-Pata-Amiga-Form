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

        // Hacer peticiones con paginación hasta traer todos los miembros
        let allMembers: any[] = [];
        let startingAfter: string | null = null;
        let pageCount = 0;
        const maxPages = 5;

        do {
            let url = 'https://admin.memberstack.com/members?limit=100';
            if (startingAfter) {
                url += `&starting_after=${startingAfter}`;
            }

            const response = await fetch(url, {
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
            const members = rawData.data || [];
            allMembers = allMembers.concat(members);

            // Memberstack puede usar has_more o hasMore
            const hasMore = rawData.has_more || rawData.hasMore || false;
            console.log(`📄 Página ${pageCount}: ${members.length} miembros, hasMore: ${hasMore}`);

            const lastMember = members[members.length - 1];
            startingAfter = hasMore && lastMember ? lastMember.id : null;
            pageCount++;

        } while (startingAfter && pageCount < maxPages);

        // Guardar la primera respuesta raw para debug
        let firstPageRaw: any = null;

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
            // Nota: rawResponse omitido porque ahora usamos paginación
        });

    } catch (error: any) {
        console.error('Error en debug:', error);
        return NextResponse.json(
            { error: 'Error interno', details: error.message },
            { status: 500 }
        );
    }
}
