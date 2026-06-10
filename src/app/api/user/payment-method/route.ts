/**
 * API Endpoint: GET /api/user/payment-method
 *
 * Obtiene el método de pago predeterminado del cliente en Stripe de forma segura (server-side).
 * Solo devuelve información no sensible: últimos 4 dígitos, marca, tipo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import Stripe from 'stripe';

// Usar el cliente administrativo centralizado
const supabaseAdminClient = supabaseAdmin;

export async function GET(request: NextRequest) {
    // Verificar configuración
    if (!isSupabaseAdminConfigured() || !supabaseAdminClient) {
        console.error('❌ Supabase Admin not configured in /api/user/payment-method');
        return NextResponse.json(
            { success: false, error: 'Servicio de base de datos no disponible' },
            { status: 500 }
        );
    }

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
        const { data: user, error: userError } = await supabaseAdminClient
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
                // No lo guardamos en Supabase ya que la columna no existe o es volátil
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

        // 4. Preparar respuesta segura
        const safePaymentInfo: any = {
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '****',
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
            funding: pm.card?.funding || 'credit',
            next_payment_date: null,
            plan_name: null,
            plan_cost: null,
            interval: null,
            _debug_sub: null,
            // 🆕 Cancelación (para detectar si el usuario canceló desde Stripe Portal)
            is_cancelled: false,
            cancelled_at: null,
            membership_end_date: null,
            cancel_at_period_end: false,
        };

        // 3. Buscar la suscripción activa para obtener detalles de la membresía
        try {
            // Buscamos suscripciones activas o en trial
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: 'all',
                limit: 10,
            });

            console.log(`[PAYMENT-METHOD] Suscripciones encontradas (all): ${subscriptions.data.length}`);

            // Filtrar las que sean active o trialing
            const relevantSubs = subscriptions.data.filter(s => s.status === 'active' || s.status === 'trialing');

            if (relevantSubs.length > 0) {
                // Recuperar el objeto completo para asegurar que todas las propiedades están presentes
                const subId = relevantSubs[0].id;
                const sub = await stripe.subscriptions.retrieve(subId) as any;

                console.log(`[PAYMENT-METHOD] Recuperada Sub: ${sub.id}, Status: ${sub.status}`);

                const firstItem = sub.items?.data?.[0];

                // Estrategia de extracción de current_period_end (en orden de confiabilidad):
                // 1. Desde el item (fuente canónica en API Stripe reciente)
                // 2. Desde el top-level (presente en versiones antiguas de la API)
                // 3. trial_end si aplica
                // 4. billing_cycle_anchor como último recurso de referencia
                let periodEnd: number | null =
                    firstItem?.current_period_end ??
                    sub.current_period_end ??
                    (sub.trial_end ? sub.trial_end : null) ??
                    null;

                // Último recurso: billing_cycle_anchor (indica el inicio del ciclo, no el fin,
                // pero podemos calcular el siguiente ciclo si conocemos el intervalo)
                if (!periodEnd && sub.billing_cycle_anchor && firstItem?.price?.recurring?.interval) {
                    const anchor: number = sub.billing_cycle_anchor;
                    const interval: string = firstItem.price.recurring.interval;
                    const intervalCount: number = firstItem.price.recurring.interval_count || 1;
                    const now = Math.floor(Date.now() / 1000);
                    let next = anchor;
                    // Avanzar el anchor hasta que sea futuro
                    while (next <= now) {
                        if (interval === 'month') {
                            const d = new Date(next * 1000);
                            d.setMonth(d.getMonth() + intervalCount);
                            next = Math.floor(d.getTime() / 1000);
                        } else if (interval === 'year') {
                            const d = new Date(next * 1000);
                            d.setFullYear(d.getFullYear() + intervalCount);
                            next = Math.floor(d.getTime() / 1000);
                        } else if (interval === 'week') {
                            next += 7 * 24 * 3600 * intervalCount;
                        } else {
                            next += 30 * 24 * 3600 * intervalCount; // fallback 30 días
                        }
                    }
                    periodEnd = next;
                    console.log(`[PAYMENT-METHOD] periodEnd calculado desde billing_cycle_anchor: ${new Date(periodEnd * 1000).toISOString()}`);
                }

                if (periodEnd) {
                    safePaymentInfo.next_payment_date = new Date(periodEnd * 1000).toISOString();
                    console.log(`[PAYMENT-METHOD] next_payment_date: ${safePaymentInfo.next_payment_date}`);
                } else {
                    console.warn('[PAYMENT-METHOD] No se pudo determinar next_payment_date');
                }

                safePaymentInfo._debug_sub = {
                    id: sub.id,
                    status: sub.status,
                    billing_cycle_anchor: sub.billing_cycle_anchor,
                    top_level_period_end: sub.current_period_end ?? 'N/A',
                    item_period_end: firstItem?.current_period_end ?? 'N/A',
                    trial_end: sub.trial_end ?? 'N/A',
                    resolved_period_end: periodEnd,
                    all_keys: Object.keys(sub).slice(0, 40)
                };

                // Obtener detalles del plan
                const item = sub.items.data[0];
                if (item && item.price) {
                    safePaymentInfo.plan_cost = (item.price.unit_amount || 0) / 100;
                    const intervalRaw = item.price.recurring?.interval;
                    safePaymentInfo.interval = intervalRaw === 'year' ? 'Anual' : 'Mensual';
                    safePaymentInfo.plan_name = safePaymentInfo.interval;
                }

                // 🆕 Detectar cancelación (cancel_at_period_end = true significa que el usuario canceló desde Stripe Portal)
                if (sub.cancel_at_period_end === true) {
                    safePaymentInfo.is_cancelled = true;
                    safePaymentInfo.cancel_at_period_end = true;
                    safePaymentInfo.cancelled_at = sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null;
                    // La fecha de fin de membresía es el current_period_end (cuando termina el periodo pagado)
                    if (periodEnd) {
                        safePaymentInfo.membership_end_date = new Date(periodEnd * 1000).toISOString();
                    }
                    console.log(`[PAYMENT-METHOD] Suscripción cancelada detectada. Fin de cobertura: ${safePaymentInfo.membership_end_date}`);
                }
            }
        } catch (subErr) {
            console.error('[PAYMENT-METHOD] Error Stripe Sub:', subErr);
        }

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
