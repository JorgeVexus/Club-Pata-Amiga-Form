import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CancellationRow {
    id: string;
    memberstack_id: string | null;
    user_id: string | null;
    user: { first_name: string; last_name: string; email: string };
    cancellation_date: string | null;
    membership_end_date: string | null;
    cancellation_reason: string;
    reason_other_text: string | null;
    comments: string | null;
    days_remaining_at_cancellation: number;
    subscription_interval: string | null;
    has_billing_info: boolean;
    source: 'app' | 'stripe';
}

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
        const reason = searchParams.get('reason');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const billingFilter = searchParams.get('billing'); // 'yes' | 'no'

        // ── 1. Cancelaciones registradas por la app (tabla de auditoría) ──
        // Se trae todo (sin .range aquí) porque necesitamos deduplicar por
        // cliente y fusionar con Stripe antes de paginar.
        let auditQuery = supabaseAdmin
            .from('membership_cancellations')
            .select(`
                id,
                memberstack_id,
                user_id,
                cancellation_date,
                membership_end_date,
                days_remaining_at_cancellation,
                cancellation_reason,
                reason_other_text,
                comments,
                stripe_subscription_id,
                stripe_customer_id,
                subscription_interval,
                users:user_id (
                    first_name,
                    last_name,
                    mother_last_name,
                    email
                )
            `)
            .order('cancellation_date', { ascending: false })
            .limit(2000);

        if (startDate) auditQuery = auditQuery.gte('cancellation_date', `${startDate}T00:00:00.000Z`);
        if (endDate) auditQuery = auditQuery.lte('cancellation_date', `${endDate}T23:59:59.999Z`);

        const { data: auditData, error: auditError } = await auditQuery;

        if (auditError) {
            console.error('[ADMIN-CANCELLATIONS] Error listando cancelaciones:', auditError);
            return NextResponse.json({ success: false, error: 'Error cargando cancelaciones' }, { status: 500 });
        }

        // 🆕 Deduplicar por cliente: nos quedamos solo con el registro más
        // reciente por user_id (o memberstack_id si no hay user_id), porque
        // el flujo de cancelación puede insertar más de una fila por el
        // mismo evento (reintentos del navegador, doble clic, etc.).
        const seenClients = new Set<string>();
        const dedupedAudit: any[] = [];
        for (const item of auditData || []) {
            const key = item.user_id || item.memberstack_id || item.id;
            if (seenClients.has(key)) continue;
            seenClients.add(key);
            dedupedAudit.push(item);
        }

        // ── 2. Cancelaciones hechas directo en Stripe (sin pasar por la app) ──
        // Estas no tienen fila en membership_cancellations, así que se
        // agregan aparte para que el listado quede completo.
        const stripeOnly: CancellationRow[] = [];
        if (process.env.STRIPE_SECRET_KEY) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                const canceledSubs = await stripe.subscriptions
                    .list({ status: 'canceled', limit: 100, expand: ['data.customer'] })
                    .autoPagingToArray({ limit: 1000 });

                const auditedCustomerIds = new Set(
                    (auditData || []).map((item: any) => item.stripe_customer_id).filter(Boolean),
                );

                const unmatchedCustomerIds = canceledSubs
                    .map((sub: any) => (typeof sub.customer === 'object' ? sub.customer.id : sub.customer))
                    .filter((customerId: string | null) => customerId && !auditedCustomerIds.has(customerId));

                if (unmatchedCustomerIds.length > 0) {
                    const { data: matchedUsers, error: usersError } = await supabaseAdmin
                        .from('users')
                        .select('id, memberstack_id, first_name, last_name, mother_last_name, email, stripe_customer_id')
                        .in('stripe_customer_id', Array.from(new Set(unmatchedCustomerIds)));

                    if (usersError) {
                        console.error('[ADMIN-CANCELLATIONS] Error resolviendo usuarios por stripe_customer_id:', usersError);
                    } else {
                        const userByCustomerId = new Map((matchedUsers || []).map((u: any) => [u.stripe_customer_id, u]));

                        for (const sub of canceledSubs as any[]) {
                            const customerId = typeof sub.customer === 'object' ? sub.customer.id : sub.customer;
                            if (!customerId || auditedCustomerIds.has(customerId)) continue;

                            const user = userByCustomerId.get(customerId);
                            if (!user) continue; // No corresponde a un cliente nuestro (o ya se fue)

                            if (seenClients.has(user.id)) continue; // Ya cubierto por un registro de la app
                            seenClients.add(user.id);

                            const canceledAtIso = sub.canceled_at
                                ? new Date(sub.canceled_at * 1000).toISOString()
                                : sub.ended_at
                                ? new Date(sub.ended_at * 1000).toISOString()
                                : null;

                            stripeOnly.push({
                                id: `stripe-${sub.id}`,
                                memberstack_id: user.memberstack_id,
                                user_id: user.id,
                                user: {
                                    first_name: user.first_name || '',
                                    last_name: user.last_name || user.mother_last_name || '',
                                    email: user.email || '',
                                },
                                cancellation_date: canceledAtIso,
                                membership_end_date: canceledAtIso,
                                cancellation_reason: 'stripe_direct',
                                reason_other_text: null,
                                comments: 'Cancelada directamente en Stripe, fuera del flujo de la app.',
                                days_remaining_at_cancellation: 0,
                                subscription_interval: sub.items?.data?.[0]?.price?.recurring?.interval || null,
                                has_billing_info: false, // se resuelve más abajo junto con el resto
                                source: 'stripe',
                            } as any);
                        }
                    }
                }
            } catch (stripeErr) {
                console.error('[ADMIN-CANCELLATIONS] Error consultando cancelaciones directas en Stripe:', stripeErr);
            }
        }

        // ── 3. Cruce con billing_details para saber quién llenó su facturación ──
        const allUserIds = [
            ...dedupedAudit.map((item: any) => item.user_id),
            ...stripeOnly.map((item: any) => item.user_id),
        ].filter(Boolean);

        let billedUserIds = new Set<string>();
        if (allUserIds.length > 0) {
            const { data: billingRows, error: billingError } = await supabaseAdmin
                .from('billing_details')
                .select('user_id')
                .in('user_id', Array.from(new Set(allUserIds)));
            if (billingError) {
                console.error('[ADMIN-CANCELLATIONS] Error cruzando billing_details:', billingError);
            } else {
                billedUserIds = new Set((billingRows || []).map((row: any) => row.user_id));
            }
        }

        let merged: CancellationRow[] = [
            ...dedupedAudit.map((item: any) => ({
                id: item.id,
                memberstack_id: item.memberstack_id,
                user_id: item.user_id,
                user: {
                    first_name: item.users?.first_name || '',
                    last_name: item.users?.last_name || item.users?.mother_last_name || '',
                    email: item.users?.email || '',
                },
                cancellation_date: item.cancellation_date,
                membership_end_date: item.membership_end_date,
                cancellation_reason: item.cancellation_reason,
                reason_other_text: item.reason_other_text,
                comments: item.comments,
                days_remaining_at_cancellation: item.days_remaining_at_cancellation || 0,
                subscription_interval: item.subscription_interval,
                has_billing_info: billedUserIds.has(item.user_id),
                source: 'app' as const,
            })),
            ...stripeOnly.map((item) => ({ ...item, has_billing_info: billedUserIds.has(item.user_id as string) })),
        ];

        // ── 4. Filtros que aplican sobre el listado ya fusionado ──
        if (reason) {
            const reasons = reason.split(',').map((item) => item.trim()).filter(Boolean);
            merged = merged.filter((item) => reasons.includes(item.cancellation_reason));
        }
        if (billingFilter === 'yes') {
            merged = merged.filter((item) => item.has_billing_info);
        } else if (billingFilter === 'no') {
            merged = merged.filter((item) => !item.has_billing_info);
        }

        merged.sort((a, b) => {
            const dateA = a.cancellation_date ? new Date(a.cancellation_date).getTime() : 0;
            const dateB = b.cancellation_date ? new Date(b.cancellation_date).getTime() : 0;
            return dateB - dateA;
        });

        const total = merged.length;
        const start = (page - 1) * limit;
        const cancellations = merged.slice(start, start + limit);

        return NextResponse.json({
            success: true,
            cancellations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('[ADMIN-CANCELLATIONS] Error inesperado:', error);
        return NextResponse.json({ success: false, error: 'Error procesando cancelaciones' }, { status: 500 });
    }
}
