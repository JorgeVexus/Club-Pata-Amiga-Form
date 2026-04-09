import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST: Refund a rejected member's payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    try {
        const { id: memberId } = await params;

        // Verify the member exists and is rejected
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('memberstack_id, approval_status, stripe_customer_id, first_name, last_name')
            .eq('memberstack_id', memberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404 });
        }

        if (user.approval_status !== 'rejected') {
            return NextResponse.json({ error: 'Solo los miembros rechazados pueden ser reembolsados' }, { status: 400 });
        }

        // Find the customer's payments in Stripe
        let stripeCustomerId = user.stripe_customer_id;

        // If we don't have a stored Stripe customer ID, try to find by email via Memberstack
        if (!stripeCustomerId) {
            // Search by email in Stripe
            const { data: memberData } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('memberstack_id', memberId)
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
            expand: ['data.latest_charge'],
        });

        // Find the most recent successful payment with a positive amount
        const successfulPayment = paymentIntents.data.find(
            (pi) => pi.status === 'succeeded' && pi.amount_received > 0
        );

        if (!successfulPayment) {
            // Check if there are any payment intents at all to provide a better message
            if (paymentIntents.data.length === 0) {
                return NextResponse.json({
                    error: 'No se encontraron registros de pago en Stripe para este cliente. Es posible que haya usado un cupón del 100% o que el registro haya sido gratuito.',
                }, { status: 404 });
            }

            return NextResponse.json({
                error: 'No se encontró un pago exitoso (mayor a $0) para este cliente. Si usó un cupón del 100%, no hay monto disponible para reembolsar.',
            }, { status: 404 });
        }

        // Check if already refunded using the charge information
        const latestCharge = successfulPayment.latest_charge as Stripe.Charge;
        if (latestCharge && latestCharge.refunded) {
            return NextResponse.json({
                error: 'Este pago ya ha sido totalmente reembolsado en Stripe.',
            }, { status: 400 });
        }

        if (latestCharge && latestCharge.amount_refunded > 0 && latestCharge.amount_refunded === latestCharge.amount) {
            return NextResponse.json({
                error: 'Este pago ya fue reembolsado anteriormente.',
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
            .eq('memberstack_id', memberId);

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
