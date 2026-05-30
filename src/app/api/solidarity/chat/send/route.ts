import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, requestId, petId, message } = body;

        if (!userId || !requestId || !message) {
            return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400, headers: corsHeaders });
        }

        // 1. Insertar el mensaje en appeal_logs con el requestId en metadata
        const { data: log, error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: userId,
                pet_id: petId,
                type: 'solidarity_chat',
                message: message,
                metadata: { 
                    requestId: requestId,
                    source: 'solidarity_chat'
                },
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (logError) throw logError;

        // 2. Si la solicitud estaba en 'needs_info', pasarla a 'in_review' automáticamente
        const { data: solidarityRequest } = await supabaseAdmin
            .from('solidarity_requests')
            .select('status, benefit_type')
            .eq('id', requestId)
            .single();

        if (solidarityRequest?.status === 'needs_info') {
            await supabaseAdmin
                .from('solidarity_requests')
                .update({ status: 'in_review', updated_at: new Date().toISOString() })
                .eq('id', requestId);
        }

        // 3. Notificar al admin
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin',
                type: 'solidarity',
                title: `💬 Mensaje en Apoyo Económico`,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                icon: '💰',
                link: `/admin/dashboard?requestId=${requestId}`,
                is_read: false,
                created_at: new Date().toISOString()
            });

        return NextResponse.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: log
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en /api/solidarity/chat/send:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
