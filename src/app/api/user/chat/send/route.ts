import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, petId, message } = body;

        if (!userId || !petId || !message) {
            return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400, headers: corsHeaders });
        }

        // 1. Validar que la mascota existe y pertenece al usuario (opcional pero recomendado)
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('id, name')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
        }

        // 2. Insertar en appeal_logs
        const { data: log, error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: userId,
                pet_id: petId,
                type: 'user_message',
                message: message,
                metadata: { source: 'widget_chat' },
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (logError) {
            console.error('❌ Error guardando mensaje en chat:', logError);
            return NextResponse.json({ error: 'Error al guardar el mensaje' }, { status: 500, headers: corsHeaders });
        }

        // 3. Crear notificación para el admin
        const { error: notifError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin',
                type: 'account',
                title: `💬 Nuevo mensaje de ${pet.name}`,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                icon: '💬',
                link: `/admin/dashboard?member=${userId}`,
                is_read: false,
                created_at: new Date().toISOString()
            });

        if (notifError) console.error('⚠️ Error creando notificación admin:', notifError);

        return NextResponse.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: log
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('💥 Error crítico en Chat Send API:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: corsHeaders });
    }
}
