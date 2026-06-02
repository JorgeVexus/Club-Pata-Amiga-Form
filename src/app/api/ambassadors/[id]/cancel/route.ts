import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log(`[CANCEL_AMBASSADOR] Iniciando cancelación para embajador ID: ${id}`);

        // 1. Obtener embajador
        const { data: ambassador, error: fetchError } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('[CANCEL_AMBASSADOR] Error buscando embajador en Supabase:', fetchError);
            return NextResponse.json(
                { success: false, error: 'Error al buscar el embajador' },
                { status: 500, headers: corsHeaders() }
            );
        }

        if (!ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        if (ambassador.status === 'cancelled') {
            return NextResponse.json(
                { success: true, message: 'La solicitud de embajador ya estaba cancelada' },
                { headers: corsHeaders() }
            );
        }

        const now = new Date().toISOString();

        // 2. Actualizar estado del embajador en Supabase
        const { error: updateError } = await supabase
            .from('ambassadors')
            .update({
                status: 'cancelled',
                cancelled_at: now,
                updated_at: now
            })
            .eq('id', id);

        if (updateError) {
            console.error('[CANCEL_AMBASSADOR] Error al actualizar estado en Supabase:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar el estado de baja' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 3. Si está vinculado a Memberstack, actualizar custom fields en Memberstack
        if (ambassador.linked_memberstack_id) {
            console.log(`[CANCEL_AMBASSADOR] Sincronizando con Memberstack para el miembro: ${ambassador.linked_memberstack_id}`);
            const msResult = await memberstackAdmin.updateMemberFields(ambassador.linked_memberstack_id, {
                'is-ambassador': 'false',
                'ambassador-status': 'cancelled'
            });

            if (!msResult.success) {
                console.error('[CANCEL_AMBASSADOR] Error al actualizar Memberstack:', msResult.error);
                // No bloqueamos la respuesta ya que el estado local en BD sí se actualizó correctamente
            } else {
                console.log(`[CANCEL_AMBASSADOR] Memberstack actualizado con éxito.`);
            }
        }

        // 4. Eliminar todas las sesiones activas del embajador para forzar logout
        const { error: sessionError } = await supabase
            .from('ambassador_sessions')
            .delete()
            .eq('ambassador_id', id);

        if (sessionError) {
            console.warn('[CANCEL_AMBASSADOR] Advertencia: No se pudieron eliminar las sesiones del embajador:', sessionError);
        } else {
            console.log(`[CANCEL_AMBASSADOR] Sesiones eliminadas para el embajador ${id}.`);
        }

        // 5. Crear notificación interna para administradores
        await supabase.from('notifications').insert({
            user_id: 'admin',
            type: 'ambassador_cancellation',
            title: 'Embajador dado de baja voluntaria',
            message: `${ambassador.first_name} ${ambassador.paternal_surname} se ha dado de baja del programa.`,
            data: { ambassador_id: id },
            is_read: false
        });

        return NextResponse.json({
            success: true,
            message: 'Solicitud de embajador cancelada correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('[CANCEL_AMBASSADOR] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
