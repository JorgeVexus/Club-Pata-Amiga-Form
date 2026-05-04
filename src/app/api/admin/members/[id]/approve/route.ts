/**
 * API Route: /api/admin/members/[id]/approve
 * Aprueba la solicitud de un miembro y sincroniza con CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { approveMemberApplication, getMemberDetails } from '@/services/memberstack-admin.service';
import { registerUserInSupabase } from '@/app/actions/user.actions';
import { createServerNotification } from '@/app/actions/notification.actions';
import { updateContactAsActive } from '@/services/crm.service';

import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

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
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();
        const adminId = adminUser.memberstack_id;

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
            const memberEmail = result.data?.auth?.email;
            console.log('🔍 CRM Debug: Buscando usuario. memberstack_id:', memberId, 'email:', memberEmail);

            // Primero intentar por memberstack_id
            let { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('crm_contact_id, email')
                .eq('memberstack_id', memberId)
                .single();

            // Si no encuentra, intentar por email
            if (!user && memberEmail) {
                console.log('🔄 CRM: No encontrado por memberstack_id, intentando por email...');
                const emailResult = await supabaseAdmin
                    .from('users')
                    .select('crm_contact_id, email')
                    .eq('email', memberEmail)
                    .single();
                user = emailResult.data;
                userError = emailResult.error;
            }

            console.log('🔍 CRM Debug: Resultado query:', {
                found: !!user,
                crm_contact_id: user?.crm_contact_id,
                error: userError?.message
            });

            if (user?.crm_contact_id) {
                // 1. Obtener detalles del plan desde Memberstack
                const memberDetails = await getMemberDetails(memberId);
                let planType = 'Mensual'; // Fallback
                let planCost = '$159';

                if (memberDetails.success && memberDetails.data?.planConnections?.length) {
                    const activePlan = memberDetails.data.planConnections.find(p => p.status === 'ACTIVE') || memberDetails.data.planConnections[0];
                    const priceId = activePlan.priceId;

                    // Mapeo de precios
                    // PRD: prc_mensual-452k30jah / prc_anual-o9d101ta
                    if (priceId === 'prc_anual-o9d101ta') {
                        planType = 'Anual';
                        planCost = '$1,699';
                    } else {
                        // Default mensual
                        planType = 'Mensual';
                        planCost = '$159';
                    }
                    console.log(`💳 CRM: Detectado plan ${planType} (${planCost})`);
                }

                const crmResult = await updateContactAsActive(
                    user.crm_contact_id,
                    planType,
                    planCost
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

        // Actualizar estados en Supabase
        const { error: supabaseError } = await supabaseAdmin
            .from('users')
            .update({
                approval_status: 'approved',
                membership_status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: adminId || 'admin'
            })
            .eq('memberstack_id', memberId);

        if (supabaseError) {
            console.error('❌ Error sincronizando estatus en Supabase:', supabaseError);
            // No fallamos la respuesta principal porque Memberstack ya se actualizó
        }

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
