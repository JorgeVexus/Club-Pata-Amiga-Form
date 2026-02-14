/**
 * API Route: /api/admin/members/[id]/reject
 * Rechaza la solicitud de un miembro con una razón
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectMemberApplication } from '@/services/memberstack-admin.service';
import { createServerNotification } from '@/app/actions/notification.actions';

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para operaciones admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Validar que el usuario sea admin
        // const adminId = await validateAdminAuth(request);
        // if (!adminId) {
        //     return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        // }

        const { id: memberId } = await params;
        const body = await request.json();
        const { reason, adminId } = body;

        // Validar que se proporcione una razón
        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'La razón del rechazo es obligatoria' },
                { status: 400 }
            );
        }

        console.log(`❌ Rechazando miembro ${memberId}...`);
        console.log(`Razón: ${reason}`);

        // Rechazar en Memberstack
        const result = await rejectMemberApplication(
            memberId,
            reason,
            adminId || 'admin_temp'
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Enviar notificación de rechazo con razón
        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: 'Actualización de tu solicitud 📋',
            message: `Tu solicitud requiere cambios. Razón: ${reason}`,
            icon: '📋',
            link: '/completar-perfil'
        });

        console.log(`✅ Miembro ${memberId} rechazado exitosamente`);

        // Actualizar estados en Supabase
        const { error: supabaseError } = await supabaseAdmin
            .from('users')
            .update({
                approval_status: 'rejected',
                membership_status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: adminId || 'admin',
                rejection_reason: reason
            })
            .eq('memberstack_id', memberId);

        if (supabaseError) {
            console.error('❌ Error sincronizando estatus en Supabase:', supabaseError);
        }

        return NextResponse.json({
            success: true,
            message: 'Miembro rechazado',
            member: result.data,
        });

    } catch (error: any) {
        console.error('Error rechazando miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
