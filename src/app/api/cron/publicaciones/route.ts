import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  avisarAntesDePublicar,
  publicarPendientes,
} from "@/lib/content/publicador";

/**
 * Publicador del calendario de contenido. Corre cada 5 minutos.
 *
 * Hace dos cosas en cada pasada:
 *   1. Avisa de lo que se publica dentro de la ventana de antelación, para que
 *      alguien pueda detenerlo.
 *   2. Publica lo que ya cumplió su hora, canal por canal.
 *
 * La antelación se edita en /admin/sitio (clave `contenido_aviso_horas`).
 * Mientras el equipo no decida, son 2 horas — lo que dice la spec.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const esVercel = request.headers.get("x-vercel-cron") !== null;
  if (!esVercel && secret && auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Sin permisos" }, { status: 401 });

  const admin = createAdminClient();

  let horas = 2;
  try {
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "contenido_aviso_horas")
      .maybeSingle();
    const leido = Number(data?.value);
    if (Number.isFinite(leido) && leido >= 0) horas = leido;
  } catch {
    // Si no se puede leer el ajuste, se usan las 2 horas por omisión: mejor
    // avisar de más que dejar salir algo sin aviso.
  }

  const avisados = await avisarAntesDePublicar(admin, horas);
  const resumen = await publicarPendientes(admin);

  return NextResponse.json({ ok: true, avisosPrevios: avisados, ...resumen });
}
