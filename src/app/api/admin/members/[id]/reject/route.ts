/**
 * API Route: /api/admin/members/[id]/reject
 * Rechaza la solicitud de un miembro con una razón
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectMemberApplication } from '@/services/memberstack-admin.service';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // TODO: Validar que el usuario sea admin
        // const adminId = await validateAdminAuth(request);
        // if (!adminId) {
        //     return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        // }

        const memberId = params.id;
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

        // TODO: Enviar email de rechazo con la razón
        // await sendRejectionEmail(result.data.auth.email, reason);

        // TODO: Actualizar en Supabase
        // await updateSupabaseApprovalStatus(memberId, 'rejected', reason);

        console.log(`✅ Miembro ${memberId} rechazado exitosamente`);

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
