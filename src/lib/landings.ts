/**
 * Registro de landings de campaña (ads / patrocinadores).
 *
 * Cada landing vive en /landings/<slug> — para crear una nueva basta con
 * agregar una entrada aquí.
 */

export type Campaign = {
  slug: string;
  name: string;
  active: boolean;
  headline: string;
  subheadline: string;
  perks: { emoji: string; text: string }[];
  emailSubject: string;
};

export const CAMPAIGNS: Campaign[] = [
  {
    slug: "regalo",
    name: "Regalo de bienvenida (patrocinador)",
    active: true,
    headline: "Tu regalo para consentir a tu peludo 🎁",
    subheadline:
      "Regístrate gratis y recibe en tu correo un descuento para la membresía Club Pata Amiga y una guía de cuidado para tu mascota.",
    perks: [
      { emoji: "🏷️", text: "Cupón de descuento para tu membresía" },
      { emoji: "📘", text: "Guía de cuidado para tu peludo (PDF)" },
      { emoji: "💬", text: "Orientación veterinaria 24/7 al unirte a la manada" },
    ],
    emailSubject: "🎁 ¡Tu regalo ya llegó! — Club Pata Amiga 🐾",
  },
];

export function getCampaign(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

export function campaignCouponKey(slug: string) {
  return `campaign_${slug}_coupon`;
}

export function campaignPdfSlot(slug: string) {
  return `campaign-${slug}-pdf`;
}
