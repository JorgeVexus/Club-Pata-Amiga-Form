import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST - Validar código de referido
export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json(
                { success: false, valid: false, error: 'Código requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar embajador con este código
        const { data: ambassador, error } = await supabase
            .from('ambassadors')
            .select('id, first_name, paternal_surname, referral_code, status')
            .eq('referral_code', code.toUpperCase())
            .single();

        if (error || !ambassador) {
            return NextResponse.json({
                success: true,
                valid: false,
                message: 'Código de referido no encontrado'
            }, { headers: corsHeaders() });
        }

        // Verificar que el embajador esté aprobado
        if (ambassador.status !== 'approved') {
            return NextResponse.json({
                success: true,
                valid: false,
                message: 'Este código de referido no está activo'
            }, { headers: corsHeaders() });
        }

        return NextResponse.json({
            success: true,
            valid: true,
            ambassador_name: `${ambassador.first_name} ${ambassador.paternal_surname}`,
            referral_code: ambassador.referral_code
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Validate referral code error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
