import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { uno } from "@/lib/crm/embed";
import { AJUSTES_IA, gastoDelDia, leerAjustesIA } from "@/lib/llm/gobierno";
import { haceDias } from "@/lib/dates";
import {
  PanelIA,
  type AjusteEditable,
  type VotoRevision,
} from "@/components/panel/bandeja/PanelIA";

export const metadata = { title: "Agentes IA · Portal de ventas" };

export default async function PanelAgentesPage() {
  const session = await requirePortal("ventas");
  const admin = createAdminClient();

  const [ajustesActuales, gastoHoy, { data: equipoCat }] = await Promise.all([
    leerAjustesIA(admin),
    gastoDelDia(admin),
    admin
      .from("profiles")
      .select("id, first_name, email, role")
      .in("role", ["ventas", "gerente_ventas", "admin", "super_admin"])
      .order("first_name"),
  ]);

  const equipo = (equipoCat ?? []).map((m) => ({
    id: m.id,
    nombre: m.first_name || m.email?.split("@")[0] || "Equipo",
  }));

  const esSuper = session.role === "super_admin";
  const ajustes: AjusteEditable[] = AJUSTES_IA.map((a) => ({
    key: a.key,
    label: a.label,
    hint: a.hint,
    valor: ajustesActuales[a.key] ?? "",
    bloqueado: a.soloSuper && !esSuper,
  }));

  // Consumo del día y de la semana
  const semana = haceDias(7);
  const [{ data: usoSemana }, { data: escalaciones }] = await Promise.all([
    admin.from("ai_usage").select("agent, cost_cents, created_at").gte("created_at", semana),
    admin
      .from("channel_conversations")
      .select("id, channel, attention_reason, attention_at, assigned_to")
      .eq("needs_attention", true)
      .eq("status", "open")
      .order("attention_at", { ascending: true })
      .limit(20),
  ]);

  const gastoSemana =
    (usoSemana ?? []).reduce((s, u) => s + (u.cost_cents ?? 0), 0) / 100;
  const respuestasSemana = (usoSemana ?? []).length;

  // Votos: se agrupan por mensaje y se ordenan por los peor calificados
  const { data: votos } = await admin
    .from("message_feedback")
    .select(
      "message_id, value, note, channel_messages(content, created_at, conversation_id, channel_conversations(channel))",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const porMensaje = new Map<string, VotoRevision>();
  for (const v of votos ?? []) {
    const msg = uno(v.channel_messages);
    if (!msg) continue;
    const actual = porMensaje.get(v.message_id) ?? {
      messageId: v.message_id,
      conversationId: msg.conversation_id,
      canal: uno(msg.channel_conversations)?.channel ?? "—",
      texto: msg.content,
      cuando: msg.created_at,
      positivos: 0,
      negativos: 0,
      notas: [] as string[],
    };
    if (v.value === 1) actual.positivos += 1;
    else actual.negativos += 1;
    if (v.note) actual.notas.push(v.note);
    porMensaje.set(v.message_id, actual);
  }
  const revision = [...porMensaje.values()].sort(
    (a, b) => b.negativos - a.negativos || b.positivos - a.positivos,
  );

  const nombrePorId = new Map(equipo.map((m) => [m.id, m.nombre]));
  const tope = Number(ajustesActuales.ia_tope_diario_mxn ?? 0);

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/ventas/conversaciones"
          className="text-[13px] font-semibold text-ink-tertiary hover:text-teal"
        >
          ← Conversaciones
        </Link>
        <h1 className="font-display text-[24px] text-ink-title">Agentes IA</h1>
      </div>

      {/* Consumo */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          {
            label: "GASTO DE HOY",
            valor: `$${gastoHoy.toFixed(2)}`,
            nota: tope > 0 ? `tope $${tope} MXN` : "sin tope",
            alerta: tope > 0 && gastoHoy >= tope * 0.8,
          },
          {
            label: "GASTO 7 DÍAS",
            valor: `$${gastoSemana.toFixed(2)}`,
            nota: `${respuestasSemana} respuestas`,
            alerta: false,
          },
          {
            label: "ESCALACIONES ABIERTAS",
            valor: String((escalaciones ?? []).length),
            nota: "esperando a una persona",
            alerta: (escalaciones ?? []).length > 0,
          },
          {
            label: "RESPUESTAS CALIFICADAS",
            valor: String(revision.length),
            nota: `${revision.filter((r) => r.negativos > 0).length} con 👎`,
            alerta: false,
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`flex flex-col gap-1 rounded-[16px] p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)] ${
              k.alerta ? "bg-orange/10" : "bg-white"
            }`}
          >
            <span className="text-[11px] font-bold tracking-[.06em] text-ink-tertiary">
              {k.label}
            </span>
            <span className="font-display text-[26px] text-ink-title">
              {k.valor}
            </span>
            <span className="text-[11.5px] text-ink-secondary">{k.nota}</span>
          </div>
        ))}
      </div>

      {/* Escalaciones abiertas */}
      {(escalaciones ?? []).length > 0 && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <h2 className="text-[15px] font-bold text-ink-title">
            Esperando a una persona
          </h2>
          {(escalaciones ?? []).map((e) => (
            <Link
              key={e.id}
              href={`/ventas/conversaciones?conv=${e.id}`}
              className="flex flex-wrap items-center gap-2 rounded-[10px] bg-cream px-3 py-2 hover:bg-cream-light"
            >
              <span className="text-[12.5px] font-bold text-ink-title">
                {e.channel}
              </span>
              <span className="text-[11.5px] text-ink-body">
                {e.attention_reason ?? "sin motivo registrado"}
              </span>
              <span className="ml-auto text-[11px] text-ink-tertiary">
                {e.assigned_to
                  ? nombrePorId.get(e.assigned_to) ?? "asignada"
                  : "sin asignar"}
              </span>
            </Link>
          ))}
        </div>
      )}

      <PanelIA
        ajustes={ajustes}
        equipo={equipo}
        votos={revision}
        puedeInstruir={session.can["contactos.fusionar"]}
      />
    </div>
  );
}
