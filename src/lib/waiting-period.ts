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
import { diaEnMexicoMasDias } from "@/lib/zona-horaria";

export const MIXED_BREED_NAMES = ["Mestizo", "Doméstico", "Mestizo (doméstico)"];

export function isMixedBreedName(breed: string | null | undefined): boolean {
  if (!breed) return false;
  const b = breed.trim().toLowerCase();
  return MIXED_BREED_NAMES.some((m) => m.toLowerCase() === b);
}

/**
 * Días de espera de una mascota.
 *
 * `benefits` es OPCIONAL: sin él aplica exactamente los días de siempre. Quien
 * tiene el snapshot del miembro (motor de beneficios, sección 3) pasa los suyos
 * y esa persona se rige por lo que contrató, aunque el plan haya cambiado
 * después.
 */
export type WaitingPeriodBenefits = {
  espera_mascota_estandar_dias?: number;
  espera_mascota_adoptada_raza_dias?: number;
  espera_mascota_adoptada_mestizo_dias?: number;
  espera_mascota_con_embajador_dias?: number;
  espera_mascota_reemplazo_dias?: number;
};

export function petWaitingPeriodDays(
  opts: {
    isAdopted: boolean;
    breed: string | null | undefined;
    hasReferralCode?: boolean;
    isReplacement?: boolean;
  },
  benefits: WaitingPeriodBenefits = {},
): number {
  const estandar = benefits.espera_mascota_estandar_dias ?? 180;
  if (opts.isReplacement) return benefits.espera_mascota_reemplazo_dias ?? 180;
  if (opts.hasReferralCode)
    return benefits.espera_mascota_con_embajador_dias ?? 90;
  if (opts.isAdopted)
    return isMixedBreedName(opts.breed)
      ? (benefits.espera_mascota_adoptada_mestizo_dias ?? 120)
      : (benefits.espera_mascota_adoptada_raza_dias ?? 150);
  return estandar;
}

/**
 * Fecha fin (yyyy-mm-dd) contando desde hoy **en hora de México**.
 *
 * Antes salía del reloj del proceso: en Vercel (UTC) quien se registraba
 * después de las 6 de la tarde recibía un día extra de espera, porque para el
 * servidor ya era mañana. Es la fecha que decide desde cuándo procede un
 * reintegro, así que un día importa.
 */
export function waitingPeriodEndDate(days: number): string {
  return diaEnMexicoMasDias(days);
}
