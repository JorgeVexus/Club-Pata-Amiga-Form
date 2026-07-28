import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { getTemplateDef, renderTemplate } from "./templates";

/**
 * Envía un correo transaccional por su clave de plantilla. Si el comité
 * personalizó la plantilla en /admin/comunicados se usa esa versión; si no,
 * la versión por defecto en código. Nunca lanza: un correo fallido no debe
 * romper el flujo que lo dispara.
 */
export async function sendTemplatedEmail(
  key: string,
  to: string,
  vars: Record<string, string> = {},
): Promise<boolean> {
  const def = getTemplateDef(key);
  if (!def) {
    console.error(`email template desconocida: ${key}`);
    return false;
  }

  try {
    const admin = createAdminClient();
    const { data: override } = await admin
      .from("email_templates")
      .select("subject, html")
      .eq("key", key)
      .maybeSingle();

    const subject = renderTemplate(override?.subject ?? def.subject, vars);
    const html = renderTemplate(override?.html ?? def.html, vars);

    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`email "${key}" rejected`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`email "${key}" failed`, e);
    return false;
  }
}
