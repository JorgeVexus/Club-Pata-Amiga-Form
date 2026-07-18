function anniversaryForYear(anchor, year) {
    const month = anchor.getUTCMonth();
    const day = anchor.getUTCDate();
    const candidate = new Date(Date.UTC(
        year,
        month,
        day,
        anchor.getUTCHours(),
        anchor.getUTCMinutes(),
        anchor.getUTCSeconds(),
        anchor.getUTCMilliseconds()
    ));
    if (candidate.getUTCMonth() !== month) candidate.setUTCDate(0);
    return candidate;
}

export function getSolidarityCycle(firstPaymentAt, now = new Date()) {
    const anchor = new Date(firstPaymentAt);
    if (Number.isNaN(anchor.getTime())) throw new Error('La fecha del primer pago no es válida.');

    let cycleYear = now.getUTCFullYear();
    let start = anniversaryForYear(anchor, cycleYear);
    if (now < start) {
        cycleYear -= 1;
        start = anniversaryForYear(anchor, cycleYear);
    }
    return { start, renewal: anniversaryForYear(anchor, cycleYear + 1) };
}
