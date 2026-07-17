import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId || typeof memberstackId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'memberstackId requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { data: updatedUser, error } = await supabaseAdmin
            .from('users')
            .update({ welcome_shown: true })
            .eq('memberstack_id', memberstackId)
            .select('memberstack_id, welcome_shown')
            .single();

        if (error || !updatedUser) {
            console.error('[Member Welcome] Account update failed:', error);
            return NextResponse.json(
                { success: false, error: 'No se encontro la cuenta o no se pudo guardar la bienvenida' },
                { status: 404, headers: corsHeaders() }
            );
        }

        return NextResponse.json(
            { success: true, welcome_shown: updatedUser.welcome_shown },
            { headers: corsHeaders() }
        );
    } catch (error: unknown) {
        console.error('[Member Welcome] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Error inesperado';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500, headers: corsHeaders() }
        );
    }
}
