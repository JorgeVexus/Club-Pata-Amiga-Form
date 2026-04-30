import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

export async function GET(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        const data: any = {};

        // ── PRE-FETCH MEMBERSTACK DATA FOR NAME ENRICHMENT ──
        const emailToName = new Map<string, string>();
        try {
            const msResult = await memberstackAdmin.listMembers();
            if (msResult.success && msResult.data) {
                msResult.data.forEach(member => {
                    const firstName = member.customFields?.['first-name'] || '';
                    const lastName = member.customFields?.['paternal-last-name'] || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName && member.auth.email) {
                        emailToName.set(member.auth.email.toLowerCase(), fullName);
                    }
                });
            }
        } catch (msErr) {
            console.error('❌ Error pre-fetching Memberstack names:', msErr);
        }

        // ── METRICS ──
        if (type === 'all' || type === 'metrics') {
            const balance = await stripe.balance.retrieve();
            data.balance = {
                available: balance.available[0]?.amount / 100 || 0,
                pending: balance.pending[0]?.amount / 100 || 0,
                currency: balance.available[0]?.currency.toUpperCase() || 'MXN'
            };
        }

        // ── PAYMENT RECORDS ──
        if (type === 'all' || type === 'records') {
            const payments = await stripe.paymentIntents.list({
                limit: 40,
                expand: ['data.customer']
            });
            data.payments = payments.data.map(pi => {
                const email = (pi.customer as Stripe.Customer)?.email || pi.receipt_email || '';
                const stripeName = (pi.customer as Stripe.Customer)?.name || '';
                const msName = email ? emailToName.get(email.toLowerCase()) : null;

                return {
                    id: pi.id,
                    amount: pi.amount / 100,
                    currency: pi.currency.toUpperCase(),
                    status: pi.status,
                    date: new Date(pi.created * 1000).toISOString(),
                    customerEmail: email || 'N/A',
                    customerName: msName || stripeName || 'N/A'
                };
            });
        }

        // ── SUBSCRIPTION STATUS (Hybrid: Stripe + Memberstack) ──
        if (type === 'all' || type === 'status') {
            // 1. Fetch ALL subscriptions from Stripe (not just active)
            const relevantStatuses: Stripe.SubscriptionListParams.Status[] = ['active', 'trialing', 'past_due'];
            const allStripeSubs: any[] = [];

            for (const status of relevantStatuses) {
                try {
                    const subs = await stripe.subscriptions.list({
                        limit: 100,
                        status,
                        expand: ['data.customer']
                    });
                    
                    subs.data.forEach((sub: any) => {
                        const email = (sub.customer as any)?.email || 'N/A';
                        const stripeName = (sub.customer as any)?.name || '';
                        const msName = email !== 'N/A' ? emailToName.get(email.toLowerCase()) : null;

                        // Improved interval detection
                        let interval = sub.items.data[0]?.price?.recurring?.interval || 'month';
                        const planName = sub.items.data[0]?.price?.nickname || '';
                        if (planName.toLowerCase().includes('anual') || planName.toLowerCase().includes('año')) {
                            interval = 'year';
                        }

                        allStripeSubs.push({
                            id: sub.id,
                            status: sub.status,
                            plan: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.product || 'Plan',
                            amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
                            interval,
                            customerEmail: email,
                            customerName: msName || stripeName || '',
                            nextBilling: new Date(sub.current_period_end * 1000).toISOString(),
                            startDate: new Date(sub.start_date * 1000).toISOString(),
                            source: 'stripe'
                        });
                    });
                } catch (err) {
                    console.error(`❌ Error fetching ${status} subscriptions:`, err);
                }
            }

            // 2. Memberstack fallback — catch members with paid plans not in Stripe
            try {
                const msResult = await memberstackAdmin.listMembers(undefined, { paidOnly: true });
                
                if (msResult.success && msResult.data) {
                    msResult.data.forEach(member => {
                        const plan = member.planConnections?.[0];
                        if (plan && plan.active) {
                            const alreadyInStripe = allStripeSubs.some(
                                s => s.customerEmail.toLowerCase() === member.auth.email.toLowerCase()
                            );
                            
                            if (!alreadyInStripe) {
                                // Determine interval from plan name
                                const planNameLower = (plan.planName || '').toLowerCase();
                                const interval = planNameLower.includes('anual') || planNameLower.includes('annual') ? 'year' : 'month';
                                
                                const firstName = member.customFields?.['first-name'] || '';
                                const lastName = member.customFields?.['paternal-last-name'] || '';

                                allStripeSubs.push({
                                    id: plan.payment?.stripeSubscriptionId || `ms_${member.id}`,
                                    status: plan.status?.toLowerCase() || 'active',
                                    plan: plan.planName || 'Plan Club Pata Amiga',
                                    amount: plan.payment?.amount ? plan.payment.amount / 100 : 0,
                                    interval,
                                    customerEmail: member.auth.email,
                                    customerName: `${firstName} ${lastName}`.trim() || '',
                                    nextBilling: plan.currentPeriodEnd
                                        ? new Date(typeof plan.currentPeriodEnd === 'number' ? plan.currentPeriodEnd * 1000 : plan.currentPeriodEnd).toISOString()
                                        : new Date().toISOString(),
                                    startDate: member.createdAt || new Date().toISOString(),
                                    source: 'memberstack'
                                });
                            }
                        }
                    });
                }
            } catch (msErr) {
                console.error('❌ Memberstack fallback error:', msErr);
            }

            data.subscriptions = allStripeSubs;
        }

        // ── INVOICES (for auto-billing / retries view) ──
        if (type === 'all' || type === 'retries') {
            const invoices = await stripe.invoices.list({
                limit: 50,
                expand: ['data.customer', 'data.subscription']
            });

            data.invoices = invoices.data.map(inv => {
                const email = (inv.customer as Stripe.Customer)?.email || 'N/A';
                const stripeName = (inv.customer as Stripe.Customer)?.name || '';
                const msName = email !== 'N/A' ? emailToName.get(email.toLowerCase()) : null;

                return {
                    id: inv.id,
                    number: inv.number || inv.id,
                    amount: (inv.amount_due || 0) / 100,
                    amountPaid: (inv.amount_paid || 0) / 100,
                    currency: (inv.currency || 'mxn').toUpperCase(),
                    status: inv.status || 'unknown',
                    date: new Date((inv.created || 0) * 1000).toISOString(),
                    dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
                    customerEmail: email,
                    customerName: msName || stripeName || 'N/A',
                    invoicePdf: inv.invoice_pdf || null,
                    hostedUrl: inv.hosted_invoice_url || null,
                    attemptCount: inv.attempt_count || 0,
                    nextAttempt: inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000).toISOString() : null,
                    subscriptionId: typeof (inv as any).subscription === 'string' ? (inv as any).subscription : ((inv as any).subscription as Stripe.Subscription)?.id || null,
                    periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
                    periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
                };
            });

            // Also include failed payment intents for completeness
            const failedPayments = await stripe.paymentIntents.list({ limit: 20 });
            data.failed = failedPayments.data
                .filter(pi => pi.status === 'requires_payment_method' || pi.status === 'canceled')
                .map(pi => ({
                    id: pi.id,
                    amount: pi.amount / 100,
                    date: new Date(pi.created * 1000).toISOString(),
                    customerEmail: (pi.customer as Stripe.Customer)?.email || 'N/A'
                }));
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('❌ Stripe Data API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error al obtener datos de Stripe' 
        }, { status: 500 });
    }
}
