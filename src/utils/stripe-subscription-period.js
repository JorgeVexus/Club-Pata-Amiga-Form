function getFirstSubscriptionItem(subscription) {
    return subscription?.items?.data?.[0] || null;
}

function addInterval(timestamp, interval, intervalCount) {
    if (interval === 'week') {
        return timestamp + 7 * 24 * 60 * 60 * intervalCount;
    }

    const date = new Date(timestamp * 1000);

    if (interval === 'year') {
        date.setUTCFullYear(date.getUTCFullYear() + intervalCount);
    } else {
        date.setUTCMonth(date.getUTCMonth() + intervalCount);
    }

    return Math.floor(date.getTime() / 1000);
}

function normalizeTimestamp(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function resolveBillingAnchorCycle(subscription, nowDate = new Date()) {
    const firstItem = getFirstSubscriptionItem(subscription);
    const anchor = normalizeTimestamp(subscription?.billing_cycle_anchor);
    const interval = firstItem?.price?.recurring?.interval;
    const intervalCount = firstItem?.price?.recurring?.interval_count || 1;

    if (!anchor || !interval) return null;

    const now = Math.floor(nowDate.getTime() / 1000);
    let nextCycle = anchor;

    while (nextCycle <= now) {
        nextCycle = addInterval(nextCycle, interval, intervalCount);
    }

    return nextCycle;
}

function resolveSubscriptionPeriodEnd(subscription, nowDate = new Date()) {
    const firstItem = getFirstSubscriptionItem(subscription);

    return (
        normalizeTimestamp(firstItem?.current_period_end) ||
        normalizeTimestamp(subscription?.current_period_end) ||
        normalizeTimestamp(subscription?.trial_end) ||
        normalizeTimestamp(subscription?.cancel_at) ||
        resolveBillingAnchorCycle(subscription, nowDate)
    );
}

function toStripeTimestampIso(timestamp) {
    const normalized = normalizeTimestamp(timestamp);
    return normalized ? new Date(normalized * 1000).toISOString() : null;
}

module.exports = {
    resolveSubscriptionPeriodEnd,
    toStripeTimestampIso,
};
