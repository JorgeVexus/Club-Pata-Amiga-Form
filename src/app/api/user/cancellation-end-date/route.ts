import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { calculateDaysRemaining, formatDateForStorage } from '@/utils/membership-cancellation';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'Memberstack ID requerido' }, { status: 400 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ success: false, error: 'Stripe no esta configurado' }, { status: 500 });
        }

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, stripe_customer_id, email')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError) {
            console.error('[CANCELLATION-END-DATE] Error buscando usuario:', userError);
            return NextResponse.json({ success: false, error: 'Error interno consultando usuario' }, { status: 500 });
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let stripeCustomerId = user.stripe_customer_id;

        if (!stripeCustomerId && user.email) {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            stripeCustomerId = customers.data[0]?.id || null;
        }

        if (!stripeCustomerId) {
            return NextResponse.json({ success: false, error: 'No encontramos una suscripcion activa' }, { status: 404 });
        }

        const [activeSubs, trialingSubs] = await Promise.all([
            stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 10 }),
            stripe.subscriptions.list({ customer: stripeCustomerId, status: 'trialing', limit: 10 }),
        ]);

        const subscription = [...activeSubs.data, ...trialingSubs.data]
            .sort((a: any, b: any) => (b.current_period_end || 0) - (a.current_period_end || 0))[0] as any;

        if (!subscription?.current_period_end) {
            return NextResponse.json({ success: false, error: 'No tienes una membresia activa para cancelar' }, { status: 404 });
        }

        const endDate = new Date(subscription.current_period_end * 1000);

        return NextResponse.json({
            success: true,
            endDate: formatDateForStorage(endDate),
            daysRemaining: calculateDaysRemaining(endDate),
            subscriptionStatus: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
        });
    } catch (error: any) {
        console.error('[CANCELLATION-END-DATE] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error calculando fecha de finalizacion' }, { status: 500 });
    }
}
