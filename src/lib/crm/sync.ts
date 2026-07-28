import type { createAdminClient } from "@/lib/supabase/admin";
import { emitEvent, type EventKind } from "@/lib/crm/events";
import { resolveContact } from "@/lib/crm/contacts";
import { ensureOpportunity, moveStage, type StageKey } from "@/lib/crm/opportunities";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Puente entre lo que pasa en la plataforma y el CRM.
 *
 * Es la razón de ser de la sección 1: en LynSales las etapas "Miembro activo",
 * "Miembro inactivo" y "Pago procesado" están en CERO porque moverlas depende de
 * que alguien lo note. Aquí el cobro, la suscripción y la baja son eventos
 * propios, así que las etapas se llenan solas.
 *
 * Todas las funciones son "a prueba de fallos": si el CRM falla, NO tumban la
 * operación que las llamó. Un pago no se cae porque no se pudo mover una tarjeta.
 */

/** Encuentra (o crea) el contacto de un usuario del portal. */
export async function contactoDeUsuario(
  admin: Admin,
  userId: string,
): Promise<string | null> {
  try {
    const { data: existente } = await admin
      .from("contacts")
      .select("id")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();
    if (existente) return existente.id;

    const { data: perfil } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name, phone, city, state, birth_date, utm_source, membership_status")
      .eq("id", userId)
      .maybeSingle();
    if (!perfil) return null;

    const { contactId } = await resolveContact(admin, {
      identities: { email: perfil.email, phone: perfil.phone, portal: perfil.id },
      firstName: perfil.first_name,
      lastName: perfil.last_name,
      birthDate: perfil.birth_date,
      city: perfil.city,
      state: perfil.state,
      source: perfil.utm_source ?? "registro",
      contactType: perfil.membership_status === "active" ? "miembro" : "lead",
      links: { profileId: perfil.id },
      actorLabel: "Plataforma",
    });
    return contactId;
  } catch (err) {
    console.error("[crm] no se pudo resolver el contacto del usuario", userId, err);
    return null;
  }
}

/**
 * Registra un evento de plataforma y, si corresponde, mueve la tarjeta.
 *
 * El movimiento va SIN `actorId` a propósito: eso lo marca como automatización,
 * y `moveStage` respeta la tarjeta que una persona haya fijado a mano.
 */
export async function crmEventoDeUsuario(
  admin: Admin,
  input: {
    userId: string;
    kind: EventKind;
    summary: string;
    stageKey?: StageKey;
    payload?: Record<string, unknown>;
    interval?: "month" | "year" | null;
  },
): Promise<void> {
  try {
    const contactId = await contactoDeUsuario(admin, input.userId);
    if (!contactId) return;

    await emitEvent(admin, {
      contactId,
      kind: input.kind,
      summary: input.summary,
      payload: input.payload,
      actorLabel: "Plataforma",
    });

    if (!input.stageKey) return;

    // Si no tiene tarjeta, se crea directamente en la etapa que toca.
    const { created } = await ensureOpportunity(admin, {
      contactId,
      stageKey: input.stageKey,
      interval: input.interval,
      actorLabel: "Plataforma",
    });
    if (created) return;

    const { data: tarjeta } = await admin
      .from("opportunities")
      .select("id")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!tarjeta) return;

    await moveStage(admin, {
      opportunityId: tarjeta.id,
      stageKey: input.stageKey,
      actorId: null, // automatización: respeta el bloqueo humano
      actorLabel: "Plataforma",
    });
  } catch (err) {
    console.error("[crm] evento de plataforma no sincronizado", input.kind, err);
  }
}

/** El tipo de contacto sube a "miembro" cuando la membresía queda activa. */
export async function marcarComoMiembro(admin: Admin, userId: string) {
  try {
    const contactId = await contactoDeUsuario(admin, userId);
    if (!contactId) return;
    await admin
      .from("contacts")
      .update({ contact_type: "miembro", updated_at: new Date().toISOString() })
      .eq("id", contactId);
  } catch (err) {
    console.error("[crm] no se pudo marcar como miembro", userId, err);
  }
}
