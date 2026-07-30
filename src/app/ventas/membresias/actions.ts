"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { CATALOGO_BENEFICIOS, esVinculante } from "@/lib/plans/benefits";
import { publicarVersion } from "@/lib/plans/versiones";
import { crearCupon, desactivarCupon } from "@/lib/plans/cupones";
import {
  ejecutarMigracion,
  previsualizarMigracion,
  type FiltroCohorte,
} from "@/lib/plans/migracion";
import { campaignCouponKey, getCampaign } from "@/lib/landings";

/**
 * Planes y versiones.
 *
 * Refinamiento de la matriz de la sección 0, hacia MÁS cuidado: el gerente crea
 * versiones y cambia precio y empaquetado; los beneficios VINCULANTES (los que
 * están en el reglamento que el miembro aceptó) solo los toca un super admin, y
 * publicarlos exige el documento legal.
 */

function revalidar() {
  revalidatePath("/ventas/membresias");
  revalidatePath("/ventas");
}

export async function crearBorrador(input: {
  planId: string;
  interval: "month" | "year";
  precioPesos: number;
  beneficios: Record<string, number | boolean>;
  notas: string;
}) {
  const { userId, role } = await requireCapability("membresias.administrar");
  if (!Number.isFinite(input.precioPesos) || input.precioPesos < 0)
    return { error: "El precio no es válido." };

  // Solo se guardan las DIFERENCIAS contra el catálogo.
  const diferencias: Record<string, number | boolean> = {};
  for (const [llave, valor] of Object.entries(input.beneficios)) {
    const def = CATALOGO_BENEFICIOS[llave as keyof typeof CATALOGO_BENEFICIOS];
    if (!def) continue;
    if (valor === def.porOmision) continue;
    if (esVinculante(llave) && role !== "super_admin")
      return {
        error: `"${def.label}" está en el reglamento: solo un super admin puede cambiarlo.`,
      };
    diferencias[llave] = valor;
  }

  const admin = createAdminClient();
  const { data: ultima } = await admin
    .from("plan_versions")
    .select("version")
    .eq("plan_id", input.planId)
    .eq("interval", input.interval)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("plan_versions").insert({
    plan_id: input.planId,
    version: (ultima?.version ?? 0) + 1,
    interval: input.interval,
    price_cents: Math.round(input.precioPesos * 100),
    benefits: diferencias,
    status: "borrador",
    notes: input.notas.trim() || null,
    created_by: userId,
  });
  if (error) return { error: "No se pudo crear la versión." };

  revalidar();
  return { ok: true as const, diferencias: Object.keys(diferencias).length };
}

/** Confirma que el reglamento ya refleja el cambio (compuerta legal). */
export async function confirmarLegal(versionId: string, legalDocumentId: string) {
  const { userId } = await requireCapability("ajustes.plataforma"); // super admin
  const admin = createAdminClient();

  const { error } = await admin
    .from("plan_versions")
    .update({
      legal_document_id: legalDocumentId || null,
      legal_confirmed_by: userId,
      legal_confirmed_at: new Date().toISOString(),
    })
    .eq("id", versionId);
  if (error) return { error: "No se pudo confirmar." };

  revalidar();
  return { ok: true as const };
}

export async function publicar(versionId: string) {
  const { userId } = await requireCapability("membresias.administrar");
  const admin = createAdminClient();

  const res = await publicarVersion(admin, { versionId, publishedBy: userId });
  revalidar();
  return res.ok
    ? {
        ok: true as const,
        aviso: res.creadoEnStripe
          ? "Publicada y creada en Stripe ✓"
          : "Publicada (ya tenía precio en Stripe) ✓",
      }
    : { error: res.error };
}

export async function retirarVersion(versionId: string) {
  await requireCapability("ajustes.plataforma");
  const admin = createAdminClient();
  await admin
    .from("plan_versions")
    .update({ status: "retirada" })
    .eq("id", versionId);
  revalidar();
  return { ok: true as const };
}

/* ------------------------------------------------- migrar una cohorte --- */

/**
 * Ver el antes y el después SIN tocar nada. Es obligatorio pasar por aquí
 * antes de ejecutar: nunca hay migración silenciosa.
 */
export async function previsualizarCohorte(input: {
  versionDestinoId: string;
  filtro: FiltroCohorte;
}) {
  await requireCapability("ajustes.plataforma"); // super admin
  const admin = createAdminClient();
  return previsualizarMigracion(admin, input);
}

/**
 * Ejecuta la migración. La compuerta legal se revisa DENTRO de la librería,
 * con la cohorte recalculada — no con lo que mandó el navegador.
 */
export async function migrarCohorte(input: {
  versionDestinoId: string;
  filtro: FiltroCohorte;
  legalDocumentId?: string | null;
}) {
  const { userId } = await requireCapability("ajustes.plataforma");
  const admin = createAdminClient();

  const res = await ejecutarMigracion(admin, { ...input, confirmadoPor: userId });
  revalidar();
  if ("error" in res) return { error: res.error };

  const partes = [`${res.migrados} miembro(s) migrado(s)`];
  if (res.correosEnviados) partes.push(`${res.correosEnviados} correo(s) enviado(s)`);
  if (res.fallidos) partes.push(`${res.fallidos} sin migrar`);
  return { ok: true as const, aviso: `${partes.join(" · ")} ✓` };
}

/* -------------------------------------------------------------- cupones --- */

/**
 * Crea el cupón en Stripe (coupon + promotion_code) y, si se pide, lo deja
 * como la palabra de una landing de campaña.
 *
 * Ese último paso es el que cierra el pendiente manual de `/landings/regalo`:
 * hasta hoy alguien escribía la palabra en Admin → Landings y aparte la creaba
 * a mano en Stripe. Dos lugares que se podían contradecir; ahora es uno.
 */
export async function crearCuponPromocional(input: {
  code: string;
  nombre: string;
  tipo: "porcentaje" | "monto";
  porcentaje?: number;
  montoPesos?: number;
  duracion: "once" | "repeating" | "forever";
  duracionMeses?: number;
  venceEl?: string;
  usosMax?: number;
  planId?: string;
  notas?: string;
  /** Slug de la campaña que debe empezar a repartir esta palabra. */
  landingSlug?: string;
}) {
  const { userId } = await requireCapability("membresias.administrar");
  const admin = createAdminClient();

  const res = await crearCupon(admin, { ...input, createdBy: userId });
  if (!res.ok) return { error: res.error };

  let avisoLanding = "";
  if (input.landingSlug) {
    const campana = getCampaign(input.landingSlug);
    if (!campana) avisoLanding = " (la campaña indicada no existe)";
    else {
      const { error } = await admin.from("site_settings").upsert(
        { key: campaignCouponKey(campana.slug), value: res.code },
        { onConflict: "key" },
      );
      avisoLanding = error
        ? " (no se pudo dejar en la landing)"
        : ` y ya es la palabra de la landing "${campana.name}"`;
    }
  }

  revalidar();
  revalidatePath("/admin/landings");
  return { ok: true as const, aviso: `Cupón ${res.code} creado en Stripe ✓${avisoLanding}` };
}

export async function desactivarCuponPromocional(id: string) {
  await requireCapability("membresias.administrar");
  const admin = createAdminClient();
  const res = await desactivarCupon(admin, id);
  revalidar();
  return res.ok ? { ok: true as const } : { error: res.error };
}
