import { createAdminClient } from "@/lib/supabase/admin";
import { ASSISTANT_PROMPT_KEY, SALES_PROMPT_KEY } from "@/lib/site";
import { updateSiteSettings } from "@/app/admin/actions";
import { formatDateEs } from "@/lib/dates";
import { hoyEnMexico } from "@/lib/zona-horaria";
import { InboxClient, type Conversation } from "./InboxClient";
import { createPromo, deletePromo, togglePromo } from "./actions";

const AUDIENCE_LABELS: Record<string, string> = {
  both: "Ambos agentes",
  support: "Asistente del portal",
  sales: "Ventas (redes)",
};

/**
 * Bandeja de conversaciones de canales sociales (Messenger, Instagram DM,
 * WhatsApp) + centro de conocimiento de los agentes IA: promociones con
 * vigencia (rotan solas) e instrucciones adicionales, todo sin deploys.
 */
export default async function AdminConversacionesPage() {
  const admin = createAdminClient();

  const [{ data: conversations }, { data: assistantConvs }, { data: promos }, { data: settings }] =
    await Promise.all([
      admin
        .from("channel_conversations")
        .select(
          "id, channel, display_name, external_user_id, human_takeover, status, pipeline_stage, needs_attention, last_message_at, last_admin_read_at",
        )
        .order("last_message_at", { ascending: false })
        .limit(100),
      // Chats de miembros con el asistente del portal — supervisión (solo lectura)
      admin
        .from("assistant_conversations")
        .select("id, user_id, created_at, updated_at, profiles(first_name, email)")
        .order("updated_at", { ascending: false })
        .limit(50),
      admin
        .from("agent_promos")
        .select("id, title, content, audience, starts_on, ends_on, active")
        .order("created_at", { ascending: false }),
      admin
        .from("site_settings")
        .select("key, value")
        .in("key", [ASSISTANT_PROMPT_KEY, SALES_PROMPT_KEY]),
    ]);

  // Vista previa: último mensaje de cada conversación (una consulta, se
  // reduce en memoria — 100 conversaciones máx.)
  const ids = (conversations ?? []).map((c) => c.id);
  const previews: Record<string, string> = {};
  if (ids.length) {
    const { data: lastMessages } = await admin
      .from("channel_messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(300);
    for (const m of lastMessages ?? []) {
      if (!(m.conversation_id in previews)) {
        previews[m.conversation_id] = m.content.slice(0, 80);
      }
    }
  }

  // Último mensaje de los chats del asistente (vista previa + orden)
  const assistantIds = (assistantConvs ?? []).map((c) => c.id);
  const assistantLast: Record<string, { content: string; created_at: string }> = {};
  if (assistantIds.length) {
    const { data: lastAssistant } = await admin
      .from("assistant_messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", assistantIds)
      .order("created_at", { ascending: false })
      .limit(200);
    for (const m of lastAssistant ?? []) {
      if (!(m.conversation_id in assistantLast)) {
        assistantLast[m.conversation_id] = { content: m.content, created_at: m.created_at };
      }
    }
  }

  const initial: Conversation[] = [
    ...(conversations ?? []).map((c) => ({
      ...c,
      kind: "social" as const,
      channel: c.channel as Conversation["channel"],
      preview: previews[c.id] ?? null,
    })),
    ...(assistantConvs ?? []).map((c) => {
      // El embed de profiles llega como objeto (FK única user_id → profiles)
      const profile = c.profiles as unknown as { first_name: string | null; email: string | null } | null;
      return {
        id: c.id,
        kind: "portal" as const,
        channel: "portal" as const,
        display_name: profile?.first_name || profile?.email || "Miembro",
        external_user_id: c.user_id,
        human_takeover: false,
        status: "open",
        pipeline_stage: "soporte",
        needs_attention: false,
        last_message_at: assistantLast[c.id]?.created_at ?? c.created_at,
        last_admin_read_at: null,
        preview: assistantLast[c.id]?.content.slice(0, 80) ?? null,
      };
    }),
  ].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));

  const settingByKey = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  // Hoy en México: el estado que ve el admin tiene que ser el mismo que decide
  // si el agente ofrece la promo (lib/llm/promos.ts).
  const today = hoyEnMexico();
  const promoStatus = (p: { active: boolean; starts_on: string; ends_on: string | null }) =>
    !p.active
      ? { label: "Pausada", cls: "bg-cream text-ink-tertiary" }
      : p.starts_on > today
        ? { label: "Programada", cls: "bg-orange/15 text-orange" }
        : p.ends_on && p.ends_on < today
          ? { label: "Expirada", cls: "bg-cream text-ink-tertiary" }
          : { label: "Vigente", cls: "bg-teal/10 text-teal" };

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] text-ink-title">Conversaciones</h1>
        <p className="max-w-[640px] text-sm text-ink-secondary">
          Mensajes de Messenger, Instagram y WhatsApp. El agente IA responde en
          automático; toma cualquier conversación para responder tú y devuélvela
          a la IA cuando termines.
        </p>
      </div>
      <InboxClient initial={initial} />

      {/* ===== Centro de conocimiento de los agentes IA ===== */}
      <h2 className="mt-2 font-display text-lg text-ink-title">
        Conocimiento de los agentes IA
      </h2>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Promociones con vigencia — rotan solas */}
        <div className="flex flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-ink-title">
              Promociones y material rotativo
            </span>
            <span className="text-xs text-ink-tertiary">
              Los agentes las mencionan solo mientras están vigentes — al vencer
              la fecha, dejan de usarse solas. Sin deploys.
            </span>
          </div>

          {(promos ?? []).length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {(promos ?? []).map((p) => {
                const st = promoStatus(p);
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-1.5 rounded-[12px] border-[1.5px] border-border-divider p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-ink-title">
                          {p.title}
                        </span>
                        <span
                          className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </span>
                      <span className="flex flex-none gap-1.5">
                        <form action={togglePromo.bind(null, p.id, !p.active)}>
                          <button
                            className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-ink-secondary hover:bg-border-divider"
                            title={p.active ? "Pausar" : "Reactivar"}
                          >
                            {p.active ? "Pausar" : "Reactivar"}
                          </button>
                        </form>
                        <form action={deletePromo.bind(null, p.id)}>
                          <button
                            className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-[#D93025] hover:bg-border-divider"
                            title="Eliminar"
                          >
                            Eliminar
                          </button>
                        </form>
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary">{p.content}</p>
                    <p className="text-[11px] text-ink-tertiary">
                      {AUDIENCE_LABELS[p.audience]} · {formatDateEs(p.starts_on)}
                      {p.ends_on ? ` → ${formatDateEs(p.ends_on)}` : " → sin fecha de fin"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <form action={createPromo} className="flex flex-col gap-3 border-t border-border-divider pt-4">
            <span className="text-[13px] font-semibold text-ink-title">Nueva promoción</span>
            <input
              name="title"
              required
              placeholder="Título (ej. Promo julio)"
              className="h-10 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm text-ink-title outline-none focus:border-teal"
            />
            <textarea
              name="content"
              required
              rows={2}
              placeholder="Texto que el agente puede usar (ej. Primer mes gratis con el código PATAJULIO al registrarse)"
              className="rounded-[12px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-ink-title outline-none focus:border-teal"
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-tertiary">Agente</span>
                <select
                  name="audience"
                  defaultValue="both"
                  className="h-10 rounded-[12px] border-[1.5px] border-border-input px-2.5 text-sm text-ink-title outline-none focus:border-teal"
                >
                  <option value="both">Ambos</option>
                  <option value="support">Asistente del portal</option>
                  <option value="sales">Ventas (redes)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-tertiary">Desde</span>
                <input
                  type="date"
                  name="starts_on"
                  className="h-10 rounded-[12px] border-[1.5px] border-border-input px-2.5 text-sm text-ink-title outline-none focus:border-teal"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-tertiary">Hasta (opcional)</span>
                <input
                  type="date"
                  name="ends_on"
                  className="h-10 rounded-[12px] border-[1.5px] border-border-input px-2.5 text-sm text-ink-title outline-none focus:border-teal"
                />
              </label>
            </div>
            <button
              type="submit"
              className="grid h-10 place-items-center self-start rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
            >
              Agregar promoción
            </button>
          </form>
        </div>

        {/* Instrucciones adicionales permanentes (antes en Sitio web) */}
        <form
          action={updateSiteSettings}
          className="flex flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-ink-title">Instrucciones adicionales</span>
            <span className="text-xs text-ink-tertiary">
              Conocimiento permanente que se anexa a las instrucciones de cada
              agente (respuestas frecuentes, políticas, tono).
            </span>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-title">
              Asistente del portal de miembros
            </span>
            <textarea
              name={ASSISTANT_PROMPT_KEY}
              defaultValue={settingByKey[ASSISTANT_PROMPT_KEY] ?? ""}
              rows={5}
              placeholder="Ej. Si preguntan por facturación (CFDI), indícales que pueden capturar sus datos fiscales en Mi cuenta…"
              className="rounded-[12px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-ink-title outline-none focus:border-teal"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-title">
              Agente de ventas (redes sociales)
            </span>
            <textarea
              name={SALES_PROMPT_KEY}
              defaultValue={settingByKey[SALES_PROMPT_KEY] ?? ""}
              rows={5}
              placeholder="Ej. Si preguntan por descuentos, menciona el código de embajador (90 días de espera)…"
              className="rounded-[12px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-ink-title outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            className="grid h-10 place-items-center self-start rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
          >
            Guardar instrucciones
          </button>
        </form>
      </div>
    </div>
  );
}
