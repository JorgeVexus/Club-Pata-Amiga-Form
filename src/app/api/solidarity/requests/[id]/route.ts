import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ error: 'memberstackId es requerido' }, { status: 400, headers: corsHeaders });
        }

        // 1. Verificar que la solicitud pertenece al usuario
        const { data: solidarityRequest, error } = await supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                pet:pets(*)
            `)
            .eq('id', id)
            .single();

        if (error || !solidarityRequest) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404, headers: corsHeaders });
        }

        // 2. Verificar seguridad (que el user_id de la solicitud coincida con el memberstack_id)
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (!user || solidarityRequest.user_id !== user.id) {
            return NextResponse.json({ error: 'No tienes permiso para ver esta solicitud' }, { status: 403, headers: corsHeaders });
        }

        return NextResponse.json({
            success: true,
            request: solidarityRequest,
            pet: solidarityRequest.pet
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error fetching solidarity request:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
