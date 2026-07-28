import { REIMBURSEMENT_CAPS_MXN } from "@/lib/constants";

/**
 * Saldos de reintegro — reglas del sitio vivo (solidarity-balance.js):
 * - Tope POR CATEGORÍA, POR CUENTA y POR AÑO CALENDARIO (se renueva cada
 *   1 de enero).
 * - Usado = monto aprobado (o el solicitado mientras se resuelve) de toda
 *   solicitud del año que no esté rechazada.
 * - Disponible = tope - usado (nunca negativo).
 */

export type ReimbursementCategory = keyof typeof REIMBURSEMENT_CAPS_MXN;

export type CategoryBalance = {
  limit: number;
  used: number;
  available: number;
};

type BalanceRow = {
  category: string;
  amount_requested: number | string | null;
  amount_approved: number | string | null;
  status: string;
};

/** Estados que no consumen saldo. */
const EXCLUDED_STATUSES = new Set(["rejected"]);

function amountForBalance(row: BalanceRow): number {
  if (EXCLUDED_STATUSES.has(row.status)) return 0;
  const amount = Number(row.amount_approved ?? row.amount_requested ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function calculateBalances(
  rows: BalanceRow[],
): Record<ReimbursementCategory, CategoryBalance> {
  const result = {} as Record<ReimbursementCategory, CategoryBalance>;
  for (const category of Object.keys(
    REIMBURSEMENT_CAPS_MXN,
  ) as ReimbursementCategory[]) {
    const limit = REIMBURSEMENT_CAPS_MXN[category];
    const used = rows
      .filter((r) => r.category === category)
      .reduce((sum, r) => sum + amountForBalance(r), 0);
    result[category] = {
      limit,
      used: Math.min(used, limit),
      available: Math.max(0, limit - used),
    };
  }
  return result;
}

/** Primer día del año en curso (las solicitudes desde aquí consumen saldo). */
export function startOfCurrentYear(): string {
  return `${new Date().getFullYear()}-01-01T00:00:00Z`;
}
