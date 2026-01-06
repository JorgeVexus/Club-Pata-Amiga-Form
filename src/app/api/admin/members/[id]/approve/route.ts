/**
 * API Route: /api/admin/members/[id]/approve
 * Aprueba la solicitud de un miembro
 */

import { NextRequest, NextResponse } from 'next/server';
import { approveMemberApplication } from '@/services/memberstack-admin.service';
import { registerUserInSupabase } from '@/app/actions/user.actions';
import { createServerNotification } from '@/app/actions/notification.actions';

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
        const adminId = body.adminId || 'admin_temp'; // TODO: Obtener del token de sesión

        console.log(`📝 Aprobando miembro ${memberId}...`);

        // Aprobar en Memberstack
        const result = await approveMemberApplication(memberId, adminId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Enviar notificación de aprobación
        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: '¡Tu solicitud ha sido aprobada! 🎉',
            message: 'Bienvenido a Club Pata Amiga. Tu membresía ya está activa y puedes disfrutar de todos los beneficios.',
            icon: '🎉',
            link: '/dashboard'
        });

        console.log(`✅ Miembro ${memberId} aprobado exitosamente`);

        return NextResponse.json({
            success: true,
            message: 'Miembro aprobado exitosamente',
            member: result.data,
        });

    } catch (error: any) {
        console.error('Error aprobando miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
