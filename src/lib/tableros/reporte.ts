import type { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { embudo, tarjetas } from "@/lib/tableros/metricas";
import { periodoAnterior, rangoDe, type Preset } from "@/lib/tableros/rango";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * El reporte de ventas, armado con datos vivos.
 *
 * Vive aquí y no dentro de la server action porque lo usan dos caminos: el
 * botón del tablero y la tarea nocturna del reporte recurrente. Un solo lugar
 * es lo que garantiza que el correo automático y el manual digan lo mismo.
 */
export async function armarReporte(
  admin: Admin,
  preset: Preset,
): Promise<string> {
  const rango = rangoDe(preset);
  const anterior = periodoAnterior(rango, preset);

  const [filasTarjetas, filasEmbudo] = await Promise.all([
    tarjetas(admin, rango, anterior),
    embudo(admin, rango),
  ]);

  const numero = (valor: number, formato: string) =>
    formato === "dinero"
      ? `$${Math.round(valor).toLocaleString("es-MX")}`
      : formato === "porcentaje"
        ? `${valor.toFixed(1)}%`
        : Math.round(valor).toLocaleString("es-MX");

  return [
    `Reporte de ventas · ${rango.etiqueta}`,
    `Comparado contra ${anterior.etiqueta}`,
    "",
    "NÚMEROS DEL PERÍODO",
    ...filasTarjetas.map((t) => {
      const valor = t.texto ?? numero(t.valor, t.formato);
      const comparacion =
        t.variacion === null
          ? "(sin comparación)"
          : `(${t.variacion >= 0 ? "+" : ""}${t.variacion.toFixed(0)}%)`;
      return `· ${t.etiqueta}: ${valor} ${comparacion}${t.detalle ? ` — ${t.detalle}` : ""}`;
    }),
    "",
    "EMBUDO",
    ...filasEmbudo.map(
      (e) =>
        `· ${e.nombre}: ${e.cuantas} · $${Math.round(e.pesos).toLocaleString("es-MX")}` +
        (e.porcentajeDelTotal === null
          ? ""
          : ` (${e.porcentajeDelTotal.toFixed(0)}% del total del período)`),
    ),
  ].join("\n");
}

/** Los destinatarios de reportes, compartidos con el panel de administración. */
export async function destinatariosDeReportes(admin: Admin): Promise<string[]> {
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "notify_reports")
    .maybeSingle();
  return (data?.value ?? "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export async function enviarReporte(
  admin: Admin,
  preset: Preset,
): Promise<{ enviado: true; destinatarios: number } | { enviado: false; razon: string }> {
  const destinos = await destinatariosDeReportes(admin);
  if (destinos.length === 0)
    return {
      enviado: false,
      razon:
        "no hay destinatarios configurados (Sitio web → Notificaciones → Reporte de métricas)",
    };

  const reporte = await armarReporte(admin, preset);
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: destinos,
      subject: `Reporte de ventas · ${rangoDe(preset).etiqueta}`,
      html: `<div style="font-family:sans-serif;color:#3D524F;line-height:1.7;white-space:pre-line">${reporte
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>`,
    });
    if (error) return { enviado: false, razon: error.message };
  } catch (err) {
    return {
      enviado: false,
      razon: err instanceof Error ? err.message : "no se pudo enviar",
    };
  }
  return { enviado: true, destinatarios: destinos.length };
}

/** Lo que llama la tarea nocturna cuando toca el día. */
export const enviarReporteRecurrente = enviarReporte;
