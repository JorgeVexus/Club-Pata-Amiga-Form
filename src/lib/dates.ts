const MS_PER_DAY = 86_400_000;

/** Columnas de fecha pura: 2026-07-26 */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateEs(date: Date | string): string {
  // A las fechas puras se les pone mediodía para que el cambio de zona horaria
  // no las corra un día. A los timestamptz NO: ya traen hora, y concatenarles
  // "T12:00:00" producía "Invalid time value".
  const value =
    typeof date === "string"
      ? new Date(SOLO_FECHA.test(date) ? `${date}T12:00:00` : date)
      : date;
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export type WaitingProgress = {
  total: number;
  elapsed: number;
  done: boolean;
  pct: number;
};

/**
 * Progress of a pet's waiting period shown as "38 / 180 días".
 * El período es variable por mascota (ver src/lib/waiting-period.ts), así que
 * el total se deriva de sus propias fechas: registro → waiting_period_end_date.
 */
export function waitingProgress(
  createdAt: string | null,
  endDate: string | null,
  bypassed: boolean,
): WaitingProgress {
  const FALLBACK_TOTAL = 180;
  if (!endDate) {
    // Sin fecha aún (pre-pago): mostrar el estándar sin avance
    return bypassed
      ? { total: FALLBACK_TOTAL, elapsed: FALLBACK_TOTAL, done: true, pct: 100 }
      : { total: FALLBACK_TOTAL, elapsed: 0, done: false, pct: 0 };
  }
  const end = new Date(`${endDate}T12:00:00`).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : end - FALLBACK_TOTAL * MS_PER_DAY;
  const total = Math.max(1, Math.round((end - start) / MS_PER_DAY));
  if (bypassed) return { total, elapsed: total, done: true, pct: 100 };
  const remaining = Math.ceil((end - Date.now()) / MS_PER_DAY);
  const elapsed = Math.min(Math.max(total - remaining, 0), total);
  return { total, elapsed, done: elapsed >= total, pct: (elapsed / total) * 100 };
}

/** Renewal date: subscription period end, or member_since + plan interval. */
export function renewalDate(
  periodEnd: string | null,
  memberSince: string | null,
  plan: string | null,
): Date | null {
  if (periodEnd) return new Date(periodEnd);
  if (!memberSince) return null;
  const d = new Date(memberSince);
  if (plan === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
