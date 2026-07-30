import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { uno } from "@/lib/crm/embed";
import { hoyEnMexico } from "@/lib/zona-horaria";

/**
 * Exporta los contactos a CSV con los filtros aplicados.
 *
 * Solo columnas del CRM: `contacts` no guarda datos sensibles del miembro (INE,
 * CURP, RFC, bancarios), así que no hay nada que filtrar por rol aquí. Cuando la
 * fase 7 agregue exportaciones que toquen montos, ahí se define el registro de
 * auditoría de descargas que pide la sección 7.
 */

const CABECERAS = [
  "nombre",
  "apellido",
  "tipo",
  "correo",
  "telefono",
  "canales",
  "etiquetas",
  "propietario",
  "fuente",
  "ciudad",
  "estado",
  "es_miembro",
  "no_contactar",
  "ultima_actividad",
];

/** Escapa un valor para CSV (comillas, comas, saltos de línea). */
function csv(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  await requireCapability("contactos.ver");

  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo") ?? "";
  const propietario = url.searchParams.get("propietario") ?? "";
  const etiqueta = url.searchParams.get("etiqueta") ?? "";

  const admin = createAdminClient();
  let consulta = admin
    .from("contacts")
    .select(
      `id, first_name, last_name, contact_type, source, city, state, dnd, last_activity_at, profile_id, owner_id,
       contact_identities(kind, value),
       contact_tags(tags(id, name))`,
    )
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(5000);

  if (tipo) consulta = consulta.eq("contact_type", tipo);
  if (propietario === "sin") consulta = consulta.is("owner_id", null);
  else if (propietario && propietario !== "mios")
    consulta = consulta.eq("owner_id", propietario);

  const [{ data: rows }, { data: equipo }] = await Promise.all([
    consulta,
    admin
      .from("profiles")
      .select("id, first_name, email")
      .in("role", ["ventas", "gerente_ventas", "admin", "super_admin"]),
  ]);

  const nombrePorId = new Map(
    (equipo ?? []).map((m) => [m.id, m.first_name || m.email || ""]),
  );

  const lineas = [CABECERAS.join(",")];
  for (const c of rows ?? []) {
    const ids = (c.contact_identities ?? []) as { kind: string; value: string }[];
    const tags = (c.contact_tags ?? []).flatMap((t) => {
      const tag = uno(t.tags);
      return tag ? [tag] : [];
    });

    if (etiqueta && !tags.some((t) => t.id === etiqueta)) continue;

    lineas.push(
      [
        c.first_name,
        c.last_name,
        c.contact_type,
        ids.find((i) => i.kind === "email")?.value ?? "",
        ids.find((i) => i.kind === "phone")?.value ?? "",
        [...new Set(ids.map((i) => i.kind))].join(" "),
        // Separadas por punto y coma, como las espera el importador de la fase 1d
        tags.map((t) => t.name).join("; "),
        c.owner_id ? nombrePorId.get(c.owner_id) ?? "" : "",
        c.source,
        c.city,
        c.state,
        c.profile_id ? "sí" : "no",
        Object.keys((c.dnd as Record<string, boolean>) ?? {}).join(" "),
        c.last_activity_at,
      ]
        .map(csv)
        .join(","),
    );
  }

  // Hoy en México, para que el archivo no se llame con la fecha de mañana
  // cuando alguien lo baja por la noche.
  const hoy = hoyEnMexico();
  // BOM para que Excel en Windows abra los acentos bien.
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contactos-pata-amiga-${hoy}.csv"`,
    },
  });
}
