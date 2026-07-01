/**
 * Webhook de Stripe — sincroniza eventos de facturación con el CRM Lynsales.
 *
 * Eventos manejados (ver Requerimientos_PataAmiga_v1, sección 2.2):
 *  - invoice.payment_succeeded (renovación) → fecha_pago_renovacion + fecha_renovacion
 *  - invoice.payment_failed                 → estatus pendiente_pago
 *  - customer.subscription.deleted (churn por impago) → estatus no_renovado + quitar tag
 *
 * Requiere STRIPE_WEBHOOK_SECRET en variables de entorno.
 * El endpoint NO debe parsear el body como JSON antes de verificar la firma.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { syncMembership, removeContactTags, CRM_ACTIVE_TAG } from '@/services/crm.service';
import { toCrmDate, getStripeMembershipFields } from '@/lib/stripe-membership';

// El body debe leerse crudo para verificar la firma
export const runtime = 'nodejs';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Resuelve el crm_contact_id de un usuario a partir del customer de Stripe.
 * Busca primero por stripe_customer_id y, si falla, por email.
 */
async function resolveCrmContactId(
    stripeCustomerId: string | null,
    email: string | null
): Promise<string | null> {
    if (stripeCustomerId) {
        const { data } = await supabaseAdmin
            .from('users')
            .select('crm_contact_id')
            .eq('stripe_customer_id', stripeCustomerId)
            .maybeSingle();
        if (data?.crm_contact_id) return data.crm_contact_id;
    }
    if (email) {
        const { data } = await supabaseAdmin
            .from('users')
            .select('crm_contact_id')
            .eq('email', email)
            .maybeSingle();
        if (data?.crm_contact_id) return data.crm_contact_id;
    }
    return null;
}

export async function POST(request: NextRequest) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!secret || !stripeKey) {
        console.error('[Stripe Webhook] Falta STRIPE_WEBHOOK_SECRET o STRIPE_SECRET_KEY');
        return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const signature = request.headers.get('stripe-signature');
    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature!, secret);
    } catch (err: any) {
        console.error('[Stripe Webhook] Firma inválida:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                // Solo renovaciones (ciclo/actualización); el primer pago lo maneja la aprobación
                const isRenewal =
                    invoice.billing_reason === 'subscription_cycle' ||
                    invoice.billing_reason === 'subscription_update';
                if (!isRenewal) break;

                const contactId = await resolveCrmContactId(
                    invoice.customer,
                    invoice.customer_email
                );
                if (!contactId) {
                    console.warn('[Stripe Webhook] Renovación sin crm_contact_id, se omite');
                    break;
                }

                const paidAt = toCrmDate(invoice.status_transitions?.paid_at || invoice.created);

                // El campo de suscripción cambió de lugar según la versión de API de Stripe:
                // versiones nuevas usan invoice.parent.subscription_details.subscription.
                const subscriptionId =
                    invoice.subscription ||
                    invoice.parent?.subscription_details?.subscription ||
                    invoice.lines?.data?.[0]?.subscription ||
                    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

                let stripeFields = {};
                if (subscriptionId) {
                    stripeFields = await getStripeMembershipFields(stripe, subscriptionId);
                }

                await syncMembership(contactId, {
                    status: 'activo',
                    renewalPaymentDate: paidAt,
                    ...stripeFields, // incluye renewalDate (próximo cobro) y paymentMethod
                });
                console.log('[Stripe Webhook] ✅ Renovación sincronizada con CRM:', contactId);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                const contactId = await resolveCrmContactId(
                    invoice.customer,
                    invoice.customer_email
                );
                if (!contactId) break;

                await syncMembership(contactId, { status: 'pendiente_pago' });
                console.log('[Stripe Webhook] ⚠️ Pago fallido sincronizado con CRM:', contactId);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                // Solo tratar como "no renovado" el churn por impago;
                // la cancelación voluntaria ya la maneja /api/user/deactivate (estatus cancelado).
                const reason = subscription.cancellation_details?.reason;
                if (reason !== 'payment_failed') break;

                const customerId = subscription.customer;
                let email: string | null = null;
                try {
                    const customer = (await stripe.customers.retrieve(customerId)) as any;
                    email = customer?.email || null;
                } catch { /* best-effort */ }

                const contactId = await resolveCrmContactId(customerId, email);
                if (!contactId) break;

                await syncMembership(contactId, { status: 'no_renovado' });
                await removeContactTags(contactId, [CRM_ACTIVE_TAG]);
                console.log('[Stripe Webhook] ⚠️ No renovado (churn) sincronizado con CRM:', contactId);
                break;
            }

            default:
                // Otros eventos no son relevantes para el CRM
                break;
        }
    } catch (error: any) {
        // No devolvemos 500 para evitar reintentos infinitos de Stripe por errores del CRM;
        // el fallo queda registrado en logs.
        console.error(`[Stripe Webhook] Error procesando ${event.type}:`, error.message);
    }

    return NextResponse.json({ received: true });
}
