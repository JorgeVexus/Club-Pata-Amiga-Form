import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

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

        console.log(`[DEACTIVATE] Iniciando desactivación para miembro: ${memberstackId}`);

        // 1. Obtener usuario de Supabase
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

        // 2. Cancelar suscripciones en Stripe
        if (process.env.STRIPE_SECRET_KEY) {
            try {
                console.log('[DEACTIVATE] Buscando suscripciones en Stripe...');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                let stripeCustomerId = user.stripe_customer_id;

                if (!stripeCustomerId && user.email) {
                    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                    if (customers.data.length > 0) {
                        stripeCustomerId = customers.data[0].id;
                    }
                }

                if (stripeCustomerId) {
                    const activeSubs = await stripe.subscriptions.list({
                        customer: stripeCustomerId,
                        status: 'active',
                        limit: 10,
                    });
                    const trialingSubs = await stripe.subscriptions.list({
                        customer: stripeCustomerId,
                        status: 'trialing',
                        limit: 10,
                    });

                    const allSubs = [...activeSubs.data, ...trialingSubs.data];

                    if (allSubs.length > 0) {
                        console.log(`[DEACTIVATE] Cancelando ${allSubs.length} suscripciones para: ${stripeCustomerId}`);
                        for (const sub of allSubs) {
                            await stripe.subscriptions.cancel(sub.id);
                            console.log(`[DEACTIVATE] Suscripción cancelada: ${sub.id}`);
                        }
                    } else {
                        console.log('[DEACTIVATE] No se encontraron suscripciones activas.');
                    }
                }
            } catch (stripeError: any) {
                console.error('[DEACTIVATE] Error cancelando suscripciones Stripe:', stripeError.message);
                // No bloqueamos la baja, pero lo registramos
            }
        }

        // 3. Actualizar estado en Supabase a 'cancelled'
        console.log('[DEACTIVATE] Actualizando estado en Supabase...');
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                approval_status: 'cancelled',
                rejection_reason: 'Cancelado por el usuario desde configuración',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('[DEACTIVATE] Error actualizando Supabase:', updateError);
            return NextResponse.json({ success: false, error: 'Error desactivando cuenta' }, { status: 500 });
        }

        // 4. Actualizar estado en Memberstack
        console.log('[DEACTIVATE] Actualizando campos en Memberstack...');
        const msResult = await memberstackAdmin.updateMemberFields(memberstackId, {
            'approval-status': 'cancelled',
            'rejection-reason': 'Cancelado por el usuario desde configuración'
        });

        if (!msResult.success) {
            console.error('[DEACTIVATE] Error actualizando Memberstack:', msResult.error);
        }

        console.log(`[DEACTIVATE] Desactivación completada exitosamente para ${memberstackId}`);
        return NextResponse.json({ success: true, message: 'Cuenta desactivada correctamente' });

    } catch (error: any) {
        console.error('[DEACTIVATE] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 });
    }
}
