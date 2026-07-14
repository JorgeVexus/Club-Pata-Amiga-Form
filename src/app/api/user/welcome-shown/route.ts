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

        const { error } = await supabaseAdmin
            .from('users')
            .update({ welcome_shown: true })
            .eq('memberstack_id', memberstackId);

        if (error) {
            console.error('[Member Welcome] Error updating welcome_shown:', error);
            return NextResponse.json(
                { success: false, error: 'No se pudo guardar bienvenida vista' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('[Member Welcome] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500, headers: corsHeaders() }
        );
    }
}
