import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        const data: any = {};

        if (type === 'all' || type === 'metrics') {
            // Fetch balance/summary
            const balance = await stripe.balance.retrieve();
            data.balance = {
                available: balance.available[0]?.amount / 100 || 0,
                pending: balance.pending[0]?.amount / 100 || 0,
                currency: balance.available[0]?.currency.toUpperCase() || 'MXN'
            };
        }

        if (type === 'all' || type === 'records') {
            // Fetch last 15 payment intents
            const payments = await stripe.paymentIntents.list({
                limit: 15,
                expand: ['data.customer']
            });
            data.payments = payments.data.map(pi => ({
                id: pi.id,
                amount: pi.amount / 100,
                currency: pi.currency.toUpperCase(),
                status: pi.status,
                date: new Date(pi.created * 1000).toISOString(),
                customerEmail: (pi.customer as Stripe.Customer)?.email || 'N/A',
                customerName: (pi.customer as Stripe.Customer)?.name || 'N/A'
            }));
        }

        if (type === 'all' || type === 'status') {
            // Fetch recent subscriptions
            const subscriptions = await stripe.subscriptions.list({
                limit: 15,
                status: 'all',
                expand: ['data.customer']
            });
            data.subscriptions = subscriptions.data.map((sub: any) => ({
                id: sub.id,
                status: sub.status,
                plan: (sub.items.data[0]?.price.product as string) || 'Plan',
                amount: sub.items.data[0]?.price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
                customerEmail: (sub.customer as any)?.email || 'N/A',
                nextBilling: new Date(sub.current_period_end * 1000).toISOString()
            }));
        }

        if (type === 'all' || type === 'retries') {
            // Fetch recent payment intents to find failures
            const failedPayments = await stripe.paymentIntents.list({
                limit: 30
            });
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
