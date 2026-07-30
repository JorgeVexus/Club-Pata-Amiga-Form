"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { emitEvent } from "@/lib/crm/events";
import {
  ensureOpportunity,
  getDefaultPipeline,
  moveStage,
  type StageKey,
} from "@/lib/crm/opportunities";
import { armarTarjeta, tarjetasDeEtapa } from "@/lib/crm/tarjetas";

/**
 * Acciones del tablero de oportunidades. Todo movimiento hecho por una persona
 * fija la tarjeta (`stage_locked_by`) para que ninguna automatización la
 * regrese después.
 */

/**
 * La siguiente página de tarjetas de una columna.
 *
 * Cada columna abre con las primeras 50 (`TOPE_POR_ETAPA`); esto trae las que
 * siguen sin recargar la pantalla. Arma las tarjetas con la MISMA función que la
 * pantalla, así que las dos muestran lo mismo.
 */
export async function masTarjetas(
  stageId: string,
  desde: number,
  soloMias: boolean,
) {
  // Leer, no editar: la tarjeta lleva el nombre del contacto, así que la puerta
  // es la misma que para ver contactos.
  const session = await requireCapability("contactos.ver");
  const admin = createAdminClient();

  const pipeline = await getDefaultPipeline(admin);
  if (!pipeline.stages.some((s) => s.id === stageId))
    return { error: "Esa etapa no existe." };

  const filas = await tarjetasDeEtapa(admin, {
    pipelineId: pipeline.id,
    stageId,
    // "Solo mías" se respeta también aquí: si no, el "ver más" traería tarjetas
    // de otras personas a una vista filtrada.
    ownerId: soloMias ? session.userId : null,
    desde,
  });

  const contactIds = [...new Set(filas.map((f) => f.contact_id))];
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

  const { data: equipoCat } = await admin
    .from("profiles")
    .select("id, first_name, email")
    .in("role", ["ventas", "gerente_ventas", "admin", "super_admin"]);
  const nombrePorId = new Map(
    (equipoCat ?? []).map((m) => [
      m.id,
      m.first_name || m.email?.split("@")[0] || "Equipo",
    ]),
  );

  return {
    ok: true as const,
    tarjetas: filas.map((f) =>
      armarTarjeta(f, {
        staleDaysPorEtapa: new Map(
          pipeline.stages.map((s) => [s.id, s.stale_days]),
        ),
        nombrePorId,
        conversacionesPorContacto,
      }),
    ),
  };
}

function revalidar(contactId?: string) {
  revalidatePath("/ventas/pipelines");
  revalidatePath("/ventas");
  if (contactId) revalidatePath(`/ventas/contactos/${contactId}`);
}

export async function moverEtapa(
  opportunityId: string,
  stageKey: StageKey,
  lostReasonId?: string | null,
) {
  const { userId } = await requireCapability("oportunidades.editar");
  const admin = createAdminClient();

  const res = await moveStage(admin, {
    opportunityId,
    stageKey,
    actorId: userId,
    lostReasonId: lostReasonId ?? null,
  });

  revalidar();
  if (!res.moved)
    return {
      error:
        res.reason === "no_existe"
          ? "La oportunidad o la etapa ya no existen."
          : res.reason === "misma_etapa"
            ? "Ya estaba en esa etapa."
            : "No se pudo mover.",
    };
  return { ok: true as const, etapa: res.stageName };
}

export async function asignarOportunidad(
  opportunityId: string,
  ownerId: string | null,
) {
  const { userId } = await requireCapability("oportunidades.editar");
  const admin = createAdminClient();

  const { data: opp } = await admin
    .from("opportunities")
    .select("contact_id, title")
    .eq("id", opportunityId)
    .maybeSingle();

  await admin
    .from("opportunities")
    .update({ owner_id: ownerId, updated_at: new Date().toISOString() })
    .eq("id", opportunityId);

  if (opp?.contact_id) {
    let nombre = "nadie";
    if (ownerId) {
      const { data } = await admin
        .from("profiles")
        .select("first_name, email")
        .eq("id", ownerId)
        .single();
      nombre = data?.first_name || data?.email || "alguien del equipo";
    }
    await emitEvent(admin, {
      contactId: opp.contact_id,
      kind: "propietario_asignado",
      summary: `Oportunidad "${opp.title}" ${ownerId ? `asignada a ${nombre}` : "sin propietario"}`,
      payload: { opportunityId },
      actorId: userId,
    });
  }

  revalidar(opp?.contact_id ?? undefined);
  return { ok: true as const };
}

/** Ajuste manual del monto (deja de ser estimado). */
export async function fijarValor(opportunityId: string, pesos: number) {
  const { userId } = await requireCapability("oportunidades.editar");
  if (!Number.isFinite(pesos) || pesos < 0)
    return { error: "El monto no es válido." };

  const admin = createAdminClient();
  const { data: opp } = await admin
    .from("opportunities")
    .select("contact_id, title")
    .eq("id", opportunityId)
    .maybeSingle();

  await admin
    .from("opportunities")
    .update({
      value_cents: Math.round(pesos * 100),
      value_is_estimate: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (opp?.contact_id)
    await emitEvent(admin, {
      contactId: opp.contact_id,
      kind: "nota",
      summary: `Valor de "${opp.title}" fijado en $${pesos.toLocaleString("es-MX")} MXN`,
      payload: { opportunityId },
      actorId: userId,
    });

  revalidar(opp?.contact_id ?? undefined);
  return { ok: true as const };
}

/** Crea una oportunidad para un contacto que no tiene (o que ya cerró la suya). */
export async function crearOportunidad(
  contactId: string,
  stageKey: StageKey,
  titulo?: string,
) {
  const { userId } = await requireCapability("oportunidades.editar");
  const admin = createAdminClient();

  try {
    const { created } = await ensureOpportunity(admin, {
      contactId,
      stageKey,
      title: titulo?.trim() || undefined,
      actorId: userId,
    });
    revalidar(contactId);
    return created
      ? { ok: true as const }
      : { error: "Ese contacto ya tiene una oportunidad en el tablero." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "No se pudo crear.",
    };
  }
}

/** Mover o asignar varias tarjetas de un jalón. */
export async function loteOportunidades(
  ids: string[],
  accion: { stageKey?: StageKey; ownerId?: string | null; lostReasonId?: string | null },
) {
  const { userId } = await requireCapability("oportunidades.editar");
  if (ids.length === 0) return { error: "Selecciona al menos una tarjeta." };

  const admin = createAdminClient();
  let movidas = 0;
  let bloqueadas = 0;

  if (accion.stageKey) {
    for (const id of ids) {
      const res = await moveStage(admin, {
        opportunityId: id,
        stageKey: accion.stageKey,
        actorId: userId,
        lostReasonId: accion.lostReasonId ?? null,
      });
      if (res.moved) movidas += 1;
      else bloqueadas += 1;
    }
  }

  if (accion.ownerId !== undefined) {
    await admin
      .from("opportunities")
      .update({ owner_id: accion.ownerId, updated_at: new Date().toISOString() })
      .in("id", ids);
    movidas = ids.length;
  }

  revalidar();
  return { ok: true as const, movidas, bloqueadas };
}

/**
 * Suelta el bloqueo humano para que la plataforma vuelva a mover la tarjeta
 * sola. Es la salida del "yo la muevo a mano": si no existiera, una tarjeta
 * tocada una vez quedaría manual para siempre.
 */
export async function devolverAutomatico(opportunityId: string) {
  const { userId } = await requireCapability("oportunidades.editar");
  const admin = createAdminClient();

  const { data: opp } = await admin
    .from("opportunities")
    .select("contact_id, title")
    .eq("id", opportunityId)
    .maybeSingle();

  await admin
    .from("opportunities")
    .update({
      stage_locked_by: null,
      stage_locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (opp?.contact_id)
    await emitEvent(admin, {
      contactId: opp.contact_id,
      kind: "etapa_movida",
      summary: `"${opp.title}" vuelve a moverse automáticamente con los eventos de la plataforma`,
      payload: { opportunityId },
      actorId: userId,
    });

  revalidar(opp?.contact_id ?? undefined);
  return { ok: true as const };
}
