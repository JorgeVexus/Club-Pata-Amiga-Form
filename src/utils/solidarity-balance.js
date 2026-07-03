const SOLIDARITY_LIMITS = {
    medical_emergency: 3000,
    annual_vaccination: 300,
    death: 2000,
};

const BALANCE_EXCLUDED_STATUSES = new Set(['rejected', 'cancelled']);

function getSolidarityAmountForBalance(request) {
    if (!request || BALANCE_EXCLUDED_STATUSES.has(request.status)) return 0;

    const amount = request.approved_amount ?? request.requested_amount ?? 0;
    const numericAmount = Number(amount);
    return Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
}

function calculateSolidarityBalances(requests = [], limits = SOLIDARITY_LIMITS) {
    const usedBalances = Object.keys(limits).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
    }, {});

    requests.forEach((request) => {
        const type = request?.benefit_type;
        if (!Object.prototype.hasOwnProperty.call(usedBalances, type)) return;
        usedBalances[type] += getSolidarityAmountForBalance(request);
    });

    return Object.keys(limits).reduce((acc, type) => {
        const limit = limits[type];
        const used = usedBalances[type] || 0;
        acc[type] = {
            used,
            limit,
            available: Math.max(0, limit - used),
        };
        return acc;
    }, {});
}

function getSolidarityAvailableAmount(requests = [], benefitType, limits = SOLIDARITY_LIMITS) {
    const balances = calculateSolidarityBalances(requests, limits);
    return balances[benefitType]?.available ?? 0;
}

module.exports = {
    BALANCE_EXCLUDED_STATUSES,
    SOLIDARITY_LIMITS,
    calculateSolidarityBalances,
    getSolidarityAmountForBalance,
    getSolidarityAvailableAmount,
};
