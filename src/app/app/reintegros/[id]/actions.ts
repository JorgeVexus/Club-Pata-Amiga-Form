"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/alerts";

/**
 * Respuesta del miembro en el hilo de su reintegro — mismo patrón que el
 * hilo por mascota: cada área tiene su propia conversación con el comité.
 */
export async function replyReimbursementThread(
  reimbursementId: string,
  message: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const text = message?.trim();
  if (!text || text.length < 2) return { error: "Escribe tu mensaje." };

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("reimbursements")
    .select("id, folio, user_id")
    .eq("id", reimbursementId)
    .single();
  if (!req || req.user_id !== user.id)
    return { error: "No encontramos tu solicitud." };

  await admin.from("reimbursement_messages").insert({
    reimbursement_id: reimbursementId,
    sender: "member",
    author_id: user.id,
    message: text,
  });

  await notifyTeam(
    "notify_reimbursements",
    `Respuesta en el reintegro ${req.folio} 💬`,
    `<h2 style="color:#1E5350">El miembro respondió sobre ${req.folio}</h2>
     <p>${text}</p>
     <p>Revisa el hilo en el panel → Reintegros.</p>`,
  );

  revalidatePath(`/app/reintegros/${reimbursementId}`);
  return { ok: true as const };
}
