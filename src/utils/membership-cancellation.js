const VALID_CANCELLATION_REASONS = [
    'no_longer_needed',
    'price_too_high',
    'found_alternative',
    'service_issues',
    'other',
];

function cleanOptionalText(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeCancellationRequest(input) {
    const reason = typeof input?.reason === 'string' ? input.reason.trim() : '';

    if (!VALID_CANCELLATION_REASONS.includes(reason)) {
        throw new Error('Motivo de cancelacion invalido');
    }

    return {
        reason,
        reasonOtherText: reason === 'other' ? cleanOptionalText(input.reasonOtherText) : null,
        comments: cleanOptionalText(input.comments),
    };
}

function calculateDaysRemaining(periodEndDate, nowDate = new Date()) {
    const millisecondsRemaining = periodEndDate.getTime() - nowDate.getTime();
    return Math.max(0, Math.ceil(millisecondsRemaining / 86400000));
}

function formatDateForStorage(date) {
    return date.toISOString().slice(0, 10);
}

module.exports = {
    VALID_CANCELLATION_REASONS,
    normalizeCancellationRequest,
    calculateDaysRemaining,
    formatDateForStorage,
};
