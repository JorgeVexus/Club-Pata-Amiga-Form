export function formatMxn(amount: number): string {
  return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** "hace 2 días" style relative label for feeds and queues. */
export function hoursSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}
