/**
 * Helpers para extraer datos de membresía de Stripe en el formato
 * que espera el CRM Lynsales (método de pago, fecha de pago, fecha de renovación).
 */

import Stripe from 'stripe';

/** Formatea una fecha (Date | epoch segundos) como YYYY-MM-DD */
export function toCrmDate(input: Date | number | null | undefined): string | undefined {
    if (input === null || input === undefined) return undefined;
    const date = typeof input === 'number' ? new Date(input * 1000) : input;
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString().slice(0, 10);
}

/**
 * Mapea el método de pago de Stripe al catálogo de Lynsales
 * ("Tarjeta" | "OXXO" | "Transferencia" | "PayPal").
 */
export function mapStripePaymentMethod(type: string | null | undefined): string | undefined {
    if (!type) return undefined;
    switch (type) {
        case 'card':
            return 'Tarjeta';
        case 'oxxo':
            return 'OXXO';
        case 'customer_balance':
        case 'sepa_debit':
        case 'bank_transfer':
            return 'Transferencia';
        case 'paypal':
            return 'PayPal';
        default:
            return 'Tarjeta';
    }
}

export interface StripeMembershipFields {
    paymentDate?: string;    // fecha del último pago procesado (YYYY-MM-DD)
    paymentMethod?: string;  // método de pago mapeado al catálogo de Lynsales
    renewalDate?: string;    // próximo cobro estimado (YYYY-MM-DD)
}

/**
 * Dado un subscriptionId de Stripe, devuelve los campos de membresía
 * (método de pago, fecha de pago, fecha de renovación) listos para el CRM.
 * Best-effort: cualquier campo que no se pueda resolver se omite.
 */
export async function getStripeMembershipFields(
    stripe: Stripe,
    subscriptionId: string
): Promise<StripeMembershipFields> {
    try {
        const subscription = (await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['default_payment_method', 'latest_invoice.payment_intent.payment_method'],
        })) as any;

        // Fecha de renovación = fin del período actual
        const renewalDate = toCrmDate(subscription.current_period_end);

        // Fecha de pago = inicio del período actual (último cobro)
        const paymentDate = toCrmDate(subscription.current_period_start);

        // Método de pago: preferir el default de la suscripción, luego el del último pago
        let pmType: string | undefined =
            subscription.default_payment_method?.type ||
            subscription.latest_invoice?.payment_intent?.payment_method?.type;

        return {
            paymentDate,
            paymentMethod: mapStripePaymentMethod(pmType),
            renewalDate,
        };
    } catch (error: any) {
        console.error('[Stripe] Error obteniendo campos de membresía:', error.message);
        return {};
    }
}
