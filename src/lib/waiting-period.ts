/**
 * Reglas de período de espera por mascota — importadas del sitio vivo
 * (Club-Pata-Amiga-Form: pet.service.ts) y confirmadas con el cliente
 * el 15-jul-2026. Aplican igual a perros y gatos:
 *
 * 1. Mascota de reemplazo (registrada después de dar de baja otra) → 180 días
 * 2. Registro con código de embajador válido                        → 90 días
 * 3. Adoptado/rescatado mestizo o doméstico                         → 120 días
 * 4. Adoptado/rescatado de raza                                     → 150 días
 * 5. Caso estándar                                                  → 180 días
 */

export const MIXED_BREED_NAMES = ["Mestizo", "Doméstico", "Mestizo (doméstico)"];

export function isMixedBreedName(breed: string | null | undefined): boolean {
  if (!breed) return false;
  const b = breed.trim().toLowerCase();
  return MIXED_BREED_NAMES.some((m) => m.toLowerCase() === b);
}

export function petWaitingPeriodDays(opts: {
  isAdopted: boolean;
  breed: string | null | undefined;
  hasReferralCode?: boolean;
  isReplacement?: boolean;
}): number {
  if (opts.isReplacement) return 180;
  if (opts.hasReferralCode) return 90;
  if (opts.isAdopted) return isMixedBreedName(opts.breed) ? 120 : 150;
  return 180;
}

/** Fecha fin (yyyy-mm-dd) contando desde hoy. */
export function waitingPeriodEndDate(days: number): string {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return end.toISOString().slice(0, 10);
}
