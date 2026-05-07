/**
 * API Endpoint: GET /api/user/payment-method
 *
 * Obtiene el método de pago predeterminado del cliente en Stripe de forma segura (server-side).
 * Solo devuelve información no sensible: últimos 4 dígitos, marca, tipo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { success: false, error: 'Stripe no está configurado' },
                { status: 503 }
            );
        }

        console.log(`[PAYMENT-METHOD] Consultando método de pago para: ${memberstackId}`);

        // 1. Obtener stripe_customer_id y email desde Supabase
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id, email')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let stripeCustomerId = user.stripe_customer_id;

        // Si no tenemos el ID almacenado, buscamos por email
        if (!stripeCustomerId && user.email) {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                // Guardarlo para futuras consultas
                await supabaseAdmin
                    .from('users')
                    .update({ stripe_customer_id: stripeCustomerId })
                    .eq('memberstack_id', memberstackId);
            }
        }

        if (!stripeCustomerId) {
            return NextResponse.json({
                success: true,
                paymentMethod: null,
                message: 'Sin métodos de pago registrados',
            });
        }

        // 2. Obtener el método de pago predeterminado del cliente
        const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;

        let defaultPaymentMethodId = customer.invoice_settings?.default_payment_method as string | null;

        // Si no hay uno predeterminado, tomamos el primero
        if (!defaultPaymentMethodId) {
            const paymentMethods = await stripe.paymentMethods.list({
                customer: stripeCustomerId,
                type: 'card',
                limit: 1,
            });
            if (paymentMethods.data.length > 0) {
                defaultPaymentMethodId = paymentMethods.data[0].id;
            }
        }

        if (!defaultPaymentMethodId) {
            return NextResponse.json({
                success: true,
                paymentMethod: null,
                message: 'Sin métodos de pago registrados',
            });
        }

        const pm = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

        // 3. Devolver solo información no sensible
        const safePaymentInfo = {
            brand: pm.card?.brand || 'unknown',           // 'mastercard', 'visa', etc.
            last4: pm.card?.last4 || '****',              // Últimos 4 dígitos
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
            funding: pm.card?.funding || 'credit',        // 'credit', 'debit', 'prepaid'
        };

        console.log(`[PAYMENT-METHOD] Método de pago encontrado: ${safePaymentInfo.brand} ****${safePaymentInfo.last4}`);

        return NextResponse.json({
            success: true,
            paymentMethod: safePaymentInfo,
        });

    } catch (error: any) {
        console.error('[PAYMENT-METHOD] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error consultando método de pago' },
            { status: 500 }
        );
    }
}
