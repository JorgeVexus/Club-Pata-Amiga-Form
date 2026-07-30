import type { createAdminClient } from "@/lib/supabase/admin";
import { uno } from "@/lib/crm/embed";
import { estancada } from "@/lib/crm/opportunities";
import { diasDesde } from "@/lib/dates";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * ARMADO DE LAS TARJETAS DEL KANBAN, en un solo lugar.
 *
 * Lo usan la pantalla (`/ventas/pipelines`) y el "ver más" de cada columna. Si
 * cada uno armara su tarjeta, tarde o temprano una mostraría un dato que la
 * otra no —es exactamente cómo se separaron las dos bandejas de conversaciones,
 * y de ahí salió el error 500 del canal `email`.
 */

/**
 * Cuántas tarjetas trae una columna por carga.
 *
 * Antes se traían TODAS las del pipeline: con el histórico de LynSales dentro
 * (467 tarjetas) la pantalla tardaba 9 segundos y mandaba 1.28 MB de HTML,
 * porque cada tarjeta viaja con sus relaciones y se serializa completa como
 * prop del tablero. 50 es lo que se ve de un vistazo en una columna; el resto
 * se pide con "ver más".
 */
export const TOPE_POR_ETAPA = 50;

/** Columnas y relaciones que necesita una tarjeta. Un solo select. */
const SELECT_TARJETA = `id, title, value_cents, value_is_estimate, status, stage_id, owner_id,
   stage_entered_at, stage_locked_by, contact_id,
   pipeline_stages(key, name),
   lost_reasons(name),
   contacts(first_name, last_name, notes_count, tasks_open_count)`;

/** Lo que la fila de la base tiene que traer para armar una tarjeta. */
type FilaOportunidad = {
  id: string;
  title: string;
  value_cents: number;
  value_is_estimate: boolean;
  stage_id: string;
  owner_id: string | null;
  stage_entered_at: string;
  stage_locked_by: string | null;
  contact_id: string;
  pipeline_stages: unknown;
  lost_reasons: unknown;
  contacts: unknown;
};

export type ContextoTarjeta = {
  /** Días de inactividad que vuelven estancada a cada etapa, por id. */
  staleDaysPorEtapa: Map<string, number | null>;
  /** Nombre legible de cada persona del equipo, por id. */
  nombrePorId: Map<string, string>;
  /** Cuántas conversaciones tiene cada contacto, por id de contacto. */
  conversacionesPorContacto: Map<string, number>;
};

/** Una fila de la base como la tarjeta que pinta el tablero. */
export function armarTarjeta(fila: FilaOportunidad, ctx: ContextoTarjeta) {
  const etapa = uno(fila.pipeline_stages) as { key?: string } | null;
  const contacto = uno(fila.contacts) as {
    first_name?: string | null;
    last_name?: string | null;
    notes_count?: number | null;
    tasks_open_count?: number | null;
  } | null;
  const motivo = uno(fila.lost_reasons) as { name?: string } | null;

  const nombre =
    [contacto?.first_name, contacto?.last_name].filter(Boolean).join(" ") ||
    "Sin nombre";
  const propietario = fila.owner_id
    ? ctx.nombrePorId.get(fila.owner_id) ?? null
    : null;

  return {
    id: fila.id,
    stageKey: etapa?.key ?? "",
    titulo: fila.title,
    contactId: fila.contact_id,
    contacto: nombre,
    valorPesos: fila.value_cents / 100,
    esEstimado: fila.value_is_estimate,
    propietario,
    propietarioInicial: propietario
      ? propietario.charAt(0).toUpperCase()
      : null,
    fijadaPor: fila.stage_locked_by
      ? ctx.nombrePorId.get(fila.stage_locked_by) ?? "el equipo"
      : null,
    estancada: estancada(
      fila.stage_entered_at,
      ctx.staleDaysPorEtapa.get(fila.stage_id) ?? null,
    ),
    diasEnEtapa: diasDesde(fila.stage_entered_at),
    conversaciones: ctx.conversacionesPorContacto.get(fila.contact_id) ?? 0,
    notas: contacto?.notes_count ?? 0,
    tareas: contacto?.tasks_open_count ?? 0,
    motivoPerdida: motivo?.name ?? null,
  };
}

/**
 * Una página de tarjetas de UNA etapa, de la más vieja en la etapa a la más
 * nueva: la que lleva más tiempo esperando es la que hay que atender primero.
 */
export async function tarjetasDeEtapa(
  admin: Admin,
  input: {
    pipelineId: string;
    stageId: string;
    ownerId?: string | null;
    desde?: number;
    tope?: number;
  },
) {
  const desde = input.desde ?? 0;
  const tope = input.tope ?? TOPE_POR_ETAPA;

  let q = admin
    .from("opportunities")
    .select(SELECT_TARJETA)
    .eq("pipeline_id", input.pipelineId)
    .eq("stage_id", input.stageId)
    .order("stage_entered_at", { ascending: true })
    .range(desde, desde + tope - 1);
  // El filtro va en la CONSULTA, no sobre lo ya traído: si se filtrara después,
  // "solo mías" mostraría 3 de 50 en lugar de las 50 primeras que son mías.
  if (input.ownerId) q = q.eq("owner_id", input.ownerId);

  const { data } = await q;
  return (data ?? []) as unknown as FilaOportunidad[];
}

export type ResumenEtapa = {
  cuantas: number;
  centavos: number;
  estancadas: number;
};

/**
 * Los totales REALES por etapa: cuántas hay, cuánto valen y cuántas están
 * estancadas. Se piden aparte de las tarjetas porque el encabezado no puede
 * decir "50 oportunidades" cuando hay 169.
 *
 * Trae una fila por oportunidad pero solo TRES columnas y sin relaciones, que
 * es lo que la hacía pesada. Con los datos de hoy (467) son unos kilobytes. Si
 * algún día son decenas de miles, esto se cambia por una función en la base que
 * devuelva los agregados ya sumados; mientras, no vale la pena una migración.
 */
export async function resumenPorEtapa(
  admin: Admin,
  input: {
    pipelineId: string;
    ownerId?: string | null;
    staleDaysPorEtapa: Map<string, number | null>;
  },
): Promise<Map<string, ResumenEtapa>> {
  let q = admin
    .from("opportunities")
    .select("stage_id, value_cents, stage_entered_at")
    .eq("pipeline_id", input.pipelineId);
  if (input.ownerId) q = q.eq("owner_id", input.ownerId);

  const { data } = await q;
  const resumen = new Map<string, ResumenEtapa>();
  const ahora = Date.now();

  for (const fila of (data ?? []) as {
    stage_id: string;
    value_cents: number;
    stage_entered_at: string;
  }[]) {
    const actual =
      resumen.get(fila.stage_id) ?? { cuantas: 0, centavos: 0, estancadas: 0 };
    actual.cuantas += 1;
    actual.centavos += fila.value_cents;
    const dias = input.staleDaysPorEtapa.get(fila.stage_id);
    if (
      dias != null &&
      new Date(fila.stage_entered_at).getTime() < ahora - dias * 86_400_000
    )
      actual.estancadas += 1;
    resumen.set(fila.stage_id, actual);
  }
  return resumen;
}
