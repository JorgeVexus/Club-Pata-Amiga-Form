"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import {
  armarCsv,
  COLUMNAS_EMBUDO,
  registrarExportacion,
} from "@/lib/tableros/exportar";
import { enviarReporte } from "@/lib/tableros/reporte";
import { rangoDe, type Preset } from "@/lib/tableros/rango";

/**
 * Acciones del tablero: exportar y mandar el reporte.
 *
 * El reporte se arma EN EL SERVIDOR con datos vivos — nunca con lo que el
 * navegador tenga en pantalla. Si alguien deja la pestaña abierta media hora,
 * el correo debe llevar los números de ahora, no los de entonces.
 */

/** El CSV de las oportunidades del embudo, con los permisos del rol. */
export async function exportarEmbudo(input: {
  periodo?: string;
  etapa?: string;
}) {
  const { userId, role } = await requireCapability("contactos.ver");
  const admin = createAdminClient();

  const preset = (input.periodo ?? "mes_actual") as Preset;
  const rango = rangoDe(preset === "personalizado" ? "mes_actual" : preset);

  let consulta = admin
    .from("opportunities")
    .select(
      "title, value_cents, status, created_at, pipeline_stages!stage_id(key, name), contacts!contact_id(first_name, last_name), profiles!owner_id(first_name, last_name)",
    )
    .gte("created_at", rango.desde.toISOString())
    .lte("created_at", rango.hasta.toISOString())
    .limit(5000);

  if (input.etapa) {
    const { data: etapa } = await admin
      .from("pipeline_stages")
      .select("id")
      .eq("key", input.etapa)
      .maybeSingle();
    if (etapa) consulta = consulta.eq("stage_id", etapa.id);
  }

  const { data, error } = await consulta;
  if (error) return { error: "No se pudo leer el embudo." };

  const uno = <T,>(x: T | T[] | null): T | null =>
    Array.isArray(x) ? (x[0] ?? null) : x;

  const filas = (data ?? []).map((o) => {
    const etapa = uno(o.pipeline_stages);
    const contacto = uno(o.contacts);
    const duenio = uno(o.profiles);
    return {
      etapa: etapa?.name ?? "",
      titulo: o.title,
      contacto: [contacto?.first_name, contacto?.last_name].filter(Boolean).join(" "),
      valor: (o.value_cents ?? 0) / 100,
      estado: o.status,
      propietario: [duenio?.first_name, duenio?.last_name].filter(Boolean).join(" "),
      creada: new Date(o.created_at).toLocaleDateString("es-MX"),
      // Se deja fuera a propósito: el correo solo aparece si el rol puede.
      correo: "",
    };
  });

  const { csv, columnas } = armarCsv(filas, COLUMNAS_EMBUDO, role);
  await registrarExportacion(admin, {
    userId,
    rol: role,
    recurso: "embudo",
    filtros: { periodo: preset, etapa: input.etapa ?? null },
    filas: filas.length,
    columnas,
  });

  return {
    ok: true as const,
    csv,
    nombre: `embudo-${rango.etiqueta.replace(/\s+/g, "-")}.csv`,
    filas: filas.length,
  };
}

/**
 * Manda el reporte a los destinatarios de Sitio web → Notificaciones.
 *
 * Se comparte la clave `notify_reports` con el panel a propósito: un solo
 * lugar donde el equipo decide a quién le llegan los reportes.
 */
export async function enviarReporteVentas(preset: Preset = "mes_actual") {
  const { role } = await requireCapability("tablero.equipo");
  const admin = createAdminClient();

  const res = await enviarReporte(admin, preset);
  if (!res.enviado) return { error: `No se envió: ${res.razon}` };

  console.info(`[tablero] reporte de ventas enviado por ${role} a ${res.destinatarios}`);
  return { ok: true as const, destinatarios: res.destinatarios };
}
