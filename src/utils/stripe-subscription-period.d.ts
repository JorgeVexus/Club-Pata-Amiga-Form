export interface StripeSubscriptionPeriodInput {
    current_period_end?: number | null;
    trial_end?: number | null;
    cancel_at?: number | null;
    billing_cycle_anchor?: number | null;
    items?: {
        data?: Array<{
            current_period_end?: number | null;
            price?: {
                recurring?: {
                    interval?: string | null;
                    interval_count?: number | null;
                } | null;
            } | null;
        }>;
    } | null;
}

export function resolveSubscriptionPeriodEnd(
    subscription: StripeSubscriptionPeriodInput,
    nowDate?: Date,
): number | null;

export function toStripeTimestampIso(timestamp: number | null | undefined): string | null;
