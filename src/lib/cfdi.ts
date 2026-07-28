/**
 * Catálogos SAT abreviados para facturación (CFDI 4.0) — los usos y
 * regímenes más comunes para una membresía de servicios. RFC de 12
 * caracteres = persona moral; 13 = persona física.
 */

export const USO_CFDI_OPTIONS = [
  { value: "G03", label: "G03 — Gastos en general" },
  { value: "G01", label: "G01 — Adquisición de mercancías" },
  { value: "D01", label: "D01 — Honorarios médicos y gastos hospitalarios" },
  { value: "P01", label: "P01 — Por definir" },
] as const;

export const REGIMEN_FISCAL_OPTIONS = [
  { value: "605", label: "605 — Sueldos y salarios" },
  { value: "612", label: "612 — Personas físicas con actividades empresariales" },
  { value: "626", label: "626 — Régimen Simplificado de Confianza (RESICO)" },
  { value: "616", label: "616 — Sin obligaciones fiscales" },
  { value: "601", label: "601 — General de Ley Personas Morales" },
  { value: "603", label: "603 — Personas morales con fines no lucrativos" },
  { value: "621", label: "621 — Incorporación fiscal" },
  { value: "611", label: "611 — Arrendamiento" },
] as const;

const RFC_RE =
  /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;

export function isValidRfc(rfc: string): boolean {
  const clean = rfc.trim().toUpperCase();
  return (clean.length === 12 || clean.length === 13) && RFC_RE.test(clean);
}

/** true = persona moral (RFC de 12), false = física (13), null = incompleto */
export function isPersonaMoral(rfc: string): boolean | null {
  const len = rfc.trim().length;
  if (len === 12) return true;
  if (len === 13) return false;
  return null;
}
