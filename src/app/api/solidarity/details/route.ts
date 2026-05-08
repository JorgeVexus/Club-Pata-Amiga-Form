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
        const requestId = searchParams.get('id');

        if (!requestId) {
            return NextResponse.json({ error: 'id es requerido' }, { status: 400, headers: corsHeaders });
        }

        // Obtener la solicitud con sus documentos
        const { data: requestData, error: requestError } = await supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                pet:pets(name, primary_photo_url),
                documents:solidarity_documents(*)
            `)
            .eq('id', requestId)
            .single();

        if (requestError || !requestData) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404, headers: corsHeaders });
        }

        // Obtener el historial de chat (usando appeal_logs con metadata de la solicitud)
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('appeal_logs')
            .select('*')
            .eq('metadata->>requestId', requestId)
            .order('created_at', { ascending: true });

        if (logsError) console.error('Error obteniendo logs de chat:', logsError);

        return NextResponse.json({
            success: true,
            request: requestData,
            chat: logs || []
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/details:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
