"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/alerts";

/**
 * Acciones del dashboard del centro aliado (/centro): el centro edita su
 * beneficio para miembros, contacto y logo, y administra sus promociones.
 * Los cambios se reflejan en el directorio público (/centros) y en el de
 * miembros (/app/centros) sin pasar por el comité.
 */

async function ownCenter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("wellness_centers")
    .select("id, name, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });
  const center = rows?.find((c) => c.status === "approved") ?? rows?.[0];
  if (!center) return null;
  return { center, admin, userId: user.id };
}

function refreshCenterPages() {
  revalidatePath("/centro");
  revalidatePath("/centros");
  revalidatePath("/app/centros");
}

/** Beneficio para miembros + datos de contacto visibles en el directorio. */
export async function updateCenterInfo(input: {
  memberBenefit: string;
  phone: string;
  website: string;
}) {
  const ctx = await ownCenter();
  if (!ctx) return { error: "No encontramos tu centro aliado." };

  const memberBenefit = input.memberBenefit?.trim();
  if (!memberBenefit)
    return { error: "Cuéntanos el beneficio que ofreces a los miembros." };

  const { error } = await ctx.admin
    .from("wellness_centers")
    .update({
      member_benefit: memberBenefit,
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
    })
    .eq("id", ctx.center.id);
  if (error) return { error: "No pudimos guardar los datos. Intenta de nuevo." };

  refreshCenterPages();
  return { ok: true as const };
}

/** Logo/foto del centro (bucket público wellness-logos, vía service role). */
export async function uploadCenterLogo(formData: FormData) {
  const ctx = await ownCenter();
  if (!ctx) return { error: "No encontramos tu centro aliado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona una imagen." };
  if (!file.type.startsWith("image/")) return { error: "Solo imágenes." };
  if (file.size > 8 * 1024 * 1024) return { error: "Máximo 8 MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${ctx.center.id}/logo-${Date.now()}.${ext}`;
  const { error: upError } = await ctx.admin.storage
    .from("wellness-logos")
    .upload(path, file, { contentType: file.type });
  if (upError) return { error: "No pudimos subir la imagen. Intenta de nuevo." };

  const {
    data: { publicUrl },
  } = ctx.admin.storage.from("wellness-logos").getPublicUrl(path);

  const { error } = await ctx.admin
    .from("wellness_centers")
    .update({ logo_url: publicUrl })
    .eq("id", ctx.center.id);
  if (error) return { error: "No pudimos guardar la imagen. Intenta de nuevo." };

  refreshCenterPages();
  return { ok: true as const, url: publicUrl };
}

export type PromotionInput = {
  title: string;
  description?: string;
  discountLabel?: string;
  validUntil?: string; // yyyy-mm-dd
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Nueva promoción — visible al instante en el directorio si está activa. */
export async function createPromotion(input: PromotionInput) {
  const ctx = await ownCenter();
  if (!ctx) return { error: "No encontramos tu centro aliado." };

  const title = input.title?.trim();
  if (!title || title.length < 3)
    return { error: "Ponle un título a tu promoción." };
  const validUntil = input.validUntil?.trim() || null;
  if (validUntil && !DATE_RE.test(validUntil))
    return { error: "Revisa la fecha de vigencia." };

  const { error } = await ctx.admin.from("center_promotions").insert({
    center_id: ctx.center.id,
    title,
    description: input.description?.trim() || null,
    discount_label: input.discountLabel?.trim() || null,
    valid_until: validUntil,
  });
  if (error)
    return { error: "No pudimos guardar la promoción. Intenta de nuevo." };

  await notifyTeam(
    "notify_centers",
    "Nueva promoción de centro aliado 🏪",
    `<h2 style="color:#1E5350">${ctx.center.name} publicó una promoción</h2>
     <p><strong>${title}</strong>${input.discountLabel ? ` — ${input.discountLabel.trim()}` : ""}</p>
     <p>Revísala en el panel → Centros.</p>`,
  );

  refreshCenterPages();
  return { ok: true as const };
}

/** Pausar/reactivar una promoción sin borrarla. */
export async function togglePromotion(promotionId: string, isActive: boolean) {
  const ctx = await ownCenter();
  if (!ctx) return { error: "No encontramos tu centro aliado." };

  const { error } = await ctx.admin
    .from("center_promotions")
    .update({ is_active: isActive })
    .eq("id", promotionId)
    .eq("center_id", ctx.center.id);
  if (error) return { error: "No pudimos actualizar. Intenta de nuevo." };

  refreshCenterPages();
  return { ok: true as const };
}

export async function deletePromotion(promotionId: string) {
  const ctx = await ownCenter();
  if (!ctx) return { error: "No encontramos tu centro aliado." };

  const { error } = await ctx.admin
    .from("center_promotions")
    .delete()
    .eq("id", promotionId)
    .eq("center_id", ctx.center.id);
  if (error) return { error: "No pudimos borrar la promoción. Intenta de nuevo." };

  refreshCenterPages();
  return { ok: true as const };
}
