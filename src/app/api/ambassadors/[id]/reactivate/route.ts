import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { getAuthenticatedAmbassador } from '@/lib/ambassador-auth';

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

// POST - Reactivar una cuenta de embajador dada de baja voluntariamente
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log(`[REACTIVATE_AMBASSADOR] Iniciando reactivación para embajador ID: ${id}`);

        const auth = await getAuthenticatedAmbassador(request, id);
        if (!auth.ok) return auth.response;
        const ambassador = auth.ambassador;

        if (ambassador.status !== 'cancelled') {
            return NextResponse.json(
                { success: false, error: 'Solo las cuentas dadas de baja pueden reactivarse' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const now = new Date().toISOString();

        // 1. Restaurar estado del embajador en Supabase (conserva su código e historial)
        const { error: updateError } = await supabase
            .from('ambassadors')
            .update({
                status: 'approved',
                cancelled_at: null,
                updated_at: now
            })
            .eq('id', id);

        if (updateError) {
            console.error('[REACTIVATE_AMBASSADOR] Error al actualizar estado en Supabase:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al reactivar la cuenta' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 2. Si está vinculado a Memberstack, restaurar custom fields
        if (ambassador.linked_memberstack_id) {
            const msResult = await memberstackAdmin.updateMemberFields(ambassador.linked_memberstack_id, {
                'is-ambassador': 'true',
                'ambassador-status': 'approved'
            });

            if (!msResult.success) {
                console.error('[REACTIVATE_AMBASSADOR] Error al actualizar Memberstack:', msResult.error);
                // No bloqueamos la respuesta ya que el estado local en BD sí se actualizó correctamente
            }
        }

        // 3. Notificación interna para administradores (no bloqueante)
        const { error: notificationError } = await supabase.from('notifications').insert({
            user_id: 'admin',
            type: 'ambassador_reactivation',
            title: 'Embajador reactivó su cuenta',
            message: `${ambassador.first_name || 'Un embajador'} reactivó su cuenta de embajador.`,
            data: { ambassador_id: id },
            is_read: false
        });
        if (notificationError) {
            console.error('[REACTIVATE_AMBASSADOR] Error creando notificación admin:', notificationError);
        }

        return NextResponse.json({
            success: true,
            message: 'Cuenta de embajador reactivada correctamente'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('[REACTIVATE_AMBASSADOR] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
