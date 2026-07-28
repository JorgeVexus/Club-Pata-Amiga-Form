import type { createAdminClient } from "@/lib/supabase/admin";
import { emitEvent } from "@/lib/crm/events";

type Admin = ReturnType<typeof createAdminClient>;

/** Como en GoHighLevel: hasta 10 registros en uno. Más que eso ya es un lote. */
export const MAX_A_FUSIONAR = 10;

export type ResultadoFusion = {
  masterId: string;
  fusionados: number;
  movido: {
    identidades: number;
    etiquetas: number;
    actividades: number;
    tareas: number;
    oportunidades: number;
    conversaciones: number;
    seguidores: number;
  };
};

/**
 * Fusiona contactos duplicados en un registro maestro.
 *
 * NO SE PIERDE NADA: identidades, etiquetas, notas, tareas, oportunidades,
 * conversaciones, seguidores y campos personalizados terminan en el maestro, y
 * la fusión queda en su línea de tiempo con el detalle de qué se unió — para
 * poder entender después qué pasó.
 *
 * En los datos del maestro gana lo que ya tenía: si el maestro tiene nombre, no
 * se sobrescribe con el del duplicado. Los huecos sí se llenan.
 */
export async function mergeContacts(
  admin: Admin,
  input: { masterId: string; otherIds: string[]; actorId: string },
): Promise<ResultadoFusion> {
  const otros = [...new Set(input.otherIds)].filter((id) => id !== input.masterId);
  if (otros.length === 0) throw new Error("No hay contactos que fusionar");
  if (otros.length + 1 > MAX_A_FUSIONAR)
    throw new Error(`Se pueden fusionar hasta ${MAX_A_FUSIONAR} contactos a la vez`);

  const { data: maestro } = await admin
    .from("contacts")
    .select(
      "id, first_name, last_name, birth_date, city, state, source, contact_type, owner_id, custom_fields, dnd, profile_id, campaign_lead_id, ambassador_id, center_id",
    )
    .eq("id", input.masterId)
    .maybeSingle();
  if (!maestro) throw new Error("El contacto maestro no existe");

  const { data: duplicados } = await admin
    .from("contacts")
    .select(
      "id, first_name, last_name, birth_date, city, state, source, contact_type, owner_id, custom_fields, dnd, profile_id, campaign_lead_id, ambassador_id, center_id",
    )
    .in("id", otros);
  if (!duplicados || duplicados.length === 0)
    throw new Error("No se encontraron los contactos a fusionar");

  const movido = {
    identidades: 0,
    etiquetas: 0,
    actividades: 0,
    tareas: 0,
    oportunidades: 0,
    conversaciones: 0,
    seguidores: 0,
  };

  // --- Identidades: se mueven las que el maestro no tenga ya ---------------
  const { data: yaTiene } = await admin
    .from("contact_identities")
    .select("kind, value")
    .eq("contact_id", input.masterId);
  const suyas = new Set((yaTiene ?? []).map((i) => `${i.kind}:${i.value}`));

  const { data: ajenas } = await admin
    .from("contact_identities")
    .select("id, kind, value")
    .in("contact_id", otros);

  for (const ident of ajenas ?? []) {
    if (suyas.has(`${ident.kind}:${ident.value}`)) {
      // El maestro ya la tiene: la copia se descarta (el unique la rechazaría).
      await admin.from("contact_identities").delete().eq("id", ident.id);
      continue;
    }
    await admin
      .from("contact_identities")
      .update({ contact_id: input.masterId, is_primary: false })
      .eq("id", ident.id);
    suyas.add(`${ident.kind}:${ident.value}`);
    movido.identidades += 1;
  }

  // --- Etiquetas ----------------------------------------------------------
  const { data: etiquetasAjenas } = await admin
    .from("contact_tags")
    .select("tag_id, added_by")
    .in("contact_id", otros);
  if (etiquetasAjenas && etiquetasAjenas.length > 0) {
    await admin.from("contact_tags").upsert(
      etiquetasAjenas.map((t) => ({
        contact_id: input.masterId,
        tag_id: t.tag_id,
        added_by: t.added_by,
      })),
      { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
    );
    movido.etiquetas = etiquetasAjenas.length;
  }

  // --- Seguidores ---------------------------------------------------------
  const { data: seguidoresAjenos } = await admin
    .from("contact_followers")
    .select("user_id")
    .in("contact_id", otros);
  if (seguidoresAjenos && seguidoresAjenos.length > 0) {
    await admin.from("contact_followers").upsert(
      seguidoresAjenos.map((s) => ({
        contact_id: input.masterId,
        user_id: s.user_id,
      })),
      { onConflict: "contact_id,user_id", ignoreDuplicates: true },
    );
    movido.seguidores = seguidoresAjenos.length;
  }

  // --- Historia y trabajo: se reapunta al maestro --------------------------
  for (const tabla of ["contact_activities", "tasks", "opportunities"] as const) {
    const { data: filas } = await admin
      .from(tabla)
      .update({ contact_id: input.masterId })
      .in("contact_id", otros)
      .select("id");
    const n = filas?.length ?? 0;
    if (tabla === "contact_activities") movido.actividades = n;
    if (tabla === "tasks") movido.tareas = n;
    if (tabla === "opportunities") movido.oportunidades = n;
  }

  const { data: convs } = await admin
    .from("channel_conversations")
    .update({ contact_id: input.masterId })
    .in("contact_id", otros)
    .select("id");
  movido.conversaciones = convs?.length ?? 0;

  // --- Datos: el maestro conserva lo suyo, solo se llenan huecos ----------
  const patch: Record<string, unknown> = {};
  const camposSimples = [
    "first_name",
    "last_name",
    "birth_date",
    "city",
    "state",
    "source",
    "owner_id",
    "profile_id",
    "campaign_lead_id",
    "ambassador_id",
    "center_id",
  ] as const;

  for (const campo of camposSimples) {
    if (maestro[campo]) continue;
    const donante = duplicados.find((d) => d[campo]);
    if (donante) patch[campo] = donante[campo];
  }

  // Campos personalizados y DND: unión, con el maestro ganando en empate.
  const custom: Record<string, unknown> = {};
  const dnd: Record<string, boolean> = {};
  for (const d of duplicados) {
    Object.assign(custom, (d.custom_fields as Record<string, unknown>) ?? {});
    Object.assign(dnd, (d.dnd as Record<string, boolean>) ?? {});
  }
  Object.assign(custom, (maestro.custom_fields as Record<string, unknown>) ?? {});
  // En DND gana la restricción: si alguno decía "no contactar", se respeta.
  for (const [k, v] of Object.entries(
    (maestro.dnd as Record<string, boolean>) ?? {},
  ))
    if (v) dnd[k] = true;
  patch.custom_fields = custom;
  patch.dnd = dnd;

  // El tipo más específico gana (miembro > embajador > centro > lead).
  const RANGO: Record<string, number> = {
    otro: 0,
    lead: 1,
    centro: 2,
    embajador: 3,
    miembro: 4,
  };
  const mejorTipo = [maestro, ...duplicados].reduce(
    (mejor, c) =>
      (RANGO[c.contact_type] ?? 0) > (RANGO[mejor] ?? 0) ? c.contact_type : mejor,
    maestro.contact_type,
  );
  if (mejorTipo !== maestro.contact_type) patch.contact_type = mejorTipo;

  patch.updated_at = new Date().toISOString();
  await admin.from("contacts").update(patch).eq("id", input.masterId);

  // --- Se borran los duplicados (ya sin nada colgando) --------------------
  const nombres = duplicados.map(
    (d) => [d.first_name, d.last_name].filter(Boolean).join(" ") || d.id,
  );
  await admin.from("contacts").delete().in("id", otros);

  // --- Contadores y bitácora ---------------------------------------------
  await recontar(admin, input.masterId);

  await emitEvent(admin, {
    contactId: input.masterId,
    kind: "contactos_fusionados",
    summary: `Se fusionaron ${duplicados.length} contacto(s): ${nombres.join(", ")}`,
    payload: { fusionados: otros, nombres, movido },
    actorId: input.actorId,
  });

  return { masterId: input.masterId, fusionados: duplicados.length, movido };
}

async function recontar(admin: Admin, contactId: string) {
  const [{ count: notas }, { count: tareas }] = await Promise.all([
    admin
      .from("contact_activities")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contactId)
      .eq("kind", "nota"),
    admin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contactId)
      .is("completed_at", null),
  ]);
  await admin
    .from("contacts")
    .update({ notes_count: notas ?? 0, tasks_open_count: tareas ?? 0 })
    .eq("id", contactId);
}

export type ParejaDuplicada = {
  a: string;
  b: string;
  motivo: string;
};

/**
 * Candidatos a duplicado.
 *
 * Dos fuentes: los avisos que dejó `resolveContact` cuando decidió NO unir
 * (comparten teléfono, o un contacto acumuló dos cuentas de plataforma), y los
 * nombres idénticos entre contactos sin identidad en común.
 */
export async function candidatosDuplicados(
  admin: Admin,
): Promise<ParejaDuplicada[]> {
  const parejas = new Map<string, ParejaDuplicada>();
  const agregar = (a: string, b: string, motivo: string) => {
    if (a === b) return;
    const clave = [a, b].sort().join("|");
    if (!parejas.has(clave)) parejas.set(clave, { a, b, motivo });
  };

  // 1. Avisos guardados al momento de decidir no unir
  const { data: avisos } = await admin
    .from("contact_activities")
    .select("contact_id, payload, summary")
    .eq("kind", "contacto_creado")
    .ilike("summary", "%duplicado%")
    .order("created_at", { ascending: false })
    .limit(200);

  for (const aviso of avisos ?? []) {
    const p = (aviso.payload ?? {}) as Record<string, unknown>;
    const otro = typeof p.otroContacto === "string" ? p.otroContacto : null;
    const nuevo = typeof p.nuevoContacto === "string" ? p.nuevoContacto : null;
    if (otro && nuevo) agregar(otro, nuevo, "Mismo teléfono, nombres distintos");
    else if (Array.isArray(p.contactIds))
      for (const id of p.contactIds as string[])
        agregar(aviso.contact_id, id, "Varias identidades apuntaban a distintos contactos");
  }

  // 2. Nombre idéntico (sin acentos ni mayúsculas) entre contactos distintos
  const { data: todos } = await admin
    .from("contacts")
    .select("id, first_name, last_name")
    .limit(2000);
  const porNombre = new Map<string, string[]>();
  for (const c of todos ?? []) {
    const clave = `${c.first_name ?? ""} ${c.last_name ?? ""}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    if (clave.length < 5) continue; // nombres vacíos o de una letra no son indicio
    porNombre.set(clave, [...(porNombre.get(clave) ?? []), c.id]);
  }
  for (const ids of porNombre.values())
    if (ids.length > 1)
      for (let i = 1; i < ids.length; i++) agregar(ids[0], ids[i], "Nombre idéntico");

  return [...parejas.values()];
}
