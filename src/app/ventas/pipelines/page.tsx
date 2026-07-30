import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { getDefaultPipeline } from "@/lib/crm/opportunities";
import {
  armarTarjeta,
  resumenPorEtapa,
  tarjetasDeEtapa,
} from "@/lib/crm/tarjetas";
import {
  Tablero,
  type Etapa,
  type Tarjeta,
  type TotalEtapa,
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
  const ownerId = soloMios ? session.userId : null;
  const staleDaysPorEtapa = new Map(
    pipeline.stages.map((s) => [s.id, s.stale_days]),
  );

  // Cada columna trae su primera página; los totales van aparte porque el
  // encabezado no puede decir "50 oportunidades" cuando hay 169. Antes esto era
  // una sola consulta sin tope y la pantalla tardaba 9 segundos con el
  // histórico dentro.
  const [resumen, { data: motivos }, { data: equipoCat }, filasPorEtapa] =
    await Promise.all([
      resumenPorEtapa(admin, {
        pipelineId: pipeline.id,
        ownerId,
        staleDaysPorEtapa,
      }),
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
      Promise.all(
        pipeline.stages.map((s) =>
          tarjetasDeEtapa(admin, {
            pipelineId: pipeline.id,
            stageId: s.id,
            ownerId,
          }),
        ),
      ),
    ]);
  const oportunidades = filasPorEtapa.flat();

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
  const tarjetas: Tarjeta[] = oportunidades.map((o) =>
    armarTarjeta(o, {
      staleDaysPorEtapa,
      nombrePorId,
      conversacionesPorContacto,
    }),
  );

  // Los totales del encabezado y de cada columna salen del resumen, NO de las
  // tarjetas cargadas: si no, dirían "50" donde hay 169.
  const totales: Record<string, TotalEtapa> = {};
  for (const s of pipeline.stages) {
    const r = resumen.get(s.id);
    totales[s.key] = {
      cuantas: r?.cuantas ?? 0,
      valorPesos: (r?.centavos ?? 0) / 100,
      estancadas: r?.estancadas ?? 0,
    };
  }
  const totalOportunidades = Object.values(totales).reduce(
    (s, t) => s + t.cuantas,
    0,
  );
  const totalPesos = Object.values(totales).reduce((s, t) => s + t.valorPesos, 0);
  const estancadas = Object.values(totales).reduce(
    (s, t) => s + t.estancadas,
    0,
  );

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="font-display text-[26px] text-ink-title">
            {pipeline.name}
          </h1>
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-ink-secondary shadow-[0_1px_5px_rgba(30,83,80,.06)]">
            {totalOportunidades} oportunidades · $
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
        totales={totales}
        soloMios={soloMios}
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
