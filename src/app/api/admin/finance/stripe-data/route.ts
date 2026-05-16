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

        // ── SUBSCRIPTION STATUS (Real-time from Stripe) ──
        if (type === 'all' || type === 'status') {
            const allStripeSubs: any[] = [];
            
            try {
                // 1. Fetch ALL subscriptions from Stripe with pagination
                let hasMore = true;
                let lastId: string | undefined = undefined;

                while (hasMore) {
                    const stripeBatch: any = await stripe.subscriptions.list({
                        limit: 100,
                        status: 'all',
                        starting_after: lastId,
                        expand: ['data.customer', 'data.latest_invoice']
                    });

                    stripeBatch.data.forEach((sub: any) => {
                        const email = (sub.customer as any)?.email || 'N/A';
                        const stripeName = (sub.customer as any)?.name || '';
                        const msName = email !== 'N/A' ? emailToName.get(email.toLowerCase()) : null;
                        const invoice = sub.latest_invoice;

                        // Improved interval and plan detection
                        let interval = sub.items.data[0]?.price?.recurring?.interval || 'month';
                        const price = sub.items.data[0]?.price;
                        const planName = price?.nickname || (sub as any).plan?.nickname || '';
                        const amount = (price?.unit_amount || (sub as any).plan?.amount || 0) / 100;
                        
                        const isAnnualKeyword = planName.toLowerCase().includes('anual') || 
                                              planName.toLowerCase().includes('año') || 
                                              planName.toLowerCase().includes('year') || 
                                              planName.toLowerCase().includes('annual');
                        
                        if (isAnnualKeyword || amount > 1000) {
                            interval = 'year';
                        }

                        allStripeSubs.push({
                            id: sub.id,
                            status: sub.status,
                            plan: planName || price?.product || 'Plan Club Pata Amiga',
                            amount: amount,
                            interval,
                            customerEmail: email,
                            customerName: msName || stripeName || '',
                            nextBilling: new Date(sub.current_period_end * 1000).toISOString(),
                            startDate: new Date(sub.start_date * 1000).toISOString(),
                            source: 'stripe',
                            payment: {
                                invoice_id: invoice?.id || null,
                                invoice_status: invoice?.status || null,
                                amount_paid: invoice ? invoice.amount_paid / 100 : 0,
                                currency: invoice?.currency?.toUpperCase() || 'MXN',
                            }
                        });
                    });

                    hasMore = stripeBatch.has_more;
                    if (hasMore && stripeBatch.data.length > 0) {
                        lastId = stripeBatch.data[stripeBatch.data.length - 1].id;
                    } else {
                        hasMore = false;
                    }
                }
            } catch (err) {
                console.error(`❌ Error fetching subscriptions from Stripe:`, err);
            }

            // 2. Memberstack fallback — catch members with paid plans not found in the recent Stripe list
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
                                const planNameLower = (plan.planName || '').toLowerCase();
                                const amount = plan.payment?.amount || 0;
                                const isAnnualKeyword = planNameLower.includes('anual') || 
                                                      planNameLower.includes('annual') || 
                                                      planNameLower.includes('year') || 
                                                      planNameLower.includes('año');
                                                      
                                const interval = (isAnnualKeyword || amount > 1000) ? 'year' : 'month';
                                const firstName = member.customFields?.['first-name'] || '';
                                const lastName = member.customFields?.['paternal-last-name'] || '';

                                allStripeSubs.push({
                                    id: plan.payment?.stripeSubscriptionId || `ms_${member.id}`,
                                    status: plan.status?.toLowerCase() || 'active',
                                    plan: plan.planName || 'Plan Club Pata Amiga',
                                    amount: plan.payment?.amount || 0,
                                    interval,
                                    customerEmail: member.auth.email,
                                    customerName: `${firstName} ${lastName}`.trim() || '',
                                    // FIX: No usar hoy por defecto si la fecha es inválida o inexistente
                                    nextBilling: plan.currentPeriodEnd
                                        ? new Date(typeof plan.currentPeriodEnd === 'number' ? plan.currentPeriodEnd * 1000 : plan.currentPeriodEnd).toISOString()
                                        : null,
                                    startDate: member.createdAt || null,
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
                expand: ['data.customer']
            });

            data.invoices = invoices.data.map(inv => {
                const email = (inv.customer as Stripe.Customer)?.email || 'N/A';
                const stripeName = (inv.customer as Stripe.Customer)?.name || '';
                const msName = email !== 'N/A' ? emailToName.get(email.toLowerCase()) : null;

                return {
                    id: inv.id,
                    number: inv.number || inv.id,
                    amount: (inv.amount_due || 0) / 100,
                    status: inv.status || 'unknown',
                    date: new Date((inv.created || 0) * 1000).toISOString(),
                    customerEmail: email,
                    customerName: msName || stripeName || 'N/A',
                    invoicePdf: inv.invoice_pdf || null,
                    hostedUrl: inv.hosted_invoice_url || null,
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

        // Estructura garantizada para el frontend
        return NextResponse.json({ 
            success: true, 
            data: {
                ...data,
                subscriptions: data.subscriptions || []
            }
        });
    } catch (error: any) {
        console.error('❌ Stripe Data API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error al obtener datos de Stripe' 
        }, { status: 500 });
    }
}
