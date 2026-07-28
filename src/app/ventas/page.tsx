import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";

export const metadata = { title: "Resumen · Portal de ventas" };

/** Etapas de la bandeja que ya existen hoy (la Sección 1 las amplía). */
const STAGES: { key: string; label: string; color: string }[] = [
  { key: "nuevo", label: "Nuevo prospecto", color: "bg-teal" },
  { key: "interesado", label: "Interesado", color: "bg-orange" },
  { key: "convertido", label: "Convertido", color: "bg-lime" },
  { key: "descartado", label: "Descartado", color: "bg-pink" },
  { key: "soporte", label: "Soporte", color: "bg-ink-tertiary" },
];

/** Lo que llega en cada fase, para que el equipo vea el mapa sin preguntarlo. */
const ROADMAP: { phase: string; title: string; detail: string }[] = [
  {
    phase: "F1",
    title: "Contactos y pipelines",
    detail:
      "Un contacto por persona (aunque escriba por Instagram y por correo) y tablero de oportunidades que se mueve solo con los pagos y las altas.",
  },
  {
    phase: "F2",
    title: "Conversaciones",
    detail:
      "Bandeja con Meta, correo y chats del portal; asignación, notas internas y plantillas con adjuntos.",
  },
  {
    phase: "F3",
    title: "Membresías",
    detail:
      "Crear planes con beneficios y publicarlos en Stripe, sin tocar las reglas de quien ya es miembro.",
  },
  {
    phase: "F4",
    title: "Calendario de contenido",
    detail:
      "Borrador, revisión y aprobación del gerente antes de publicar en redes.",
  },
  {
    phase: "F5",
    title: "Boletín",
    detail:
      "Calendario editorial con agente de investigación y de marca, con aprobación antes del envío.",
  },
  {
    phase: "F7",
    title: "Tableros",
    detail:
      "Embudo con pesos, tiempos de respuesta, exportación y reporte por correo.",
  },
];

export default async function VentasResumenPage() {
  const session = await requirePortal("ventas");
  const admin = createAdminClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [conversationsQ, attentionQ, leadsQ, subscribersQ, byStage] =
    await Promise.all([
      admin
        .from("channel_conversations")
        .select("id", { count: "exact", head: true }),
      admin
        .from("channel_conversations")
        .select("id", { count: "exact", head: true })
        .eq("needs_attention", true),
      admin
        .from("campaign_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString()),
      admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true }),
      admin.from("channel_conversations").select("pipeline_stage"),
    ]);

  const stageCounts = new Map<string, number>();
  for (const row of byStage.data ?? []) {
    const key = (row as { pipeline_stage: string }).pipeline_stage;
    stageCounts.set(key, (stageCounts.get(key) ?? 0) + 1);
  }
  const totalStaged = byStage.data?.length ?? 0;

  const kpis = [
    {
      label: "CONVERSACIONES",
      value: (conversationsQ.count ?? 0).toLocaleString("es-MX"),
      note: "de todos los canales conectados",
    },
    {
      label: "NECESITAN ATENCIÓN",
      value: (attentionQ.count ?? 0).toLocaleString("es-MX"),
      note: "marcadas por la IA o por el equipo",
    },
    {
      label: "LEADS DEL MES",
      value: (leadsQ.count ?? 0).toLocaleString("es-MX"),
      note: "de las landings de campaña",
    },
    {
      label: "SUSCRIPTORES",
      value: (subscribersQ.count ?? 0).toLocaleString("es-MX"),
      note: "lista del boletín",
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] text-ink-title">
          Hola{session.displayName ? `, ${session.displayName}` : ""}
        </h1>
        <span className="rounded-full bg-info-bg px-4 py-2 text-[12px] font-bold text-info-text">
          Portal en construcción · fase 0 lista 🐾
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-1 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            <span className="text-[11px] font-bold tracking-[.06em] text-ink-tertiary">
              {k.label}
            </span>
            <span className="font-display text-[28px] text-ink-title">
              {k.value}
            </span>
            <span className="text-[11.5px] text-ink-secondary">{k.note}</span>
          </div>
        ))}
      </div>

      {/* Adelanto del embudo con las etapas que ya existen en la bandeja */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-bold text-ink-title">
            Conversaciones por etapa
          </h2>
          <span className="text-[11.5px] text-ink-tertiary">
            El embudo completo, con pesos, llega en la fase 1
          </span>
        </div>
        {totalStaged === 0 ? (
          <span className="py-6 text-center text-[13px] text-ink-secondary">
            Todavía no hay conversaciones registradas.
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {STAGES.map((stage) => {
              const count = stageCounts.get(stage.key) ?? 0;
              const pct = Math.round((count / totalStaged) * 100);
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="w-[132px] flex-none text-[12.5px] font-semibold text-ink-body">
                    {stage.label}
                  </span>
                  <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${stage.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-[52px] flex-none text-right text-[12.5px] font-bold text-ink-title">
                    {count.toLocaleString("es-MX")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <h2 className="text-[15px] font-bold text-ink-title">
          Qué llega en cada fase
        </h2>
        <div className="flex flex-col divide-y divide-border-divider">
          {ROADMAP.map((item) => (
            <div key={item.phase} className="flex gap-3 py-2.5">
              <span className="mt-0.5 h-fit flex-none rounded-full bg-cream px-2 py-0.5 text-[10.5px] font-extrabold text-ink-tertiary">
                {item.phase}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-bold text-ink-title">
                  {item.title}
                </span>
                <span className="text-[12.5px] leading-snug text-ink-secondary">
                  {item.detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
