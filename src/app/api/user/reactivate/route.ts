import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';

/**
 * POST /api/user/reactivate
 * Reactiva una membresía cancelada (quita cancel_at_period_end de Stripe)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId } = body;

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400 }
            );
        }

        // Verificar configuración
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { success: false, error: 'Stripe no está configurado' },
                { status: 503 }
            );
        }

        // Inicializar Stripe aquí (no a nivel de módulo para evitar errores en build)
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        // 1. Obtener stripe_customer_id desde Supabase
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

        if (!user.stripe_customer_id) {
            return NextResponse.json(
                { success: false, error: 'Usuario sin suscripción en Stripe' },
                { status: 400 }
            );
        }

        // 2. Buscar suscripción activa/cancelada en Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: 'all',
            limit: 10,
        });

        const relevantSubs = subscriptions.data.filter(s => 
            s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
        );

        if (relevantSubs.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No se encontró suscripción activa en Stripe' },
                { status: 400 }
            );
        }

        const stripeSubscriptionId = relevantSubs[0].id;

        // 3. Reactivar en Stripe (quitar cancel_at_period_end)
        await stripe.subscriptions.update(stripeSubscriptionId, {
            cancel_at_period_end: false,
        });

        console.log(`🔄 [REACTIVATE] Suscripción ${stripeSubscriptionId} reactivada para miembro ${memberstackId}`);

        // 4. Actualizar estado en Memberstack (approval_status = 'approved')
        if (process.env.MEMBERSTACK_SECRET_KEY) {
            try {
                await fetch(`https://api.memberstack.com/v1/members/${memberstackId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customFields: {
                            'approval-status': 'approved',
                        }
                    })
                });
            } catch (err) {
                console.warn('⚠️ [REACTIVATE] No se pudo actualizar Memberstack:', err);
            }
        }

        // 5. Actualizar en nuestra DB (payment_methods.is_cancelled = false)
        if (isSupabaseAdminConfigured() && supabaseAdmin) {
            await supabaseAdmin
                .from('payment_methods')
                .update({
                    is_cancelled: false,
                    cancelled_at: null,
                    membership_end_date: null,
                    cancel_at_period_end: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('memberstack_id', memberstackId);
        }

        return NextResponse.json({
            success: true,
            message: 'Membresía reactivada correctamente'
        });

    } catch (error: any) {
        console.error('[REACTIVATE] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error reactivando membresía' },
            { status: 500 }
        );
    }
}