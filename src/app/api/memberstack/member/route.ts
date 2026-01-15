import { NextRequest, NextResponse } from 'next/server';

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Obtener datos de un miembro por ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('id');

        if (!memberId) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el ID del miembro' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!MEMBERSTACK_SECRET_KEY) {
            console.error('MEMBERSTACK_SECRET_KEY no configurada');
            return NextResponse.json(
                { success: false, error: 'Error de configuración del servidor' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Llamar a la API de Memberstack Admin
        const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Error de Memberstack:', response.status, response.statusText);
            return NextResponse.json(
                { success: false, error: 'Miembro no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        const memberData = await response.json();

        // Retornar solo los datos necesarios (sin info sensible)
        return NextResponse.json({
            success: true,
            member: {
                id: memberData.data?.id || memberData.id,
                auth: {
                    email: memberData.data?.auth?.email || memberData.auth?.email
                },
                customFields: memberData.data?.customFields || memberData.customFields || {},
                planConnections: memberData.data?.planConnections || memberData.planConnections || []
            }
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Error obteniendo miembro:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
