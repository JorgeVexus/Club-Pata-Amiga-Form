/**
 * API Route: /api/admin/members/[id]/approve
 * Aprueba la solicitud de un miembro y sincroniza con CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { approveMemberApplication, getMemberDetails } from '@/services/memberstack-admin.service';
import { registerUserInSupabase } from '@/app/actions/user.actions';
import { createServerNotification } from '@/app/actions/notification.actions';
import { syncMembership, CRM_ACTIVE_TAG } from '@/services/crm.service';
import { getStripeMembershipFields } from '@/lib/stripe-membership';
import { sendMembershipApprovedEmail } from '@/app/actions/comm.actions';

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
        const { membershipType, membershipCost } = body;
        const adminId = adminUser.memberstack_id;

        console.log(`📝 Aprobando miembro ${memberId}...`);

        // Aprobar en Memberstack
        const result = await approveMemberApplication(memberId, adminId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }        // Sincronizar con CRM - Marcar como "miembro activo"
        let stripeFields: any = {};
        try {
            const memberEmail = result.data?.auth?.email;
            console.log('🔍 CRM Debug: Buscando usuario. memberstack_id:', memberId, 'email:', memberEmail);

            // 0. Buscar el usuario en Supabase para obtener su crm_contact_id y datos de membresía previos
            let { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('crm_contact_id, email, membership_type, membership_cost')
                .eq('memberstack_id', memberId)
                .single();

            if (userError || !user) {
                // Reintento por email si falla por MS ID
                const memberEmail = request.nextUrl.searchParams.get('email');
                const emailResult = await supabaseAdmin
                    .from('users')
                    .select('crm_contact_id, email, membership_type, membership_cost')
                    .eq('email', memberEmail)
                    .single();
                user = emailResult.data;
                userError = emailResult.error;
            }

            console.log('🔍 CRM Debug: Resultado query:', {
                found: !!user,
                crm_contact_id: user?.crm_contact_id,
                membership_type: user?.membership_type,
                membership_cost: user?.membership_cost
            });

            if (user?.crm_contact_id) {
                // 1. Obtener detalles del plan desde Memberstack
                const memberDetails = await getMemberDetails(memberId);

                // Fallbacks jerárquicos: Body (Frontend) > Supabase > Default
                let planType = membershipType || user.membership_type || 'Mensual';
                let planCost = membershipCost || user.membership_cost || '$159';
                let subscriptionId: string | undefined;

                console.log(`💳 CRM: Metadata recibida del frontend: Type=${membershipType}, Cost=${membershipCost}`);

                if (memberDetails.success && memberDetails.data?.planConnections?.length) {
                    const activePlan = memberDetails.data.planConnections.find(p => p.status === 'ACTIVE') || memberDetails.data.planConnections[0];
                    const priceId = activePlan.priceId;
                    const planName = (activePlan.planName || '').toLowerCase();
                    const amount = activePlan.payment?.amount || 0;
                    subscriptionId = (activePlan as any).payment?.stripeSubscriptionId;

                    // Lógica idéntica a la del Dashboard Admin (stripe-data/route.ts)
                    const isAnnualKeyword = planName.includes('anual') || 
                                           planName.includes('annual') || 
                                           planName.includes('year') || 
                                           planName.includes('año');
                    
                    // Si tiene keyword anual O el monto es mayor a 1000 (indicador fuerte de plan anual de 1699 vs 159 mensual)
                    if (priceId === 'prc_anual-o9d101ta' || isAnnualKeyword || amount > 1000) {
                        planType = 'Anual';
                        planCost = amount > 1000 ? `$${amount.toLocaleString('es-MX')}` : '$1,699';
                    } else if (priceId === 'prc_mensual-452k30jah' || (amount > 0 && amount <= 1000)) {
                        planType = 'Mensual';
                        planCost = amount > 0 ? `$${amount.toLocaleString('es-MX')}` : '$159';
                    }
                    
                    console.log(`💳 CRM: Detectado plan ${planType} (${planCost}) desde Memberstack (ID: ${priceId}, Amount: ${amount})`);
                } else {
                    console.log(`💳 CRM: Usando datos de Supabase/Fallback: ${planType} (${planCost})`);
                }


                // 2. Obtener método de pago y fechas reales desde Stripe (best-effort)
                if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
                    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                    stripeFields = await getStripeMembershipFields(stripe, subscriptionId);
                    console.log('💳 CRM: Campos de Stripe:', stripeFields);
                }

                // 3. Sincronizar membresía completa: estatus activo + tag + tipo/costo + fechas/método
                const crmResult = await syncMembership(user.crm_contact_id, {
                    status: 'activo',
                    type: planType,
                    cost: planCost,
                    tags: [CRM_ACTIVE_TAG],
                    ...stripeFields,
                });
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

        // Enviar correo de aprobación transaccional
        try {
            const memberEmail = result.data?.auth?.email;
            const memberName = result.data?.customFields?.['first-name'] || 'Miembro';
            if (memberEmail) {
                await sendMembershipApprovedEmail({
                    userId: memberId,
                    email: memberEmail,
                    name: memberName
                });
                console.log(`[Approve] Email de aprobación enviado a ${memberEmail}`);
            }
        } catch (emailErr) {
            console.error('[Approve] Error enviando email de aprobación (no crítico):', emailErr);
        }

        // Actualizar estados en Supabase
        const updatePayload: any = {
            approval_status: 'approved',
            membership_status: 'active',
            approved_at: new Date().toISOString(),
            approved_by: adminId || 'admin'
        };

        if (stripeFields.paymentDate) {
            updatePayload.payment_completed_at = new Date(stripeFields.paymentDate).toISOString();
        }
        if (stripeFields.couponCode) {
            updatePayload.coupon_code = stripeFields.couponCode;
        }

        const { error: supabaseError } = await supabaseAdmin
            .from('users')
            .update(updatePayload)
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
