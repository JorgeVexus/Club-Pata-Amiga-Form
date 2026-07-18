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
import { sendRenewalReminderEmail } from '@/app/actions/comm.actions';

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
            case 'invoice.upcoming': {
                const invoice = event.data.object as any;
                console.log(`[Stripe Webhook] 🔔 Recordatorio de renovación (invoice.upcoming) para customer: ${invoice.customer}`);

                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('memberstack_id, email, first_name, last_name')
                    .eq('stripe_customer_id', invoice.customer)
                    .maybeSingle();

                if (user && user.email) {
                    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Miembro';
                    
                    let friendlyDate = 'próximamente';
                    const renewalTimestamp = invoice.next_payment_attempt || invoice.period_end;
                    if (renewalTimestamp) {
                        const dateObj = new Date(renewalTimestamp * 1000);
                        const monthsList = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                        friendlyDate = `${dateObj.getDate()} de ${monthsList[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
                    }

                    const amountVal = invoice.amount_due ? (invoice.amount_due / 100).toFixed(2) : '0.00';
                    const currencyVal = (invoice.currency || 'mxn').toUpperCase();
                    const friendlyAmount = `$${amountVal} ${currencyVal}`;

                    await sendRenewalReminderEmail({
                        userId: user.memberstack_id || '',
                        email: user.email,
                        name: fullName,
                        renewalDate: friendlyDate,
                        amount: friendlyAmount
                    });
                    console.log(`[Stripe Webhook] ✅ Email de recordatorio de renovación enviado a ${user.email}`);
                } else {
                    console.warn(`[Stripe Webhook] Usuario no encontrado en BD para customer Stripe ${invoice.customer}, se omite correo.`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const paidAt = toCrmDate(invoice.status_transitions?.paid_at || invoice.created);

                // El campo de suscripción cambió de lugar según la versión de API de Stripe:
                // versiones nuevas usan invoice.parent.subscription_details.subscription.
                const subscriptionId =
                    invoice.subscription ||
                    invoice.parent?.subscription_details?.subscription ||
                    invoice.lines?.data?.[0]?.subscription ||
                    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

                let stripeFields: any = {};
                if (subscriptionId) {
                    stripeFields = await getStripeMembershipFields(stripe, subscriptionId);
                }

                // Guardar en Supabase para todos los pagos (primer pago y renovaciones)
                try {
                    const userEmail = invoice.customer_email;
                    const customerId = invoice.customer;

                    const { data: dbUser } = await supabaseAdmin
                        .from('users')
                        .select('id, first_payment_at')
                        .or(`email.eq.${userEmail},stripe_customer_id.eq.${customerId}`)
                        .maybeSingle();

                    if (dbUser) {
                        const updateData: any = {
                            payment_completed_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
                        };
                        if (!dbUser.first_payment_at) updateData.first_payment_at = updateData.payment_completed_at;
                        if (stripeFields.couponCode) {
                            updateData.coupon_code = stripeFields.couponCode;
                        }
                        await supabaseAdmin
                            .from('users')
                            .update(updateData)
                            .eq('id', dbUser.id);
                        console.log('[Stripe Webhook] ✅ Supabase actualizado con fecha de pago y cupón:', updateData);
                    }
                } catch (dbErr) {
                    console.error('[Stripe Webhook] Error actualizando Supabase:', dbErr);
                }

                // Solo renovaciones (ciclo/actualización); el primer pago lo maneja la aprobación
                const isRenewal =
                    invoice.billing_reason === 'subscription_cycle' ||
                    invoice.billing_reason === 'subscription_update';
                if (!isRenewal) {
                    console.log('[Stripe Webhook] Primer pago detectado, omitiendo sync CRM (lo maneja la aprobación)');
                    break;
                }

                const contactId = await resolveCrmContactId(
                    invoice.customer,
                    invoice.customer_email
                );
                if (!contactId) {
                    console.warn('[Stripe Webhook] Renovación sin crm_contact_id, se omite');
                    break;
                }

                await syncMembership(contactId, {
                    status: 'activo',
                    renewalPaymentDate: paidAt,
                    ...stripeFields, // incluye renewalDate (próximo cobro), paymentMethod y couponCode
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
                const cancellationReason = subscription.cancellation_details?.reason;
                const isVoluntary = cancellationReason !== 'payment_failed';

                const customerId = subscription.customer;
                let email: string | null = null;
                try {
                    const customer = (await stripe.customers.retrieve(customerId)) as any;
                    email = customer?.email || null;
                } catch { /* best-effort */ }

                const contactId = await resolveCrmContactId(customerId, email);

                if (isVoluntary) {
                    // Cancelación voluntaria: el usuario ya estaba en 'pending_cancellation'.
                    // El período pagado terminó → cerrar el ciclo definitivamente en Supabase.
                    if (email) {
                        await supabaseAdmin
                            .from('users')
                            .update({
                                approval_status: 'cancelled',
                                membership_status: 'cancelled',
                            })
                            .eq('email', email);
                        console.log('[Stripe Webhook] ✅ Cancelación voluntaria completada en Supabase para:', email);
                    }
                    // Sync CRM solo si tenemos el contactId
                    if (contactId) {
                        await syncMembership(contactId, { 
                            status: 'cancelado',
                            tags: ['miembro inactivo']
                        });
                        console.log('[Stripe Webhook] ✅ Cancelación voluntaria sincronizada con CRM:', contactId);
                    }
                } else {
                    // Churn por impago: marcar como no_renovado en CRM
                    if (contactId) {
                        await syncMembership(contactId, { 
                            status: 'no_renovado',
                            tags: ['miembro inactivo']
                        });
                    }
                    // También cerrar en Supabase
                    if (email) {
                        await supabaseAdmin
                            .from('users')
                            .update({
                                approval_status: 'cancelled',
                                membership_status: 'cancelled',
                            })
                            .eq('email', email);
                    }
                    console.log('[Stripe Webhook] ⚠️ No renovado (churn) sincronizado con CRM:', contactId);
                }
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
