"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/alerts";

/**
 * Marca la bienvenida como vista (bandera en BD, no localStorage): el popup
 * del miembro aparece solo la primera vez, sin importar dispositivo/navegador.
 */
export async function markWelcomeShown() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ welcome_shown: true })
    .eq("id", user.id);
}

/**
 * Botón de emergencia: registra el evento y avisa al equipo de inmediato
 * (destinatarios en Admin → Sitio web → notify_emergencies).
 */
export async function reportEmergency() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, email, phone")
    .eq("id", user.id)
    .single();

  await admin.from("emergency_logs").insert({
    user_id: user.id,
    phone: profile?.phone ?? null,
  });

  await notifyTeam(
    "notify_emergencies",
    "🚨 Botón de emergencia activado",
    `<h2 style="color:#B3261E">Un miembro activó el botón de emergencia</h2>
     <p><strong>${profile?.first_name ?? ""} ${profile?.last_name ?? ""}</strong> (${profile?.email ?? user.email})</p>
     <p>Teléfono: ${profile?.phone ?? "sin registrar"}</p>
     <p>Contáctalo de inmediato.</p>`,
  );

  return { ok: true as const };
}
