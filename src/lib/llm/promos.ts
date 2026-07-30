import { createAdminClient } from "@/lib/supabase/admin";
import { hoyEnMexico } from "@/lib/zona-horaria";

/**
 * Promociones vigentes para inyectar en el prompt de un agente. Vigente =
 * activa + ya empezó + no ha terminado. Se administran en
 * /admin/conversaciones (tabla agent_promos) — el material rota solo.
 */
export async function fetchActivePromosText(
  audience: "support" | "sales",
): Promise<string | undefined> {
  const admin = createAdminClient();
  // Hoy en México: el agente no debe dejar de ofrecer una promo que vence hoy
  // porque para el servidor (UTC) ya es mañana.
  const today = hoyEnMexico();
  const { data: promos } = await admin
    .from("agent_promos")
    .select("title, content")
    .eq("active", true)
    .in("audience", ["both", audience])
    .lte("starts_on", today)
    .or(`ends_on.is.null,ends_on.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!promos?.length) return undefined;
  return (
    "PROMOCIONES Y AVISOS VIGENTES (menciónalos cuando sean relevantes)\n" +
    promos.map((p) => `- ${p.title}: ${p.content}`).join("\n")
  );
}
