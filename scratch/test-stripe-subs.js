const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const stripeSecretKey = env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    console.error('Missing STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function main() {
    try {
        console.log('Fetching subscriptions from Stripe...');
        const response = await stripe.subscriptions.list({
            limit: 10,
            status: 'all',
            expand: ['data.discount.promotion_code', 'data.latest_invoice.discount.promotion_code', 'data.latest_invoice.payment_intent.payment_method']
        });

        console.log(`Found ${response.data.length} subscriptions.`);
        response.data.forEach(sub => {
            const coupon = sub.discount?.coupon?.id || sub.latest_invoice?.discount?.coupon?.id || null;
            const promoCode = sub.discount?.promotion_code?.code || sub.latest_invoice?.discount?.promotion_code?.code || null;
            
            console.log(`Sub: ${sub.id}`);
            console.log(`  Customer: ${sub.customer}`);
            console.log(`  Status: ${sub.status}`);
            console.log(`  Coupon: ${coupon}`);
            console.log(`  Promo Code: ${promoCode}`);
            console.log(`  Start Period: ${new Date(sub.current_period_start * 1000).toISOString()}`);
        });
    } catch (err) {
        console.error('Stripe error:', err);
    }
}

main();
