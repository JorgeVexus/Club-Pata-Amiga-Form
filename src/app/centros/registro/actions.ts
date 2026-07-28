"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplatedEmail } from "@/lib/email/send";
import { notifyTeam } from "@/lib/alerts";
import { WELLNESS_SERVICES } from "@/lib/constants";

export type CenterLocationInput = {
  address: string;
  postalCode: string;
  colony: string;
  city: string;
  state: string;
  phone?: string;
};

export type CenterRegistrationInput = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  services: string[];
  memberBenefit: string;
  locations: CenterLocationInput[];
};

const VALID_SERVICES = new Set(Object.keys(WELLNESS_SERVICES));

/** Solicitud pública de centro aliado → cola de revisión del comité. */
export async function registerCenter(input: CenterRegistrationInput) {
  const name = input.name?.trim();
  const contactName = input.contactName?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const memberBenefit = input.memberBenefit?.trim();
  const services = (input.services ?? []).filter((s) => VALID_SERVICES.has(s));
  const locations = (input.locations ?? [])
    .map((l) => ({
      address: l.address?.trim(),
      postal_code: l.postalCode?.trim(),
      colony: l.colony?.trim() || null,
      city: l.city?.trim() || null,
      state: l.state?.trim() || null,
      phone: l.phone?.trim() || null,
    }))
    .filter((l) => l.address);

  if (!name || !contactName || !email || !phone)
    return { error: "Completa los datos de contacto del centro." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Revisa el correo electrónico." };
  if (services.length === 0)
    return { error: "Selecciona al menos un servicio." };
  if (!memberBenefit)
    return { error: "Cuéntanos el beneficio que ofrecerás a los miembros." };
  if (locations.length === 0)
    return { error: "Agrega al menos una ubicación con dirección." };

  const admin = createAdminClient();

  // One pending/approved application per email keeps the queue clean
  const { data: existing } = await admin
    .from("wellness_centers")
    .select("id, status")
    .eq("email", email)
    .in("status", ["pending", "approved"])
    .maybeSingle();
  if (existing) {
    return {
      error:
        existing.status === "pending"
          ? "Ya tenemos una solicitud en revisión con ese correo. El comité te contactará pronto."
          : "Ese correo ya pertenece a un centro aliado. Escríbenos si necesitas actualizar tus datos.",
    };
  }

  // Con sesión iniciada, el centro queda ligado a la cuenta para que su
  // dashboard (/centro) abra tras la aprobación. Sin sesión, se liga por
  // correo al iniciar sesión (login-destination).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: mine } = await admin
      .from("wellness_centers")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "approved"])
      .limit(1)
      .maybeSingle();
    if (mine) {
      return {
        error:
          mine.status === "pending"
            ? "Tu cuenta ya tiene una solicitud de centro en revisión. El comité te contactará pronto."
            : "Tu cuenta ya es de un centro aliado — entra a tu dashboard en /centro.",
      };
    }
  }

  const { data: center, error } = await admin
    .from("wellness_centers")
    .insert({
      user_id: user?.id ?? null,
      name,
      contact_name: contactName,
      email,
      phone,
      website: input.website?.trim() || null,
      services,
      member_benefit: memberBenefit,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !center)
    return { error: "No pudimos guardar tu solicitud. Intenta de nuevo." };

  const { error: locError } = await admin
    .from("wellness_center_locations")
    .insert(locations.map((l) => ({ ...l, center_id: center.id })));
  if (locError) {
    await admin.from("wellness_centers").delete().eq("id", center.id);
    return { error: "No pudimos guardar las ubicaciones. Intenta de nuevo." };
  }

  await sendTemplatedEmail("center_received", email, {
    contactName,
    centerName: name,
  });
  await notifyTeam(
    "notify_centers",
    "Nueva solicitud de centro aliado 📍",
    `<h2 style="color:#1E5350">Nueva solicitud de centro aliado</h2>
     <p><strong>${name}</strong> — contacto: ${contactName} (${email}).</p>
     <p>Revisa la cola en el panel → Centros.</p>`,
  );

  return { ok: true as const };
}
