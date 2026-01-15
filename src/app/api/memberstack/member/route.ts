import { NextRequest, NextResponse } from 'next/server';

// Memberstack Admin API v2
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

        console.log('📥 Solicitud de miembro:', memberId);

        if (!memberId) {
            return NextResponse.json(
                { success: false, error: 'Se requiere el ID del miembro' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (!MEMBERSTACK_SECRET_KEY) {
            console.error('❌ MEMBERSTACK_SECRET_KEY no configurada en las variables de entorno');
            return NextResponse.json(
                { success: false, error: 'Error de configuración del servidor - API Key faltante' },
                { status: 500, headers: corsHeaders() }
            );
        }

        console.log('🔑 API Key presente:', MEMBERSTACK_SECRET_KEY.substring(0, 10) + '...');

        // Llamar a la API de Memberstack Admin
        const apiUrl = `${MEMBERSTACK_API_URL}/${memberId}`;
        console.log('📡 Llamando a:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('📨 Respuesta de Memberstack:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Memberstack:', response.status, errorText);
            return NextResponse.json(
                { success: false, error: `Miembro no encontrado (${response.status})`, details: errorText },
                { status: 404, headers: corsHeaders() }
            );
        }

        const memberData = await response.json();
        console.log('✅ Miembro encontrado:', memberData.data?.auth?.email || memberData.auth?.email);

        // Retornar los datos del miembro
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
        console.error('❌ Error obteniendo miembro:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor', details: String(error) },
            { status: 500, headers: corsHeaders() }
        );
    }
}
