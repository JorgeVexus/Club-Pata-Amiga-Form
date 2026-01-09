/**
 * API Route: /api/admin/members/[id]/appeal-response
 * Permite a un administrador enviar un mensaje de respuesta a una apelación
 * ACTUALIZADO: Ahora trabaja a nivel de mascota individual
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
        const { message, adminId, petId } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 });
        }

        if (!petId) {
            return NextResponse.json({ error: 'petId es obligatorio para enviar mensaje a una mascota' }, { status: 400 });
        }

        console.log(`📩 Enviando respuesta de apelación a mascota ${petId} del usuario ${memberId}...`);

        // 1. Registrar en appeal_logs CON el pet_id
        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: petId,  // 🆕 Vinculado a la mascota específica
                admin_id: adminId || 'admin',
                type: 'admin_request',
                message: message,
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Error creando log de apelación:', logError);
            return NextResponse.json({ error: 'Error al registrar el log' }, { status: 500 });
        }

        // 2. Actualizar la MASCOTA específica (no el usuario)
        const { error: petError } = await supabaseAdmin
            .from('pets')
            .update({
                last_admin_response: message,
                status: 'action_required'
            })
            .eq('id', petId);

        if (petError) {
            console.error('Error actualizando mascota:', petError);
            return NextResponse.json({ error: 'Error al actualizar la mascota' }, { status: 500 });
        }

        // 3. Crear notificación para la campana del usuario 🔔
        // (Las notificaciones sí van al usuario, pero con contexto de la mascota)
        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: '📩 Nuevo mensaje sobre tu mascota',
            message: message.length > 100 ? message.substring(0, 100) + '...' : message,
            icon: '📩',
            link: '/mi-membresia',
            metadata: { source: 'appeal_response', petId: petId }
        });

        console.log(`✅ Respuesta de apelación enviada a mascota ${petId} y notificación creada para ${memberId}`);

        return NextResponse.json({
            success: true,
            message: 'Respuesta enviada correctamente'
        });

    } catch (error: any) {
        console.error('Error en appeal-response API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
