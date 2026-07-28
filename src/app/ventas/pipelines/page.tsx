import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { uno } from "@/lib/crm/embed";
import { estancada, getDefaultPipeline } from "@/lib/crm/opportunities";
import {
  Tablero,
  type Etapa,
  type Tarjeta,
} from "@/components/panel/pipelines/Tablero";

export const metadata = { title: "Pipelines · Portal de ventas" };

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requirePortal("ventas");
  const params = await searchParams;
  const admin = createAdminClient();

  const pipeline = await getDefaultPipeline(admin);
  const soloMios = params.propietario === "mios";

  const [{ data: oportunidades }, { data: motivos }, { data: equipoCat }] =
    await Promise.all([
      (() => {
        let q = admin
          .from("opportunities")
          .select(
            `id, title, value_cents, value_is_estimate, status, stage_id, owner_id,
             stage_entered_at, stage_locked_by, contact_id,
             pipeline_stages(key, name),
             lost_reasons(name),
             contacts(first_name, last_name, notes_count, tasks_open_count)`,
          )
          .eq("pipeline_id", pipeline.id)
          .order("stage_entered_at", { ascending: true });
        if (soloMios) q = q.eq("owner_id", session.userId);
        return q;
      })(),
      admin
        .from("lost_reasons")
        .select("id, name")
        .is("archived_at", null)
        .order("position"),
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
  const nombrePorId = new Map(equipo.map((m) => [m.id, m.nombre]));

  // Conteo de conversaciones por contacto, para el contador de la tarjeta
  const contactIds = [...new Set((oportunidades ?? []).map((o) => o.contact_id))];
  const conversacionesPorContacto = new Map<string, number>();
  if (contactIds.length > 0) {
    const { data: convs } = await admin
      .from("channel_conversations")
      .select("contact_id")
      .in("contact_id", contactIds);
    for (const c of convs ?? [])
      if (c.contact_id)
        conversacionesPorContacto.set(
          c.contact_id,
          (conversacionesPorContacto.get(c.contact_id) ?? 0) + 1,
        );
  }

  const etapas: Etapa[] = pipeline.stages.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    color: s.color,
    staleDays: s.stale_days,
    esGanada: s.is_won,
    esPerdida: s.is_lost,
  }));
  const staleDaysPorId = new Map(pipeline.stages.map((s) => [s.id, s.stale_days]));

  const tarjetas: Tarjeta[] = (oportunidades ?? []).map((o) => {
    const etapa = uno(o.pipeline_stages);
    const contacto = uno(o.contacts);
    const motivo = uno(o.lost_reasons);
    const nombre =
      [contacto?.first_name, contacto?.last_name].filter(Boolean).join(" ") ||
      "Sin nombre";
    const propietario = o.owner_id ? nombrePorId.get(o.owner_id) ?? null : null;

    return {
      id: o.id,
      stageKey: etapa?.key ?? "",
      titulo: o.title,
      contactId: o.contact_id,
      contacto: nombre,
      valorPesos: o.value_cents / 100,
      esEstimado: o.value_is_estimate,
      propietario,
      propietarioInicial: propietario
        ? propietario.charAt(0).toUpperCase()
        : null,
      fijadaPor: o.stage_locked_by
        ? nombrePorId.get(o.stage_locked_by) ?? "el equipo"
        : null,
      estancada: estancada(
        o.stage_entered_at,
        staleDaysPorId.get(o.stage_id) ?? null,
      ),
      diasEnEtapa: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(o.stage_entered_at).getTime()) / 86_400_000,
        ),
      ),
      conversaciones: conversacionesPorContacto.get(o.contact_id) ?? 0,
      notas: contacto?.notes_count ?? 0,
      tareas: contacto?.tasks_open_count ?? 0,
      motivoPerdida: motivo?.name ?? null,
    };
  });

  const totalPesos = tarjetas.reduce((s, t) => s + t.valorPesos, 0);
  const estancadas = tarjetas.filter((t) => t.estancada).length;

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="font-display text-[26px] text-ink-title">
            {pipeline.name}
          </h1>
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-ink-secondary shadow-[0_1px_5px_rgba(30,83,80,.06)]">
            {tarjetas.length} oportunidades · $
            {totalPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
          </span>
          {estancadas > 0 && (
            <span className="rounded-full bg-orange/15 px-3 py-1 text-[12px] font-bold text-orange">
              ⏱️ {estancadas} estancada{estancadas === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={soloMios ? "/ventas/pipelines" : "/ventas/pipelines?propietario=mios"}
            className={`grid h-[38px] place-items-center rounded-full px-4 text-[12.5px] font-bold transition-colors ${
              soloMios
                ? "bg-teal text-white"
                : "border-[1.5px] border-border-input bg-white text-ink-secondary hover:border-teal"
            }`}
          >
            {soloMios ? "✓ Solo mías" : "Solo mías"}
          </a>
        </div>
      </div>

      <Tablero
        etapas={etapas}
        tarjetas={tarjetas}
        motivos={motivos ?? []}
        equipo={equipo}
        puedeEditar={session.can["oportunidades.editar"]}
      />

      <p className="text-[11.5px] leading-snug text-ink-tertiary">
        Las etapas se llenan solas con lo que pasa en la plataforma (registro,
        checkout, pago, baja) a partir de la fase 1d. Si mueves una tarjeta a
        mano queda fijada con tu nombre y ninguna automatización la regresa —
        puedes soltarla desde la propia tarjeta.
      </p>
    </div>
  );
}
