import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// POST: Refund a rejected member's payment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const memberId = params.id;

        // Verify the member exists and is rejected
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('memberstack_id, status, stripe_customer_id, first_name, last_name')
            .eq('id', memberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.status !== 'rejected') {
            return NextResponse.json({ error: 'Only rejected members can be refunded' }, { status: 400 });
        }

        // Find the customer's payments in Stripe
        let stripeCustomerId = user.stripe_customer_id;

        // If we don't have a stored Stripe customer ID, try to find by email via Memberstack
        if (!stripeCustomerId) {
            // Search by email in Stripe
            const { data: memberData } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('id', memberId)
                .single();

            if (memberData?.email) {
                const customers = await stripe.customers.list({
                    email: memberData.email,
                    limit: 1,
                });

                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                }
            }
        }

        if (!stripeCustomerId) {
            return NextResponse.json({
                error: 'No se encontró al cliente en Stripe. Puede que no haya realizado ningún pago.',
            }, { status: 404 });
        }

        // Get the most recent payment intent for this customer
        const paymentIntents = await stripe.paymentIntents.list({
            customer: stripeCustomerId,
            limit: 5,
        });

        const successfulPayment = paymentIntents.data.find(
            (pi) => pi.status === 'succeeded'
        );

        if (!successfulPayment) {
            return NextResponse.json({
                error: 'No se encontró un pago exitoso para este cliente.',
            }, { status: 404 });
        }

        // Check if already refunded
        if (successfulPayment.amount_received === 0) {
            return NextResponse.json({
                error: 'Este pago ya fue reembolsado.',
            }, { status: 400 });
        }

        // Process the refund
        const refund = await stripe.refunds.create({
            payment_intent: successfulPayment.id,
            reason: 'requested_by_customer',
        });

        // Update user status in Supabase
        await supabaseAdmin
            .from('users')
            .update({
                refund_status: 'refunded',
                refund_date: new Date().toISOString(),
                refund_stripe_id: refund.id,
            })
            .eq('id', memberId);

        return NextResponse.json({
            success: true,
            refund: {
                id: refund.id,
                amount: refund.amount / 100, // Convert from cents to currency
                currency: refund.currency,
                status: refund.status,
            },
            message: `Reembolso de $${(refund.amount / 100).toFixed(2)} ${refund.currency.toUpperCase()} procesado exitosamente.`,
        });
    } catch (error: any) {
        console.error('❌ Error processing refund:', error);

        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json({
                error: `Error de Stripe: ${error.message}`,
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Error procesando el reembolso. Intenta de nuevo.',
        }, { status: 500 });
    }
}
