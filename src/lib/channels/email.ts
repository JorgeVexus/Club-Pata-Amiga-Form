import type { createAdminClient } from "@/lib/supabase/admin";
import { resolveContact } from "@/lib/crm/contacts";
import { emitEvent } from "@/lib/crm/events";
import { ensureOpportunity } from "@/lib/crm/opportunities";
import { normalizeEmail, splitFullName } from "@/lib/crm/normalize";
import { uno } from "@/lib/crm/embed";
import { getResend, EMAIL_FROM } from "@/lib/resend";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Correo como canal de la bandeja.
 *
 * CONECTAR: el buzón de dominio (p. ej. hola@pataamiga.mx) apunta su webhook de
 * entrada a /api/canales/email/webhook. El proveedor y el subdominio los decide
 * el cliente (ver docs/portal-ventas/02-CONVERSACIONES.md, punto 11); mientras no
 * existan, todo esto funciona con cargas de prueba y la bandeja lo indica.
 */

/** Dominio con el que firmamos nuestros Message-ID. */
function dominioPropio(): string {
  const from = EMAIL_FROM.match(/<([^>]+)>/)?.[1] ?? EMAIL_FROM;
  return from.split("@")[1] ?? "pataamiga.mx";
}

/**
 * Genera el Message-ID de un correo que sale de la plataforma.
 *
 * Lo generamos NOSOTROS (en lugar de dejárselo al proveedor) porque es la llave
 * con la que la respuesta del cliente vuelve a enganchar en su hilo.
 */
export function generarMessageId(): string {
  return `<${crypto.randomUUID()}@${dominioPropio()}>`;
}

/** Quita Re:, RE:, Fwd:, RV: … para comparar asuntos entre respuestas. */
export function normalizarAsunto(asunto: string | null | undefined): string {
  if (!asunto) return "";
  return asunto
    .replace(/^\s*((re|rv|fwd|fw|ref)\s*(\[\d+\])?\s*:\s*)+/gi, "")
    .trim()
    .toLowerCase();
}

/** Los encabezados llegan como "<a@b>, <c@d>" o como arreglo. */
export function parsearReferencias(valor: string | string[] | null | undefined): string[] {
  if (!valor) return [];
  const texto = Array.isArray(valor) ? valor.join(" ") : valor;
  return [...texto.matchAll(/<[^<>\s]+>/g)].map((m) => m[0]);
}

/** Extrae la dirección de un "Nombre <correo@dominio>". */
export function direccionDe(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const conAngulos = valor.match(/<([^>]+)>/)?.[1];
  return normalizeEmail(conAngulos ?? valor);
}

export function nombreDe(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const antes = valor.split("<")[0].trim().replace(/^"|"$/g, "");
  return antes.length > 0 && !antes.includes("@") ? antes : null;
}

export type CorreoEntrante = {
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  from: string;
  to: string[];
  subject: string | null;
  texto: string;
};

export type ResultadoHilo = {
  conversationId: string;
  contactId: string | null;
  /** Cómo se enganchó — se registra para poder auditar el criterio. */
  via: "encabezados" | "asunto_y_remitente" | "hilo_nuevo";
  nuevo: boolean;
};

/** Ventana para enganchar por asunto cuando no hay cadena de encabezados. */
const DIAS_ASUNTO = 30;

/**
 * Decide a qué hilo pertenece un correo entrante.
 *
 * Orden (punto 5.2 de la spec):
 *   1. In-Reply-To / References apuntando a un Message-ID que ya tenemos.
 *      Es exacto y NO depende de quién escribió primero.
 *   2. Identidad del remitente + asunto normalizado dentro de 30 días.
 *   3. Hilo nuevo (creando contacto y oportunidad si la persona es desconocida).
 */
export async function resolverHiloDeCorreo(
  admin: Admin,
  correo: CorreoEntrante,
): Promise<ResultadoHilo> {
  // 1. Cadena de encabezados
  const cadena = [
    ...(correo.inReplyTo ? [correo.inReplyTo] : []),
    ...correo.references,
  ];
  if (cadena.length > 0) {
    const { data } = await admin
      .from("channel_messages")
      .select("conversation_id, channel_conversations(contact_id)")
      .in("message_id", cadena)
      .limit(1)
      .maybeSingle();
    if (data?.conversation_id) {
      const conv = uno(data.channel_conversations);
      return {
        conversationId: data.conversation_id,
        contactId: conv?.contact_id ?? null,
        via: "encabezados",
        nuevo: false,
      };
    }
  }

  const remitente = direccionDe(correo.from);
  if (!remitente) throw new Error("El correo no trae remitente utilizable");

  // 2. Mismo remitente y mismo asunto, hace poco
  const asunto = normalizarAsunto(correo.subject);
  if (asunto) {
    const desde = new Date(Date.now() - DIAS_ASUNTO * 86_400_000).toISOString();
    const { data: candidatos } = await admin
      .from("channel_conversations")
      .select("id, subject, contact_id")
      .eq("channel", "email")
      .eq("external_user_id", remitente)
      .gte("last_message_at", desde)
      .order("last_message_at", { ascending: false })
      .limit(20);
    const igual = (candidatos ?? []).find(
      (c) => normalizarAsunto(c.subject) === asunto,
    );
    if (igual)
      return {
        conversationId: igual.id,
        contactId: igual.contact_id,
        via: "asunto_y_remitente",
        nuevo: false,
      };
  }

  // 3. Hilo nuevo. Si la persona no existe en el CRM, se crea igual que un DM:
  //    un correo del cliente vale exactamente lo mismo que un mensaje de redes.
  const { firstName, lastName } = splitFullName(nombreDe(correo.from));
  const { contactId } = await resolveContact(admin, {
    identities: { email: remitente },
    firstName,
    lastName,
    source: "correo",
    contactType: "lead",
    actorLabel: "Correo entrante",
  });

  const { data: creada, error } = await admin
    .from("channel_conversations")
    .insert({
      channel: "email",
      external_user_id: remitente,
      display_name:
        nombreDe(correo.from) ?? remitente.split("@")[0] ?? "Correo",
      subject: correo.subject,
      contact_id: contactId,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !creada)
    throw new Error(`No se pudo abrir el hilo de correo: ${error?.message}`);

  await ensureOpportunity(admin, {
    contactId,
    stageKey: "nuevo_prospecto",
    source: "correo",
    actorLabel: "Correo entrante",
  });

  return {
    conversationId: creada.id,
    contactId,
    via: "hilo_nuevo",
    nuevo: true,
  };
}

/**
 * Guarda un correo entrante en su hilo. Idempotente por Message-ID: si el
 * proveedor reintenta la entrega, no se duplica el mensaje.
 */
export async function guardarCorreoEntrante(
  admin: Admin,
  correo: CorreoEntrante,
): Promise<{ ok: true; hilo: ResultadoHilo } | { ok: false; motivo: string }> {
  if (correo.messageId) {
    const { data: yaEsta } = await admin
      .from("channel_messages")
      .select("id")
      .eq("message_id", correo.messageId)
      .maybeSingle();
    if (yaEsta) return { ok: false, motivo: "duplicado" };
  }

  const hilo = await resolverHiloDeCorreo(admin, correo);

  const { error } = await admin.from("channel_messages").insert({
    conversation_id: hilo.conversationId,
    direction: "in",
    sender: "contact",
    content: correo.texto,
    message_id: correo.messageId,
    in_reply_to: correo.inReplyTo,
    email_references: correo.references,
    from_address: direccionDe(correo.from),
    to_addresses: correo.to.map((t) => direccionDe(t)).filter((t): t is string => !!t),
  });
  if (error) {
    if (error.code === "23505") return { ok: false, motivo: "duplicado" };
    throw error;
  }

  // El asunto del hilo es el ORIGINAL y no se reemplaza con el de cada
  // respuesta: si una respuesta cambia de asunto (pasa seguido) y lo
  // sobrescribiéramos, el enganche por asunto del punto 2 dejaría de encontrar
  // los siguientes correos de esa misma conversación.
  const { data: hiloActual } = await admin
    .from("channel_conversations")
    .select("subject")
    .eq("id", hilo.conversationId)
    .maybeSingle();

  await admin
    .from("channel_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      status: "open",
      ...(correo.subject && !hiloActual?.subject
        ? { subject: correo.subject }
        : {}),
    })
    .eq("id", hilo.conversationId);

  if (hilo.contactId)
    await emitEvent(admin, {
      contactId: hilo.contactId,
      kind: hilo.nuevo ? "primer_mensaje" : "mensaje_recibido",
      summary: `Correo${correo.subject ? ` "${correo.subject}"` : ""}: ${correo.texto.slice(0, 120)}`,
      payload: { conversationId: hilo.conversationId, via: hilo.via },
      actorLabel: "Correo entrante",
    });

  return { ok: true, hilo };
}

/**
 * Responde por correo dentro de un hilo, con los encabezados que hacen que la
 * respuesta del cliente vuelva a caer en el mismo lugar.
 */
export async function enviarCorreo(
  admin: Admin,
  input: {
    conversationId: string;
    texto: string;
    /** Se usa el asunto del hilo si no se pasa otro. */
    asunto?: string | null;
  },
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const { data: hilo } = await admin
    .from("channel_conversations")
    .select("id, external_user_id, subject")
    .eq("id", input.conversationId)
    .maybeSingle();
  if (!hilo) return { ok: false, error: "El hilo no existe" };

  // Último mensaje con Message-ID: es el ancla de la cadena.
  const { data: ancla } = await admin
    .from("channel_messages")
    .select("message_id, email_references")
    .eq("conversation_id", input.conversationId)
    .not("message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const messageId = generarMessageId();
  const referencias = [
    ...(ancla?.email_references ?? []),
    ...(ancla?.message_id ? [ancla.message_id] : []),
  ].slice(-10); // los clientes de correo no necesitan la cadena completa

  const asunto = input.asunto ?? hilo.subject ?? "Pata Amiga";
  const asuntoRespuesta = /^\s*re\s*:/i.test(asunto) ? asunto : `Re: ${asunto}`;

  try {
    await getResend().emails.send({
      from: EMAIL_FROM,
      to: [hilo.external_user_id],
      subject: asuntoRespuesta,
      text: input.texto,
      headers: {
        "Message-ID": messageId,
        ...(ancla?.message_id ? { "In-Reply-To": ancla.message_id } : {}),
        ...(referencias.length > 0 ? { References: referencias.join(" ") } : {}),
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo enviar el correo",
    };
  }

  return { ok: true, messageId };
}
