/**
 * API Route: /api/admin/members/[id]/approve
 * Aprueba la solicitud de un miembro
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { approveMemberApplication } from '@/services/memberstack-admin.service';
import { registerUserInSupabase } from '@/app/actions/user.actions';
import { createServerNotification } from '@/app/actions/notification.actions';
import { updateContactAsActive } from '@/services/crm.service';

// Cliente Supabase para obtener crm_contact_id
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

        // Sincronizar con CRM - Marcar como "miembro activo"
        try {
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('crm_contact_id, membership_type, membership_cost')
                .eq('memberstack_id', memberId)
                .single();

            if (user?.crm_contact_id) {
                const crmResult = await updateContactAsActive(
                    user.crm_contact_id,
                    user.membership_type || 'Mensual',
                    user.membership_cost || '$159'
                );
                console.log('✅ CRM: Miembro marcado como activo:', crmResult.success);
            } else {
                console.warn('⚠️ Usuario sin crm_contact_id, omitiendo sync CRM');
            }
        } catch (crmError) {
            console.error('⚠️ Error no crítico actualizando CRM:', crmError);
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
