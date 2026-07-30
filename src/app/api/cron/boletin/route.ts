import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEdicion } from "@/lib/newsletter/envio";

/**
 * Envío del boletín. Corre cada 10 minutos.
 *
 * Su consulta es la misma idea que la del calendario: solo salen las ediciones
 * PROGRAMADAS, aprobadas, con prueba enviada y cuya hora ya llegó. La pantalla
 * no participa.
 *
 * Cada pasada manda un lote. Si una edición tiene más suscriptores que el
 * lote, la siguiente corrida sigue donde iba — sin repetir a nadie, porque
 * `unique (edition_id, email)` y el estado de cada fila lo impiden.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const esVercel = request.headers.get("x-vercel-cron") !== null;
  if (!esVercel && secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Sin permisos" }, { status: 401 });

  const admin = createAdminClient();

  const { data: listas } = await admin
    .from("newsletter_editions")
    .select("id")
    .eq("status", "programada")
    .not("approved_by", "is", null)
    .not("test_sent_at", "is", null)
    .lte("scheduled_for", new Date().toISOString())
    .limit(3);

  const resultados: Record<string, unknown>[] = [];
  for (const ed of listas ?? []) {
    const r = await enviarEdicion(admin, ed.id);
    resultados.push({ edicion: ed.id, ...r });
  }

  return NextResponse.json({ ok: true, ediciones: resultados.length, resultados });
}
