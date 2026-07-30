"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { puedeProgramarse, validarContenido } from "@/lib/content/validar";
import { notifyTeam } from "@/lib/alerts";

/**
 * Calendario de contenido — el circuito de aprobación.
 *
 *   Borrador → En revisión → Aprobado → Programado → Publicado
 *
 * Las restricciones de la base ya impiden programar o publicar sin aprobación;
 * estas acciones son la puerta de entrada normal y además avisan a quien toca.
 * Ninguna confía en lo que diga la pantalla: cada una vuelve a preguntar por el
 * rol y a correr las validaciones.
 */

function revalidar() {
  revalidatePath("/ventas/calendario");
  revalidatePath("/ventas");
}

type Admin = ReturnType<typeof createAdminClient>;

/** Anota en la bitácora del post. Nunca tumba la operación que la llamó. */
async function anotar(
  admin: Admin,
  input: {
    postId: string;
    kind: string;
    summary: string;
    actorId?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  try {
    await admin.from("content_post_events").insert({
      post_id: input.postId,
      kind: input.kind,
      summary: input.summary,
      actor_id: input.actorId ?? null,
      actor_label: input.actorId ? null : "Plataforma",
      payload: input.payload ?? {},
    });
  } catch (err) {
    console.error("[calendario] no se pudo anotar en la bitácora", err);
  }
}

/** Los canales elegidos, con su plataforma, para validar y para publicar. */
async function canalesDe(admin: Admin, canalIds: string[]) {
  if (canalIds.length === 0) return [];
  const { data } = await admin
    .from("content_channels")
    .select("id, platform, handle, mode, is_active")
    .in("id", canalIds);
  return data ?? [];
}

/* ---------------------------------------------------------- redactar ------ */

export async function guardarPost(input: {
  id?: string;
  titulo: string;
  cuerpo: string;
  activos: string[];
  canalIds: string[];
  campana?: string;
}) {
  const { userId } = await requireCapability("contenido.redactar");
  if (!input.titulo.trim()) return { error: "Ponle un título para reconocerlo." };
  if (!input.cuerpo.trim()) return { error: "Falta el copy." };

  const admin = createAdminClient();

  const fila = {
    title: input.titulo.trim(),
    body: input.cuerpo,
    assets: input.activos,
    campaign: input.campana?.trim() || null,
  };

  let postId = input.id;
  if (postId) {
    // Ojo: si el post estaba aprobado, el disparador de la base lo devuelve
    // solo a revisión. No hay que hacerlo aquí — y no habría que confiar en
    // que se hiciera.
    const { error } = await admin.from("content_posts").update(fila).eq("id", postId);
    if (error) return { error: "No se pudo guardar." };
  } else {
    const { data, error } = await admin
      .from("content_posts")
      .insert({ ...fila, created_by: userId, status: "borrador" })
      .select("id")
      .single();
    if (error || !data) return { error: "No se pudo crear." };
    const nuevoId: string = data.id;
    postId = nuevoId;
    await anotar(admin, {
      postId: nuevoId,
      kind: "creado",
      summary: `Creó el borrador "${fila.title}"`,
      actorId: userId,
    });
  }

  // Los canales destino se guardan como filas pendientes; el resultado de
  // cada uno se llena al publicar.
  await admin.from("content_post_targets").delete().eq("post_id", postId);
  if (input.canalIds.length > 0)
    await admin
      .from("content_post_targets")
      .insert(input.canalIds.map((c) => ({ post_id: postId!, channel_id: c })));

  revalidar();
  return { ok: true as const, id: postId };
}

export async function enviarARevision(postId: string) {
  const { userId } = await requireCapability("contenido.redactar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("id, title, status")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };
  if (!["borrador", "revision"].includes(post.status))
    return { error: "Solo se manda a revisión un borrador." };

  await admin
    .from("content_posts")
    .update({ status: "revision", review_note: null })
    .eq("id", postId);
  await anotar(admin, {
    postId,
    kind: "enviado_a_revision",
    summary: "Lo mandó a revisión",
    actorId: userId,
  });

  // Aviso 1 de 3: al gerente le llega que hay algo esperándolo. Los
  // destinatarios se editan en /admin/sitio → Notificaciones.
  await notifyTeam(
    "notify_contenido_revision",
    `Contenido para revisar: ${post.title}`,
    `<p>Hay contenido esperando aprobación en el calendario de ventas.</p>
     <p><strong>${post.title}</strong></p>`,
  );

  revalidar();
  return { ok: true as const };
}

/* ---------------------------------------------------------- aprobar ------- */

export async function aprobarPost(postId: string) {
  // Un rol `ventas` no tiene esta capacidad, así que ni siquiera entra aquí.
  const { userId } = await requireCapability("contenido.aprobar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("id, title, body, status, created_by, assets")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };
  if (post.status !== "revision")
    return { error: "Solo se aprueba lo que está en revisión." };

  // La terminología se revisa TAMBIÉN al aprobar. Aprobar un texto con
  // "seguro" y descubrirlo al programar sería descubrirlo tarde.
  const canales = await canalesDe(
    admin,
    (
      await admin.from("content_post_targets").select("channel_id").eq("post_id", postId)
    ).data?.map((t) => t.channel_id) ?? [],
  );
  const problemas = validarContenido({
    titulo: post.title,
    texto: post.body,
    activos: (post.assets as string[]) ?? [],
    plataformas: canales.map((c) => c.platform),
  });
  const terminologia = problemas.filter((p) => p.clase === "terminologia");
  if (terminologia.length > 0)
    return {
      error: `No se puede aprobar: ${terminologia.map((p) => p.mensaje).join(" ")}`,
    };

  const ahora = new Date().toISOString();
  const { error } = await admin
    .from("content_posts")
    .update({
      status: "aprobado",
      approved_by: userId,
      approved_at: ahora,
      review_note: null,
    })
    .eq("id", postId);
  if (error) return { error: "No se pudo aprobar." };

  const propio = post.created_by === userId;
  await anotar(admin, {
    postId,
    kind: "aprobado",
    summary: propio
      ? "Aprobó su propio contenido (el equipo es chico; queda constancia)"
      : "Aprobó el contenido",
    actorId: userId,
    payload: { autoaprobado: propio },
  });

  revalidar();
  return { ok: true as const };
}

/** Devolver exige comentario: "no" sin motivo obliga a adivinar. */
export async function devolverPost(postId: string, comentario: string) {
  const { userId } = await requireCapability("contenido.aprobar");
  if (!comentario.trim())
    return { error: "Escribe qué hay que cambiar; devolverlo sin motivo obliga a adivinar." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_posts")
    .update({
      status: "borrador",
      approved_by: null,
      approved_at: null,
      review_note: comentario.trim(),
    })
    .eq("id", postId);
  if (error) return { error: "No se pudo devolver." };

  await anotar(admin, {
    postId,
    kind: "devuelto",
    summary: `Lo devolvió: ${comentario.trim()}`,
    actorId: userId,
  });

  revalidar();
  return { ok: true as const };
}

/* --------------------------------------------------------- programar ------ */

export async function programarPost(input: {
  postId: string;
  fechaHora: string;
  /** Clases de validación que un super admin decide saltar, con constancia. */
  saltar?: string[];
}) {
  const { userId, role } = await requireCapability("contenido.redactar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("id, title, body, assets, status, approved_by")
    .eq("id", input.postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };
  if (!post.approved_by)
    return { error: "Sin aprobación no se programa. Mándalo a revisión primero." };

  const cuando = new Date(input.fechaHora);
  if (Number.isNaN(cuando.getTime())) return { error: "Esa fecha no es válida." };
  if (cuando.getTime() < Date.now())
    return { error: "Esa hora ya pasó. Elige una futura." };

  const { data: destinos } = await admin
    .from("content_post_targets")
    .select("channel_id")
    .eq("post_id", input.postId);
  const canales = await canalesDe(admin, (destinos ?? []).map((d) => d.channel_id));
  if (canales.length === 0)
    return { error: "Elige al menos un canal donde publicarlo." };

  const problemas = validarContenido({
    titulo: post.title,
    texto: post.body,
    activos: (post.assets as string[]) ?? [],
    plataformas: canales.map((c) => c.platform),
  });

  // Saltar solo lo saltable, y solo si el rol puede. La terminología se ignora
  // en esta lista aunque venga: `puedeProgramarse` no la perdona.
  const saltar =
    role === "super_admin" ? (input.saltar ?? []).filter((c) => c !== "terminologia") : [];
  const { ok, pendientes } = puedeProgramarse(problemas, saltar);
  if (!ok)
    return {
      error: pendientes.map((p) => p.mensaje).join(" · "),
      problemas: pendientes,
    };

  const { error } = await admin
    .from("content_posts")
    .update({
      status: "programado",
      scheduled_for: cuando.toISOString(),
      prenotified_at: null,
      ...(saltar.length > 0
        ? { overrides: { saltadas: saltar, por: userId, cuando: new Date().toISOString() } }
        : {}),
    })
    .eq("id", input.postId);
  if (error) return { error: "No se pudo programar." };

  await anotar(admin, {
    postId: input.postId,
    kind: "programado",
    summary: `Lo programó para ${cuando.toLocaleString("es-MX")}`,
    actorId: userId,
    payload: { saltadas: saltar },
  });

  revalidar();
  return { ok: true as const };
}

export async function cancelarProgramado(postId: string, motivo: string) {
  const { userId } = await requireCapability("contenido.redactar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("status")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };
  if (post.status !== "programado")
    return { error: "Solo se cancela algo programado." };

  // Vuelve a 'aprobado': sigue estando aprobado, solo dejó de tener hora.
  const { error } = await admin
    .from("content_posts")
    .update({ status: "aprobado", scheduled_for: null })
    .eq("id", postId);
  if (error) return { error: "No se pudo cancelar." };

  await anotar(admin, {
    postId,
    kind: "cancelado",
    summary: motivo.trim() ? `Canceló la publicación: ${motivo.trim()}` : "Canceló la publicación",
    actorId: userId,
  });

  revalidar();
  return { ok: true as const };
}

export async function duplicarPost(postId: string) {
  const { userId } = await requireCapability("contenido.redactar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("title, body, assets, campaign")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };

  // La copia nace en borrador y SIN aprobación: adaptar un copy a otra red es
  // contenido nuevo, y tiene que pasar por su propia revisión.
  const { data, error } = await admin
    .from("content_posts")
    .insert({
      title: `${post.title} (copia)`,
      body: post.body,
      assets: post.assets,
      campaign: post.campaign,
      status: "borrador",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se pudo duplicar." };

  await anotar(admin, {
    postId: data.id,
    kind: "duplicado",
    summary: "Nació como copia de otro contenido",
    actorId: userId,
  });

  revalidar();
  return { ok: true as const, id: data.id };
}

export async function borrarBorrador(postId: string) {
  const { userId } = await requireCapability("contenido.redactar");
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("content_posts")
    .select("status")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Ese contenido no existe." };
  if (!["borrador", "cancelado"].includes(post.status))
    return {
      error: "Solo se borran borradores. Lo demás queda como historia del calendario.",
    };

  await admin.from("content_posts").delete().eq("id", postId);
  console.info(`[calendario] ${userId} borró el borrador ${postId}`);
  revalidar();
  return { ok: true as const };
}

/* ----------------------------------------------------- modo asistido ------ */

/**
 * Cierra un canal asistido: la persona ya publicó y pega el enlace.
 *
 * Cuando ese era el último destino pendiente, el post pasa a 'publicado'. El
 * calendario queda completo aunque la publicación la haya hecho una persona —
 * que es exactamente la diferencia entre "no lo tenemos" y "lo tenemos con una
 * persona en medio".
 */
export async function marcarAsistidoPublicado(input: {
  postId: string;
  canalId: string;
  url: string;
}) {
  const { userId } = await requireCapability("contenido.redactar");
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url))
    return { error: "Pega el enlace de la publicación (empieza con http)." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_post_targets")
    .update({
      status: "publicado",
      external_url: url,
      published_at: new Date().toISOString(),
      error: null,
    })
    .eq("post_id", input.postId)
    .eq("channel_id", input.canalId);
  if (error) return { error: "No se pudo marcar." };

  await anotar(admin, {
    postId: input.postId,
    kind: "publicado_canal",
    summary: "Marcó el canal asistido como publicado",
    actorId: userId,
    payload: { url },
  });

  // ¿Ya salieron todos? Entonces el post terminó.
  const { data: destinos } = await admin
    .from("content_post_targets")
    .select("status")
    .eq("post_id", input.postId);
  if ((destinos ?? []).every((d) => d.status === "publicado")) {
    await admin.from("content_posts").update({ status: "publicado" }).eq("id", input.postId);
    await anotar(admin, {
      postId: input.postId,
      kind: "publicado",
      summary: "Salió en todos sus canales",
    });
  }

  revalidar();
  return { ok: true as const };
}

/* ----------------------------------------------------------- canales ------ */

export async function guardarCanal(input: {
  id?: string;
  plataforma: string;
  handle: string;
  nombre?: string;
  modo: "automatico" | "asistido";
  responsableId?: string;
}) {
  await requireCapability("canales.administrar");
  const admin = createAdminClient();

  const fila = {
    platform: input.plataforma,
    handle: input.handle.trim().replace(/^@/, ""),
    display_name: input.nombre?.trim() || null,
    mode: input.modo,
    assignee_id: input.responsableId || null,
  };
  if (!fila.handle) return { error: "Falta el nombre de la cuenta." };

  const { error } = input.id
    ? await admin.from("content_channels").update(fila).eq("id", input.id)
    : await admin.from("content_channels").insert(fila);
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Esa cuenta ya está conectada."
          : "No se pudo guardar la cuenta.",
    };

  revalidar();
  return { ok: true as const };
}

export async function activarCanal(id: string, activo: boolean) {
  await requireCapability("canales.administrar");
  const admin = createAdminClient();
  await admin.from("content_channels").update({ is_active: activo }).eq("id", id);
  revalidar();
  return { ok: true as const };
}

/* ------------------------------------------------------------ activos ----- */

export async function subirActivo(formData: FormData) {
  await requireCapability("contenido.redactar");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona un archivo." };
  if (file.size > 50 * 1024 * 1024) return { error: "Máximo 50 MB." };

  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  // Bucket compartido con el resto del sitio, en su propia carpeta para no
  // mezclarse con los slots que edita el admin. El nombre lleva el original
  // saneado para que el equipo reconozca el archivo en Storage.
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .slice(0, 40)
    .toLowerCase();
  const path = `contenido/${Date.now()}-${base || "activo"}.${ext}`;

  const { error } = await admin.storage
    .from("site-assets")
    .upload(path, file, { contentType: file.type });
  if (error) return { error: "No se pudo subir el archivo." };

  const {
    data: { publicUrl },
  } = admin.storage.from("site-assets").getPublicUrl(path);
  return { ok: true as const, url: publicUrl };
}
