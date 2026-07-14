import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createServerNotification } from '@/app/actions/notification.actions';

const PLAN_PRICE_IDS = {
    mensual: 'prc_mensual-452k30jah',
    anual: 'prc_anual-o9d101ta'
};

const PLAN_DETAILS = {
    mensual: {
        type: 'Mensual',
        cost: '$159',
        priceId: 'prc_mensual-452k30jah'
    },
    anual: {
        type: 'Anual',
        cost: '$1,699',
        priceId: 'prc_anual-o9d101ta'
    }
};

/**
 * POST /api/user/change-plan
 * Realiza el upgrade o downgrade de la membresía en Stripe, Supabase y Memberstack
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const memberstackId = body.memberstackId;
        const targetPlan = body.targetPlan as 'mensual' | 'anual';

        if (!memberstackId || !targetPlan || (targetPlan !== 'mensual' && targetPlan !== 'anual')) {
            return NextResponse.json(
                { success: false, error: 'memberstackId y targetPlan (mensual o anual) son requeridos' },
                { status: 400 }
            );
        }

        const targetPlanInfo = PLAN_DETAILS[targetPlan];
        const targetPriceId = targetPlanInfo.priceId;

        // 1. Obtener stripe_customer_id del usuario desde Supabase
        if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
            return NextResponse.json({ success: false, error: 'Servicio de base de datos no disponible' }, { status: 500 });
        }

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id, email, first_name, last_name')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (!user.stripe_customer_id) {
            return NextResponse.json({ success: false, error: 'Usuario no cuenta con suscripción en Stripe' }, { status: 400 });
        }

        // 2. Inicializar Stripe
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ success: false, error: 'Stripe no configurado en servidor' }, { status: 503 });
        }
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        // 3. Obtener suscripción activa en Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: 'active',
            limit: 10
        });

        const activeSubs = subscriptions.data.filter(s => s.status === 'active' || s.status === 'trialing');

        if (activeSubs.length === 0) {
            return NextResponse.json({ success: false, error: 'No se encontró una suscripción activa en Stripe' }, { status: 400 });
        }

        const subscription = activeSubs[0];
        const subscriptionItemId = subscription.items.data[0]?.id;

        if (!subscriptionItemId) {
            return NextResponse.json({ success: false, error: 'No se encontraron items en la suscripción de Stripe' }, { status: 500 });
        }

        const currentPriceId = subscription.items.data[0]?.price?.id;

        if (currentPriceId === targetPriceId) {
            return NextResponse.json({ success: false, error: 'Ya cuentas con este plan seleccionado' }, { status: 400 });
        }

        // Determinar si es upgrade (de mensual a anual) o downgrade (de anual a mensual)
        const isUpgrade = targetPlan === 'anual';

        console.log(`🔄 [CHANGE_PLAN] Cambiando plan de ${memberstackId}. Upgrade: ${isUpgrade}. Price actual: ${currentPriceId} ➔ Target: ${targetPriceId}`);

        // 4. Actualizar Stripe
        // - Upgrade: Cobramos inmediato prorrateado (always_invoice)
        // - Downgrade: Cambiamos diferido sin prorratear ahora (none) para la siguiente facturación
        await stripe.subscriptions.update(subscription.id, {
            items: [{
                id: subscriptionItemId,
                price: targetPriceId,
            }],
            proration_behavior: isUpgrade ? 'always_invoice' : 'none'
        });

        // 5. Actualizar Supabase (tabla users)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                membership_type: targetPlanInfo.type,
                membership_cost: targetPlanInfo.cost,
            })
            .eq('memberstack_id', memberstackId);

        if (dbError) {
            console.error('⚠️ [CHANGE_PLAN] Error actualizando Supabase users:', dbError);
        }

        // 6. Actualizar Memberstack Custom Fields
        const msResult = await memberstackAdmin.updateMemberFields(memberstackId, {
            'membership-type': targetPlanInfo.type,
            'membership-cost': targetPlanInfo.cost,
            'plan-name': targetPlanInfo.type
        });

        if (!msResult.success) {
            console.error('⚠️ [CHANGE_PLAN] Error actualizando Memberstack:', msResult.error);
        }

        // 7. Crear notificación para el administrador
        try {
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Miembro';
            await createServerNotification({
                userId: 'admin',
                type: 'plan_change',
                title: '🔄 Cambio de Plan',
                message: `El miembro ${fullName} cambió su plan a ${targetPlanInfo.type}.`,
                icon: '🔄',
                link: `/admin/dashboard?tab=member&member=${memberstackId}`,
                metadata: {
                    userId: memberstackId
                }
            });
            console.log(`[CHANGE_PLAN] Notificación creada para admin: Cambio de plan de ${fullName}`);
        } catch (notifErr) {
            console.error('⚠️ [CHANGE_PLAN] Error creando notificación para admin:', notifErr);
        }

        return NextResponse.json({
            success: true,
            message: `Plan cambiado a ${targetPlanInfo.type} exitosamente`,
            plan: targetPlanInfo.type,
            cost: targetPlanInfo.cost
        });

    } catch (error: any) {
        console.error('❌ [CHANGE_PLAN] Error general:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al cambiar de plan' },
            { status: 500 }
        );
    }
}
