import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarReporte } from "@/lib/tableros/reporte";
import { diaEnMexico } from "@/lib/tableros/rango";
import { reportError } from "@/lib/alerts";

/**
 * Reporte de ventas recurrente — sección 7, punto 5.2.
 *
 * Corre todos los días y decide si hoy toca según el ajuste
 * `reporte_ventas_recurrente` (no · semanal · mensual):
 *
 *   semanal → los lunes, con los últimos 30 días
 *   mensual → el día 1, con el mes pasado completo
 *
 * El día se calcula en hora de México, no con el reloj del proceso: en Vercel
 * corre en UTC y un reporte "de los lunes" que sale los domingos por la noche
 * es un reporte que nadie pidió.
 *
 * Comparte destinatarios y armado con el botón del tablero, así que el correo
 * automático y el manual dicen exactamente lo mismo. Y como el armado vive en
 * `lib/tableros/reporte.ts`, el panel de administración puede colgarse de él
 * sin duplicar nada.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const esVercel = request.headers.get("x-vercel-cron") !== null;
  if (!esVercel && secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Sin permisos" }, { status: 401 });

  const admin = createAdminClient();

  const { data: ajuste } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "reporte_ventas_recurrente")
    .maybeSingle();
  const cadencia = (ajuste?.value ?? "no").trim();
  if (cadencia !== "semanal" && cadencia !== "mensual")
    return NextResponse.json({ ok: true, cadencia, enviado: false, razon: "apagado" });

  const hoyMx = diaEnMexico(new Date());
  const diaDelMes = Number(hoyMx.split("-")[2]);
  // Mediodía UTC del día mexicano: el día de la semana sale bien sin depender
  // del reloj del proceso. 1 = lunes.
  const diaSemana = new Date(`${hoyMx}T12:00:00Z`).getUTCDay();

  const toca =
    (cadencia === "semanal" && diaSemana === 1) ||
    (cadencia === "mensual" && diaDelMes === 1);
  if (!toca)
    return NextResponse.json({ ok: true, cadencia, enviado: false, razon: "hoy no toca" });

  try {
    const res = await enviarReporte(
      admin,
      cadencia === "mensual" ? "mes_pasado" : "ultimos_30",
    );
    return NextResponse.json({ ok: true, cadencia, ...res });
  } catch (e) {
    await reportError("reporte-recurrente", e, { cadencia });
    return NextResponse.json({ ok: false, cadencia, error: "falló el envío" });
  }
}
