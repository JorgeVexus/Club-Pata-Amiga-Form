/**
 * API Route: /api/admin/members/[id]/appeal-response
 * Permite a un administrador enviar un mensaje de respuesta a una apelación
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerNotification } from '@/app/actions/notification.actions';

// Cliente Supabase con Service Role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: memberId } = await params;
        const { message, adminId } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
        }

        console.log(`📩 Enviando respuesta de apelación a ${memberId}...`);

        // 1. Registrar en appeal_logs
        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                admin_id: adminId || 'admin',
                type: 'admin_request',
                message: message,
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Error creando log de apelación:', logError);
            return NextResponse.json({ error: 'Error al registrar el log' }, { status: 500 });
        }

        // 2. Actualizar campo denormalizado en users para acceso rápido del widget
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                last_admin_response: message,
                membership_status: 'action_required'
            })
            .eq('memberstack_id', memberId);

        if (userError) {
            console.warn('Error actualizando usuario (no crítico):', userError);
        }

        // 3. Crear notificación para la campana del usuario 🔔
        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: '📩 Nuevo mensaje de tu apelación',
            message: message.length > 100 ? message.substring(0, 100) + '...' : message,
            icon: '📩',
            link: '/mi-membresia', // O la página donde ven su estado
            metadata: { source: 'appeal_response' }
        });

        console.log(`✅ Respuesta de apelación enviada y notificación creada para ${memberId}`);

        return NextResponse.json({
            success: true,
            message: 'Respuesta enviada correctamente'
        });

    } catch (error: any) {
        console.error('Error en appeal-response API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
