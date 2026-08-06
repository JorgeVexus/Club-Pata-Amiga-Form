"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplatedEmail } from "@/lib/email/send";
import { notifyTeam } from "@/lib/alerts";
import { validateCurp } from "@/lib/curp";

export type AmbassadorApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  curp: string;
  state: string;
  city: string;
  isAdult: boolean;
  /** yyyy-mm-dd — lo captura el propio solicitante (equipo, 5-ago) */
  birthDate?: string;
  /** Por qué quiere ser embajador (equipo, 5-ago) */
  motivation?: string;
};

/** Solicitud pública de embajador → cola de revisión del comité (CURP, 18+). */
export async function registerAmbassador(input: AmbassadorApplicationInput) {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();
  const curp = input.curp?.trim().toUpperCase();

  if (!firstName || !email || !phone)
    return { error: "Completa tu nombre, correo y teléfono." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Revisa el correo electrónico." };
  if (!input.isAdult)
    return { error: "El programa de embajadores es para mayores de edad." };
  // Validación completa (formato + dígito verificador) — regla del sitio vivo
  const curpCheck = validateCurp(curp ?? "");
  if (!curpCheck.isValid)
    return { error: curpCheck.error ?? "Revisa tu CURP (18 caracteres, formato oficial)." };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("ambassadors")
    .select("id, status")
    .eq("email", email)
    .in("status", ["pending", "approved"])
    .maybeSingle();
  if (existing) {
    return {
      error:
        existing.status === "pending"
          ? "Ya tenemos una solicitud en revisión con ese correo. El comité te contactará pronto."
          : "Ese correo ya pertenece a un embajador activo. Inicia sesión para ver tu dashboard.",
    };
  }

  // Link the application to the signed-in account when there is one, so the
  // dashboard opens automatically after approval.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: mine } = await admin
      .from("ambassadors")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "approved"])
      .limit(1)
      .maybeSingle();
    if (mine) {
      return {
        error:
          mine.status === "pending"
            ? "Tu cuenta ya tiene una solicitud en revisión. El comité te contactará pronto."
            : "Tu cuenta ya es de un embajador activo — entra a tu dashboard en /embajador.",
      };
    }
  }

  const birthDate = input.birthDate?.trim();
  const { error } = await admin.from("ambassadors").insert({
    user_id: user?.id ?? null,
    first_name: firstName,
    last_name: lastName || null,
    email,
    phone,
    curp,
    state: input.state?.trim() || null,
    city: input.city?.trim() || null,
    birth_date:
      birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null,
    motivation: input.motivation?.trim() || null,
    status: "pending",
  });
  if (error)
    return { error: "No pudimos guardar tu solicitud. Intenta de nuevo." };

  await sendTemplatedEmail("ambassador_received", email, { firstName });
  await notifyTeam(
    "notify_ambassadors",
    "Nueva solicitud de embajador 🤝",
    `<h2 style="color:#1E5350">Nueva solicitud de embajador</h2>
     <p><strong>${firstName} ${lastName ?? ""}</strong> (${email}) quiere unirse al programa.</p>
     <p>Revisa la cola en el panel → Embajadores.</p>`,
  );

  return { ok: true as const };
}
