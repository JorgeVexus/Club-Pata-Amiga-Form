import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseMetaWebhook,
  sendChannelMessage,
  verifyMetaSignature,
  type IncomingMessage,
} from "@/lib/channels/meta";
import { getLLMProvider, type AgentTool, type ChatMessage } from "@/lib/llm";
import { buildSalesSystemPrompt } from "@/lib/llm/sales-prompt";
import { fetchActivePromosText } from "@/lib/llm/promos";
import { notifyTeam, reportError } from "@/lib/alerts";
import { resolveContact } from "@/lib/crm/contacts";
import { splitFullName } from "@/lib/crm/normalize";
import { emitEvent } from "@/lib/crm/events";
import { ensureOpportunity } from "@/lib/crm/opportunities";

const HISTORY_LIMIT = 20;

/**
 * Herramienta con la que el agente de ventas mantiene el pipeline al día:
 * clasifica la etapa de la conversación y/o la marca para atención humana.
 */
const CLASSIFY_TOOL: AgentTool = {
  name: "clasificar_conversacion",
  description:
    "Actualiza la etapa del pipeline de ventas de esta conversación y/o la marca para que el equipo humano la atienda. Úsala en silencio cuando detectes un cambio claro; no la anuncies al contacto.",
  input_schema: {
    type: "object",
    properties: {
      etapa: {
        type: "string",
        enum: ["nuevo", "interesado", "convertido", "descartado", "soporte"],
        description:
          "interesado = pregunta precios/planes/cómo unirse · convertido = confirma que ya se registró o pagó · descartado = dice que no le interesa · soporte = miembro existente con tema de cuenta (no venta)",
      },
      necesita_atencion: {
        type: "boolean",
        description:
          "true si está molesto, pide un humano, menciona abogados/PROFECO o no puedes resolver su tema",
      },
    },
    additionalProperties: false,
  },
};

/**
 * Red de seguridad independiente de la IA: si el texto entrante trae señales
 * de molestia, petición de humano o amenaza legal, se marca la conversación
 * aunque el modelo no use su herramienta (o estemos en modo demo).
 */
const ESCALATION_SIGNALS =
  /\b(humano|persona real|asesor|alguien real|queja|molest\w*|enoja\w*|p[eé]simo|fraude|estafa|abogad\w*|demanda\w*|profeco|condusef)\b/i;

/**
 * Webhook de Meta para Messenger, Instagram DM y WhatsApp — el agente de
 * ventas responde en automático y todo queda en /admin/conversaciones.
 *
 * CONECTAR: en developers.facebook.com, el coder registra este endpoint
 * (https://<dominio>/api/canales/meta/webhook) como Callback URL del webhook
 * de la app, con el token de verificación META_VERIFY_TOKEN y suscripciones a
 * "messages" (Página, Instagram y WhatsApp). Ver docs/AGENTES-IA.md.
 */

/** Alta del webhook: Meta manda un reto que hay que devolver tal cual. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Token de verificación incorrecto", { status: 403 });
}

/** Mensajes entrantes. Siempre respondemos 200 rápido para que Meta no reintente de más. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("Firma inválida", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const incoming = parseMetaWebhook(body);
  // Procesar en serie (suelen ser 1-2 mensajes por webhook)
  for (const msg of incoming) {
    try {
      await handleIncoming(msg);
    } catch (e) {
      await reportError("canales-webhook", e, { channel: msg.channel });
    }
  }

  return NextResponse.json({ received: true });
}

/** El canal de Meta → el tipo de identidad con que se guarda en el CRM. */
const IDENTIDAD_POR_CANAL: Record<string, "instagram" | "messenger" | "whatsapp"> = {
  instagram: "instagram",
  facebook: "messenger",
  messenger: "messenger",
  whatsapp: "whatsapp",
};

/**
 * Liga la conversación con su contacto del CRM (creándolo si hace falta) y le
 * abre su oportunidad en "Nuevo prospecto".
 *
 * Nunca lanza: si el CRM falla, la conversación y la respuesta de la IA siguen
 * su curso. Perder una respuesta a un cliente por un problema de bitácora sería
 * peor que perder la bitácora.
 */
async function vincularContactoDeConversacion(
  admin: ReturnType<typeof createAdminClient>,
  datos: {
    conversationId: string;
    channel: string;
    externalUserId: string;
    displayName: string | null;
    texto: string;
  },
) {
  try {
    const kind = IDENTIDAD_POR_CANAL[datos.channel];
    if (!kind) return;

    const { firstName, lastName } = splitFullName(datos.displayName);
    const { contactId } = await resolveContact(admin, {
      identities: { [kind]: datos.externalUserId },
      firstName,
      lastName,
      source: datos.channel,
      contactType: "lead",
      actorLabel: "Mensaje entrante",
    });

    await admin
      .from("channel_conversations")
      .update({ contact_id: contactId })
      .eq("id", datos.conversationId);

    await emitEvent(admin, {
      contactId,
      kind: "primer_mensaje",
      summary: `Primer mensaje por ${datos.channel}: "${datos.texto.slice(0, 120)}"`,
      payload: { conversationId: datos.conversationId },
      actorLabel: "Mensaje entrante",
    });

    await ensureOpportunity(admin, {
      contactId,
      stageKey: "nuevo_prospecto",
      source: datos.channel,
      actorLabel: "Mensaje entrante",
    });
  } catch (err) {
    console.error("[crm] no se pudo ligar la conversación con el contacto", err);
  }
}

/** Guarda el mensaje, y si la IA no está pausada en esa conversación, responde. */
async function handleIncoming(msg: IncomingMessage) {
  const admin = createAdminClient();

  // Conversación por (canal, id externo) — se crea al primer mensaje
  const { data: conv, error } = await admin
    .from("channel_conversations")
    .upsert(
      {
        channel: msg.channel,
        external_user_id: msg.externalUserId,
        ...(msg.displayName ? { display_name: msg.displayName } : {}),
        last_message_at: new Date().toISOString(),
        status: "open",
      },
      { onConflict: "channel,external_user_id" },
    )
    .select("id, human_takeover, display_name, needs_attention, contact_id")
    .single();
  if (error || !conv) throw error ?? new Error("No se pudo crear la conversación");

  // Guardar el mensaje entrante (dedupe: Meta reintenta webhooks)
  const { error: msgError } = await admin.from("channel_messages").insert({
    conversation_id: conv.id,
    direction: "in",
    sender: "contact",
    content: msg.text,
    external_message_id: msg.externalMessageId,
  });
  if (msgError) {
    if (msgError.code === "23505") return; // duplicado: ya procesado
    throw msgError;
  }

  // CRM: al primer mensaje la persona entra como contacto y como oportunidad en
  // "Nuevo prospecto". Se hace después del dedupe para que los reintentos de
  // Meta no generen actividad repetida.
  if (!conv.contact_id) {
    await vincularContactoDeConversacion(admin, {
      conversationId: conv.id,
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      displayName: conv.display_name ?? msg.displayName ?? null,
      texto: msg.text,
    });
  }

  // Red de seguridad: señales de molestia/humano/legal marcan la conversación
  // y avisan al equipo (una sola vez), responda la IA o no
  if (!conv.needs_attention && ESCALATION_SIGNALS.test(msg.text)) {
    await flagForAttention(admin, conv.id, msg, "señales en el mensaje");
  }

  // IA pausada por el equipo → solo guardar; el humano responde desde la bandeja
  if (conv.human_takeover) return;

  // Historial reciente para dar contexto al agente
  const { data: historyRows } = await admin
    .from("channel_messages")
    .select("direction, content")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const history: ChatMessage[] = (historyRows ?? [])
    .reverse()
    .map((m) => ({
      role: m.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  const [{ data: extraRow }, promosText] = await Promise.all([
    admin.from("site_settings").select("value").eq("key", "sales_extra_prompt").maybeSingle(),
    fetchActivePromosText("sales"),
  ]);

  const reply = await getLLMProvider().completeWithTools({
    messages: history,
    system: buildSalesSystemPrompt({
      contactName: conv.display_name ?? msg.displayName,
      extraPrompt: [extraRow?.value, promosText].filter(Boolean).join("\n\n") || undefined,
    }),
    tools: [CLASSIFY_TOOL],
    executeTool: async (name, input) => {
      if (name !== "clasificar_conversacion") return "Herramienta desconocida";
      const etapa = typeof input.etapa === "string" ? input.etapa : null;
      if (etapa && ["nuevo", "interesado", "convertido", "descartado", "soporte"].includes(etapa)) {
        await admin.from("channel_conversations").update({ pipeline_stage: etapa }).eq("id", conv.id);
      }
      if (input.necesita_atencion === true && !conv.needs_attention) {
        await flagForAttention(admin, conv.id, msg, "clasificación del agente IA");
      }
      return "Conversación clasificada";
    },
    maxTokens: 512, // chat de redes: respuestas cortas
  });

  await admin.from("channel_messages").insert({
    conversation_id: conv.id,
    direction: "out",
    sender: "ai",
    content: reply,
  });
  await admin
    .from("channel_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conv.id);

  // Enviar por el canal — si el conector no está configurado (dev), el
  // mensaje igual queda en la bandeja para revisión
  await sendChannelMessage(msg.channel, msg.externalUserId, reply);
}

/** Marca la conversación para atención humana y avisa al equipo por correo. */
async function flagForAttention(
  admin: ReturnType<typeof createAdminClient>,
  conversationId: string,
  msg: IncomingMessage,
  reason: string,
) {
  await admin
    .from("channel_conversations")
    .update({ needs_attention: true })
    .eq("id", conversationId);
  // Destinatarios configurables en /admin/sitio → Notificaciones
  await notifyTeam(
    "notify_channel_attention",
    `Conversación de ${msg.channel} necesita atención`,
    `<p>Una conversación en <b>${msg.channel}</b>${msg.displayName ? ` con <b>${msg.displayName}</b>` : ""} fue marcada para atención del equipo (${reason}).</p>
     <p>Último mensaje: «${msg.text.slice(0, 200)}»</p>
     <p>Revísala en el panel: <b>Conversaciones</b>.</p>`,
  );
}
