import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import {
    calculateDaysRemaining,
    formatDateForStorage,
    normalizeCancellationRequest,
} from '@/utils/membership-cancellation';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId } = body;

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'Memberstack ID requerido' }, { status: 400 });
        }

        let cancellationInfo;
        try {
            cancellationInfo = normalizeCancellationRequest(body);
        } catch (error: any) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        console.log(`[DEACTIVATE] Iniciando cancelacion de membresia para miembro: ${memberstackId}`);

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, stripe_customer_id, email')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError) {
            console.error('[DEACTIVATE] Error buscando usuario en Supabase:', userError);
            return NextResponse.json({ success: false, error: 'Error interno consultando usuario' }, { status: 500 });
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        let cancellationRecord = {
            membershipEndDate: formatDateForStorage(new Date()),
            daysRemaining: 0,
            stripeSubscriptionId: null as string | null,
            stripeCustomerId: user.stripe_customer_id as string | null,
            subscriptionInterval: null as string | null,
        };

        if (process.env.STRIPE_SECRET_KEY) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                let stripeCustomerId = user.stripe_customer_id;

                if (!stripeCustomerId && user.email) {
                    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                    stripeCustomerId = customers.data[0]?.id || null;
                }

                if (stripeCustomerId) {
                    cancellationRecord.stripeCustomerId = stripeCustomerId;

                    const [activeSubs, trialingSubs] = await Promise.all([
                        stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 10 }),
                        stripe.subscriptions.list({ customer: stripeCustomerId, status: 'trialing', limit: 10 }),
                    ]);

                    const allSubs = [...activeSubs.data, ...trialingSubs.data];
                    const primarySub = allSubs
                        .sort((a: any, b: any) => (b.current_period_end || 0) - (a.current_period_end || 0))[0] as any;

                    if (primarySub?.current_period_end) {
                        const endDate = new Date(primarySub.current_period_end * 1000);
                        cancellationRecord = {
                            membershipEndDate: formatDateForStorage(endDate),
                            daysRemaining: calculateDaysRemaining(endDate),
                            stripeSubscriptionId: primarySub.id,
                            stripeCustomerId,
                            subscriptionInterval: primarySub.items?.data?.[0]?.price?.recurring?.interval || null,
                        };
                    }

                    for (const sub of allSubs) {
                        await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
                        console.log(`[DEACTIVATE] Suscripcion marcada para cancelar al fin del periodo: ${sub.id}`);
                    }
                }
            } catch (stripeError: any) {
                console.error('[DEACTIVATE] Error programando cancelacion Stripe:', stripeError.message);
            }
        }

        const { error: cancellationError } = await supabaseAdmin
            .from('membership_cancellations')
            .insert({
                user_id: user.id,
                memberstack_id: memberstackId,
                membership_end_date: cancellationRecord.membershipEndDate,
                days_remaining_at_cancellation: cancellationRecord.daysRemaining,
                cancellation_reason: cancellationInfo.reason,
                reason_other_text: cancellationInfo.reasonOtherText,
                comments: cancellationInfo.comments,
                stripe_subscription_id: cancellationRecord.stripeSubscriptionId,
                stripe_customer_id: cancellationRecord.stripeCustomerId,
                subscription_interval: cancellationRecord.subscriptionInterval,
            });

        if (cancellationError) {
            console.error('[DEACTIVATE] Error guardando auditoria de cancelacion:', cancellationError);
            return NextResponse.json({ success: false, error: 'Error guardando la cancelacion' }, { status: 500 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                approval_status: 'cancelled',
                rejection_reason: 'Membresia cancelada por el usuario',
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('[DEACTIVATE] Error actualizando Supabase:', updateError);
            return NextResponse.json({ success: false, error: 'Error cancelando membresia' }, { status: 500 });
        }

        const msResult = await memberstackAdmin.updateMemberFields(memberstackId, {
            'approval-status': 'cancelled',
            'rejection-reason': 'Membresia cancelada por el usuario',
            'membership-end-date': cancellationRecord.membershipEndDate,
        });

        if (!msResult.success) {
            console.error('[DEACTIVATE] Error actualizando Memberstack:', msResult.error);
        }

        return NextResponse.json({
            success: true,
            message: 'Membresia cancelada correctamente',
            cancellation: {
                endDate: cancellationRecord.membershipEndDate,
                daysRemaining: cancellationRecord.daysRemaining,
            },
        });
    } catch (error: any) {
        console.error('[DEACTIVATE] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 });
    }
}
