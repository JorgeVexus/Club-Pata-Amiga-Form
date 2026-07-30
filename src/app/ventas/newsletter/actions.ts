"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { leerAjustesIA } from "@/lib/llm/gobierno";
import { notifyTeam } from "@/lib/alerts";
import { revisarTerminologia } from "@/lib/content/terminologia";
import {
  generarHuecos,
  puedeInvestigarse,
} from "@/lib/newsletter/calendario";
import { investigar, redactar, type MaterialInvestigado } from "@/lib/newsletter/agentes";
import {
  LAYOUT_POR_OMISION,
  normalizarBloques,
  renderCorreo,
  type Bloque,
} from "@/lib/newsletter/bloques";

/**
 * Boletín — el circuito completo.
 *
 *   tema con brief → investigar → redactar → revisión → aprobar → prueba →
 *   programar
 *
 * Las tres compuertas (aprobación, prueba enviada, revisión veterinaria) ya
 * las impone la base. Estas acciones son la puerta de entrada normal, vuelven
 * a preguntar por el rol y avisan a quien toca.
 */

function revalidar() {
  revalidatePath("/ventas/newsletter");
  revalidatePath("/ventas");
}

type Admin = ReturnType<typeof createAdminClient>;

/** La plantilla elegida, o la vigente por omisión, o el layout de arranque. */
async function plantillaDe(admin: Admin, templateId: string | null) {
  const { data } = templateId
    ? await admin
        .from("newsletter_templates")
        .select("id, name, layout, sample")
        .eq("id", templateId)
        .maybeSingle()
    : await admin
        .from("newsletter_templates")
        .select("id, name, layout, sample")
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();
  return data ?? null;
}

/** El material de la última investigación de una edición. */
async function materialDe(
  admin: Admin,
  editionId: string,
): Promise<MaterialInvestigado | null> {
  const { data } = await admin
    .from("newsletter_runs")
    .select("output")
    .eq("edition_id", editionId)
    .eq("kind", "investigacion")
    .is("error", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.output as MaterialInvestigado) ?? null;
}

/* ------------------------------------------------ calendario editorial ---- */

export async function crearProgramacion(input: {
  nombre: string;
  cadencia: "diaria" | "semanal" | "mensual";
  diaSemana?: number;
  diaMes?: number;
  inicia: string;
  termina?: string;
}) {
  const { userId } = await requireCapability("boletin.programar");
  if (!input.nombre.trim()) return { error: "Ponle nombre a la programación." };
  if (!input.inicia) return { error: "Falta la fecha de inicio." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_schedule")
    .insert({
      name: input.nombre.trim(),
      cadence: input.cadencia,
      weekday: input.cadencia === "semanal" ? (input.diaSemana ?? 1) : null,
      month_day: input.cadencia === "mensual" ? (input.diaMes ?? 1) : null,
      starts_on: input.inicia,
      ends_on: input.termina || null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo crear la programación." };

  // Los huecos se crean de una vez: el valor de esto es ver el año completo.
  const res = await generarHuecos(admin, data.id, userId);
  revalidar();
  if ("error" in res) return { ok: true as const, aviso: res.error };
  return {
    ok: true as const,
    aviso: `Programación creada con ${res.creados} hueco(s) ✓`,
  };
}

export async function regenerarHuecos(scheduleId: string) {
  const { userId } = await requireCapability("boletin.programar");
  const admin = createAdminClient();
  const res = await generarHuecos(admin, scheduleId, userId);
  revalidar();
  if ("error" in res) return { error: res.error };
  return {
    ok: true as const,
    aviso: `${res.creados} hueco(s) nuevo(s); ${res.yaExistian} ya estaban ✓`,
  };
}

/* ------------------------------------------------------------- temas ----- */

export async function guardarTema(input: {
  id?: string;
  fecha: string;
  titulo: string;
  brief: string;
  incluir?: string;
  evitar?: string;
  fuentes?: string;
  esSalud: boolean;
}) {
  const { userId } = await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const fila = {
    planned_for: input.fecha,
    title: input.titulo.trim() || "Sin título",
    brief: input.brief.trim() || null,
    must_include: input.incluir?.trim() || null,
    must_avoid: input.evitar?.trim() || null,
    sources: (input.fuentes ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    is_health: input.esSalud,
    status: input.brief.trim() ? "listo_para_investigar" : "planeado",
  };

  const { error } = input.id
    ? await admin.from("newsletter_topics").update(fila).eq("id", input.id)
    : await admin.from("newsletter_topics").insert({ ...fila, created_by: userId });
  if (error) return { error: "No se pudo guardar el tema." };

  revalidar();
  return { ok: true as const };
}

/* ---------------------------------------------------------- agentes ------ */

export async function investigarTema(topicId: string) {
  const { userId } = await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const { data: tema } = await admin
    .from("newsletter_topics")
    .select("id, title, brief, must_include, must_avoid, sources, is_health, status")
    .eq("id", topicId)
    .maybeSingle();
  if (!tema) return { error: "Ese tema no existe." };

  // LA condición de arranque de toda la sección.
  const permiso = puedeInvestigarse(tema);
  if (!permiso.ok) return { error: permiso.razon };

  // Una edición por tema; si ya existe, se reusa (rehacer no empieza de cero).
  let { data: edicion } = await admin
    .from("newsletter_editions")
    .select("id")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edicion) {
    const { data } = await admin
      .from("newsletter_editions")
      .insert({ topic_id: topicId, created_by: userId })
      .select("id")
      .single();
    edicion = data;
  }
  if (!edicion) return { error: "No se pudo abrir la edición." };

  const res = await investigar(admin, {
    editionId: edicion.id,
    tema: {
      title: tema.title,
      brief: tema.brief ?? "",
      must_include: tema.must_include,
      must_avoid: tema.must_avoid,
      sources: tema.sources,
      is_health: tema.is_health,
    },
    userId,
  });
  if (!res.ok) return { error: res.error };

  await admin
    .from("newsletter_editions")
    .update({ status: "investigada" })
    .eq("id", edicion.id);
  await admin
    .from("newsletter_topics")
    .update({ status: "con_edicion" })
    .eq("id", topicId);

  const conFuente = res.datos.hallazgos.filter((h) => h.verificado).length;
  const sinFuente = res.datos.hallazgos.length - conFuente;
  revalidar();
  return {
    ok: true as const,
    aviso: `${conFuente} hallazgo(s) con fuente${sinFuente ? `, ${sinFuente} sin fuente (no se pueden publicar)` : ""}${res.demo ? " · modo demostración" : ""} ✓`,
  };
}

export async function redactarEdicion(input: { editionId: string; ajuste?: string }) {
  const { userId } = await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const { data: edicion } = await admin
    .from("newsletter_editions")
    .select("id, topic_id, template_id, newsletter_topics!topic_id(title, brief, must_avoid)")
    .eq("id", input.editionId)
    .maybeSingle();
  if (!edicion) return { error: "Esa edición no existe." };

  const tema = Array.isArray(edicion.newsletter_topics)
    ? edicion.newsletter_topics[0]
    : edicion.newsletter_topics;
  if (!tema) return { error: "La edición no tiene tema." };

  const material = await materialDe(admin, input.editionId);
  if (!material)
    return { error: "Primero hay que investigar: el agente de marca no inventa material." };

  const plantilla = await plantillaDe(admin, edicion.template_id);
  const res = await redactar(admin, {
    editionId: input.editionId,
    tema: { title: tema.title, brief: tema.brief ?? "", must_avoid: tema.must_avoid },
    material,
    ajuste: input.ajuste?.trim() || undefined,
    plantilla: plantilla
      ? { name: plantilla.name, layout: plantilla.layout, sample: plantilla.sample }
      : null,
    userId,
  });
  if (!res.ok) return { error: res.error };

  await admin
    .from("newsletter_editions")
    .update({
      subject: res.datos.asunto,
      preheader: res.datos.preencabezado,
      blocks: res.datos.bloques,
      html: res.datos.html,
      template_id: plantilla?.id ?? null,
      status: "redactada",
    })
    .eq("id", input.editionId);

  revalidar();
  return {
    ok: true as const,
    aviso: `Correo armado con ${res.datos.bloques.length} bloque(s)${res.demo ? " · modo demostración" : ""} ✓`,
  };
}

/* ------------------------------------------------- edición a mano -------- */

export async function guardarEdicion(input: {
  editionId: string;
  asunto: string;
  preencabezado: string;
  bloques: Bloque[];
}) {
  await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const bloques = normalizarBloques(input.bloques);
  const { data: edicion } = await admin
    .from("newsletter_editions")
    .select("template_id")
    .eq("id", input.editionId)
    .maybeSingle();
  const plantilla = await plantillaDe(admin, edicion?.template_id ?? null);

  const html = renderCorreo({
    layout: plantilla?.layout ?? LAYOUT_POR_OMISION,
    asunto: input.asunto,
    preencabezado: input.preencabezado,
    bloques,
    enlaceBaja: "{{ENLACE_BAJA}}",
  });

  // Ojo: el disparador de la base devuelve la edición a revisión y borra la
  // prueba si estaba aprobada. No hay que hacerlo aquí.
  const { error } = await admin
    .from("newsletter_editions")
    .update({
      subject: input.asunto,
      preheader: input.preencabezado,
      blocks: bloques,
      html,
    })
    .eq("id", input.editionId);
  if (error) return { error: "No se pudo guardar." };

  revalidar();
  return { ok: true as const };
}

export async function cambiarPlantilla(editionId: string, templateId: string) {
  await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const { data: edicion } = await admin
    .from("newsletter_editions")
    .select("subject, preheader, blocks")
    .eq("id", editionId)
    .maybeSingle();
  if (!edicion) return { error: "Esa edición no existe." };

  const plantilla = await plantillaDe(admin, templateId);
  // Cambiar de plantilla vuelve a armar el correo SIN perder el contenido: los
  // bloques son datos, el layout es presentación.
  const html = renderCorreo({
    layout: plantilla?.layout ?? LAYOUT_POR_OMISION,
    asunto: edicion.subject ?? "",
    preencabezado: edicion.preheader ?? "",
    bloques: normalizarBloques(edicion.blocks),
    enlaceBaja: "{{ENLACE_BAJA}}",
  });

  await admin
    .from("newsletter_editions")
    .update({ template_id: templateId || null, html })
    .eq("id", editionId);
  revalidar();
  return { ok: true as const };
}

/* -------------------------------------------------------- la prueba ----- */

/**
 * Envío de prueba: un correo REAL a los correos configurados.
 *
 * Es una de las tres compuertas. Aprobar algo que nadie vio en su bandeja es
 * aprobar a ciegas, así que `test_sent_at` solo se marca si Resend aceptó el
 * envío — no basta con haberle dado al botón.
 */
export async function enviarPrueba(editionId: string) {
  await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const ajustes = await leerAjustesIA(admin);
  const destinos = (ajustes.boletin_correos_prueba ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (destinos.length === 0)
    return {
      error:
        "No hay correos de prueba configurados. Ponlos en Ajustes de IA → Correos para la prueba del boletín.",
    };

  const { data: edicion } = await admin
    .from("newsletter_editions")
    .select("subject, html")
    .eq("id", editionId)
    .maybeSingle();
  if (!edicion?.html)
    return { error: "Todavía no hay correo que probar: primero hay que redactarlo." };

  // En la prueba el enlace de baja no lleva a ningún lado real.
  const html = edicion.html.replace(/\{\{ENLACE_BAJA\}\}/g, "#prueba-sin-baja");

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: destinos,
      subject: `[PRUEBA] ${edicion.subject ?? "Boletín Pata Amiga"}`,
      html,
    });
    if (error) return { error: `Resend rechazó la prueba: ${error.message}` };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "No se pudo enviar la prueba.",
    };
  }

  await admin
    .from("newsletter_editions")
    .update({ test_sent_at: new Date().toISOString() })
    .eq("id", editionId);
  revalidar();
  return { ok: true as const, aviso: `Prueba enviada a ${destinos.join(", ")} ✓` };
}

/* ------------------------------------------------------ las compuertas --- */

export async function confirmarRevisionVet(editionId: string) {
  const { userId } = await requireCapability("boletin.revision_vet");
  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_editions")
    .update({ vet_reviewed_by: userId, vet_reviewed_at: new Date().toISOString() })
    .eq("id", editionId);
  if (error) return { error: "No se pudo confirmar la revisión." };
  revalidar();
  return { ok: true as const, aviso: "Revisión veterinaria confirmada ✓" };
}

export async function mandarARevision(editionId: string) {
  await requireCapability("boletin.redactar");
  const admin = createAdminClient();

  const { data: ed } = await admin
    .from("newsletter_editions")
    .select("subject, blocks, newsletter_topics!topic_id(title)")
    .eq("id", editionId)
    .maybeSingle();
  if (!ed) return { error: "Esa edición no existe." };

  await admin
    .from("newsletter_editions")
    .update({ status: "revision", review_note: null })
    .eq("id", editionId);

  const tema = Array.isArray(ed.newsletter_topics) ? ed.newsletter_topics[0] : ed.newsletter_topics;
  await notifyTeam(
    "notify_boletin_revision",
    `Boletín para revisar: ${tema?.title ?? ed.subject ?? "sin título"}`,
    `<p>Hay una edición del boletín esperando aprobación.</p>`,
  );

  revalidar();
  return { ok: true as const, aviso: "Enviada a revisión ✓" };
}

export async function aprobarEdicion(editionId: string) {
  const { userId } = await requireCapability("boletin.aprobar");
  const admin = createAdminClient();

  const { data: ed } = await admin
    .from("newsletter_editions")
    .select("subject, preheader, blocks, topic_is_health, vet_reviewed_at, test_sent_at")
    .eq("id", editionId)
    .maybeSingle();
  if (!ed) return { error: "Esa edición no existe." };

  // La terminología se revisa aquí también, con lo que se va a mandar.
  const problemas = revisarTerminologia(
    `${ed.subject ?? ""} ${ed.preheader ?? ""} ${JSON.stringify(ed.blocks ?? [])}`,
  );
  if (problemas.length > 0)
    return {
      error: `No se puede aprobar: ${problemas.map((p) => `"${p.encontrado}" → di "${p.enLugarDe}"`).join(" · ")}`,
    };

  if (ed.topic_is_health && !ed.vet_reviewed_at)
    return {
      error:
        "El tema toca salud animal: falta la revisión veterinaria antes de poder aprobarlo.",
    };

  const { error } = await admin
    .from("newsletter_editions")
    .update({
      status: "aprobada",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      review_note: null,
    })
    .eq("id", editionId);
  if (error) return { error: "No se pudo aprobar." };

  revalidar();
  return {
    ok: true as const,
    aviso: ed.test_sent_at
      ? "Aprobada ✓ — ya se puede programar"
      : "Aprobada ✓ — falta mandar la prueba antes de programar",
  };
}

export async function devolverEdicion(editionId: string, comentario: string) {
  await requireCapability("boletin.aprobar");
  if (!comentario.trim())
    return { error: "Escribe qué hay que cambiar; devolverlo sin motivo obliga a adivinar." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_editions")
    .update({
      status: "redactada",
      approved_by: null,
      approved_at: null,
      review_note: comentario.trim(),
    })
    .eq("id", editionId);
  if (error) return { error: "No se pudo devolver." };
  revalidar();
  return { ok: true as const, aviso: "Devuelta con tu comentario ✓" };
}

export async function programarEdicion(editionId: string, fechaHora: string) {
  await requireCapability("boletin.programar");
  const admin = createAdminClient();

  const cuando = new Date(fechaHora);
  if (Number.isNaN(cuando.getTime())) return { error: "Esa fecha no es válida." };
  if (cuando.getTime() < Date.now()) return { error: "Esa hora ya pasó. Elige una futura." };

  const { error } = await admin
    .from("newsletter_editions")
    .update({ status: "programada", scheduled_for: cuando.toISOString() })
    .eq("id", editionId);
  if (error)
    return {
      // Las compuertas de la base hablan por su nombre; se traduce para el equipo.
      error: error.message.includes("prueba_obligatoria")
        ? "Falta mandar la prueba: no se programa algo que nadie vio en su bandeja."
        : error.message.includes("aprobacion_obligatoria")
          ? "Falta la aprobación de un gerente."
          : error.message.includes("revision_vet")
            ? "El tema toca salud: falta la revisión veterinaria."
            : "No se pudo programar.",
    };

  revalidar();
  return { ok: true as const, aviso: `Programada para ${cuando.toLocaleString("es-MX")} ✓` };
}

export async function cancelarProgramada(editionId: string) {
  await requireCapability("boletin.programar");
  const admin = createAdminClient();
  await admin
    .from("newsletter_editions")
    .update({ status: "aprobada", scheduled_for: null })
    .eq("id", editionId);
  revalidar();
  return { ok: true as const, aviso: "Cancelada: sigue aprobada, sin hora ✓" };
}

/* --------------------------------------------------------- plantillas ---- */

export async function guardarPlantilla(input: {
  id?: string;
  nombre: string;
  descripcion?: string;
  layout: string;
  ejemplo?: string;
  porOmision: boolean;
}) {
  await requireCapability("boletin.plantillas");
  if (!input.nombre.trim()) return { error: "Ponle nombre a la plantilla." };
  if (!input.layout.includes("{{bloques}}"))
    return {
      error:
        "El layout necesita {{bloques}}: es donde la plataforma mete el contenido.",
    };

  const admin = createAdminClient();
  const fila = {
    name: input.nombre.trim(),
    description: input.descripcion?.trim() || null,
    layout: input.layout,
    sample: input.ejemplo?.trim() || null,
    is_default: input.porOmision,
  };

  // Una sola por omisión: dos "vigentes" no dicen nada.
  if (input.porOmision)
    await admin.from("newsletter_templates").update({ is_default: false }).neq("id", input.id ?? "00000000-0000-0000-0000-000000000000");

  const { error } = input.id
    ? await admin.from("newsletter_templates").update(fila).eq("id", input.id)
    : await admin.from("newsletter_templates").insert(fila);
  if (error) return { error: "No se pudo guardar la plantilla." };

  revalidar();
  return { ok: true as const };
}

/** El layout de arranque, para que la primera plantilla no se escriba en blanco. */
export async function layoutDeArranque() {
  await requireCapability("boletin.plantillas");
  return { ok: true as const, layout: LAYOUT_POR_OMISION };
}
