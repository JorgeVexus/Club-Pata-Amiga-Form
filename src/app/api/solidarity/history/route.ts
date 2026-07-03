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
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');
        const petId = searchParams.get('petId');

        if (!memberstackId) {
            return NextResponse.json({ error: 'memberstackId es requerido' }, { status: 400, headers: corsHeaders });
        }

        // Resolver el ID interno de Supabase a partir del ID de Memberstack
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) {
            console.error('❌ Error resolviendo usuario:', userError);
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404, headers: corsHeaders });
        }

        const internalUserId = user.id;

        // Construir query para solicitudes
        let query = supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                pet:pets(name),
                documents:solidarity_documents(*)
            `)
            .eq('user_id', internalUserId)
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
