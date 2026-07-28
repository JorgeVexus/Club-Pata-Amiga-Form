import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";

/**
 * Alertas internas del equipo. Los destinatarios por evento viven en
 * site_settings (clave notify_<evento>, correos separados por coma) y se
 * editan en /admin/sitio. Nunca lanzan: una alerta fallida no debe romper
 * el flujo que la origina.
 */

async function recipientsFor(event: string): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", event)
      .maybeSingle();
    return (data?.value ?? "")
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  } catch {
    return [];
  }
}

/** Envía un aviso al equipo según la configuración del evento. */
export async function notifyTeam(
  event: string,
  subject: string,
  html: string,
) {
  const to = await recipientsFor(event);
  if (to.length === 0) return;
  try {
    await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: `<div style="font-family:sans-serif;color:#3D524F;line-height:1.6">${html}
        <p style="color:#6B7C79;font-size:12px">Aviso automático del panel del comité · Club Pata Amiga</p></div>`,
    });
  } catch (e) {
    console.error(`team alert "${event}" failed`, e);
  }
}

/**
 * Registra un error del sistema (tabla error_logs) y avisa al equipo
 * configurado en "Errores del sistema".
 */
export async function reportError(
  context: string,
  error: unknown,
  detail?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, error);
  try {
    const admin = createAdminClient();
    await admin.from("error_logs").insert({
      context,
      message: message.slice(0, 500),
      detail: detail ?? null,
    });
  } catch (e) {
    console.error("error_logs insert failed", e);
  }
  await notifyTeam(
    "notify_errors",
    `⚠️ Error en ${context} — Club Pata Amiga`,
    `<h2 style="color:#C22A56">Error en ${context}</h2>
     <p><strong>Mensaje:</strong> ${message.slice(0, 500)}</p>
     ${detail ? `<pre style="background:#FAF7F1;padding:12px;border-radius:8px;font-size:12px">${JSON.stringify(detail, null, 2).slice(0, 1000)}</pre>` : ""}
     <p>Revisa el panel para más contexto.</p>`,
  );
}
