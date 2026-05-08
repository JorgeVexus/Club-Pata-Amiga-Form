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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');
        const petId = searchParams.get('petId');

        if (!memberId) {
            return NextResponse.json({ error: 'memberId es requerido' }, { status: 400, headers: corsHeaders });
        }

        // Construir query para solicitudes
        let query = supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                pet:pets(name),
                documents:solidarity_documents(*)
            `)
            .eq('user_id', memberId)
            .order('created_at', { ascending: false });

        if (petId) {
            query = query.eq('pet_id', petId);
        }

        const { data: requests, error } = await query;

        if (error) throw error;

        // También obtener el chat/logs si es necesario para el historial global
        // Pero el dashboard principal suele mostrar solo los requests

        return NextResponse.json({
            success: true,
            requests: requests || []
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/history:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
