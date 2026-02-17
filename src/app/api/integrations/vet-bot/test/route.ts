/**
 * API Endpoint: GET /api/integrations/vet-bot/test
 * 
 * Endpoint de prueba para verificar que la API está funcionando correctamente
 * y probar la búsqueda por email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Headers CORS
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-vet-bot-key',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        console.log('🧪 [VET_BOT_TEST] Testing API - Email:', email);

        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Proporciona un email para probar',
                example: '/api/integrations/vet-bot/test?email=usuario@email.com'
            }, { headers: corsHeaders() });
        }

        // Buscar usuario
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email, membership_status')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (error) {
            console.error('🧪 [VET_BOT_TEST] Error:', error);
            return NextResponse.json({
                success: false,
                error: 'Database error',
                details: error.message
            }, { status: 500, headers: corsHeaders() });
        }

        if (!user) {
            console.log('🧪 [VET_BOT_TEST] Usuario no encontrado:', email);
            return NextResponse.json({
                success: false,
                message: 'Usuario no encontrado',
                email: email,
                suggestion: 'Verifica que el email esté registrado en la plataforma'
            }, { status: 404, headers: corsHeaders() });
        }

        console.log('🧪 [VET_BOT_TEST] Usuario encontrado:', user.email);

        return NextResponse.json({
            success: true,
            message: 'Usuario encontrado',
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`.trim(),
                email: user.email,
                status: user.membership_status
            }
        }, { headers: corsHeaders() });

    } catch (error: any) {
        console.error('🧪 [VET_BOT_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Server error',
            details: error.message
        }, { status: 500, headers: corsHeaders() });
    }
}
