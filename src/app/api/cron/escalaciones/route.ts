import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/alerts";
import { leerAjustesIA } from "@/lib/llm/gobierno";

/**
 * Recordatorio de escalaciones sin atender.
 *
 * Una conversación marcada para atención humana que nadie toma no está
 * resuelta: escalar sin que llegue una persona solo mueve el problema. Esto
 * avisa una vez pasados los minutos configurados, y no vuelve a insistir por la
 * misma escalación (`attention_notified_at`).
 *
 * Corre cada 15 minutos.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const esVercel = request.headers.get("x-vercel-cron") !== null;
  if (!esVercel && secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Sin permisos" }, { status: 401 });

  const admin = createAdminClient();
  const ajustes = await leerAjustesIA(admin);
  const minutos = Number(ajustes.ia_recordatorio_minutos ?? 0);
  if (minutos <= 0)
    return NextResponse.json({ ok: true, desactivado: true, avisadas: 0 });

  const limite = new Date(Date.now() - minutos * 60_000).toISOString();

  const { data: pendientes } = await admin
    .from("channel_conversations")
    .select(
      "id, channel, display_name, attention_reason, attention_at, assigned_to, contact_id",
    )
    .eq("needs_attention", true)
    .eq("status", "open")
    .lte("attention_at", limite)
    .is("attention_notified_at", null)
    .limit(50);

  let avisadas = 0;

  for (const conv of pendientes ?? []) {
    // ¿Ya la atendió alguien? Un mensaje saliente de una persona cuenta como
    // atendida, aunque no hayan quitado la marca.
    const { data: respuesta } = await admin
      .from("channel_messages")
      .select("id")
      .eq("conversation_id", conv.id)
      .eq("direction", "out")
      .eq("sender", "admin")
      .gte("created_at", conv.attention_at ?? new Date(0).toISOString())
      .limit(1)
      .maybeSingle();

    if (respuesta) {
      // Atendida: se limpia la marca y no se molesta a nadie.
      await admin
        .from("channel_conversations")
        .update({ needs_attention: false, attention_notified_at: new Date().toISOString() })
        .eq("id", conv.id);
      continue;
    }

    let responsable = "nadie en particular";
    if (conv.assigned_to) {
      const { data: p } = await admin
        .from("profiles")
        .select("first_name, email")
        .eq("id", conv.assigned_to)
        .maybeSingle();
      responsable = p?.first_name || p?.email || responsable;
    }

    await notifyTeam(
      "notify_channel_attention",
      `Escalación sin atender (${minutos} min) — ${conv.channel}`,
      `<p>Una conversación de <b>${conv.channel}</b>${conv.display_name ? ` con <b>${conv.display_name}</b>` : ""} lleva más de ${minutos} minutos esperando.</p>
       <p>Motivo de la escalación: <b>${conv.attention_reason ?? "sin motivo registrado"}</b></p>
       <p>Asignada a: <b>${responsable}</b></p>
       <p>Ábrela en el portal de ventas → Conversaciones.</p>`,
    );

    await admin
      .from("channel_conversations")
      .update({ attention_notified_at: new Date().toISOString() })
      .eq("id", conv.id);
    avisadas += 1;
  }

  return NextResponse.json({
    ok: true,
    revisadas: pendientes?.length ?? 0,
    avisadas,
    minutos,
  });
}
