"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMBASSADOR_CODE_PREFIX } from "@/lib/constants";
import { bankFromClabe, isValidClabe } from "@/lib/banks";

/**
 * Datos de pago del embajador (banco + CLABE) para recibir el corte mensual
 * por SPEI. La CLABE se valida con dígito de control; el banco se detecta
 * automáticamente y puede corregirse con el selector.
 */
export async function savePaymentData(
  bankNameRaw: string,
  clabeRaw: string,
  holderRaw?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const clabe = clabeRaw?.replace(/\D/g, "") ?? "";
  if (!isValidClabe(clabe))
    return { error: "Revisa tu CLABE — deben ser 18 dígitos válidos." };
  const bankName = bankNameRaw?.trim() || bankFromClabe(clabe) || "Otro";
  const holder = holderRaw?.trim() || null;
  if (!holder)
    return { error: "Escribe el nombre del titular de la cuenta." };

  const admin = createAdminClient();
  const { data: ambassador } = await admin
    .from("ambassadors")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();
  if (!ambassador) return { error: "No encontramos tu perfil de embajador." };

  const { error } = await admin
    .from("ambassadors")
    .update({ bank_name: bankName, clabe, bank_holder: holder })
    .eq("id", ambassador.id);
  if (error) return { error: "No pudimos guardar tus datos. Intenta de nuevo." };

  revalidatePath("/embajador");
  return { ok: true as const, bankName };
}

/** Personalizar código — permitido una sola vez (code_change_count). */
export async function customizeCode(suffixRaw: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión de nuevo." };

  const suffix = suffixRaw?.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{3,15}$/.test(suffix))
    return {
      error: "Usa de 3 a 15 letras o números, sin espacios (ej. PAOLA).",
    };

  const admin = createAdminClient();
  const { data: ambassador } = await admin
    .from("ambassadors")
    .select("id, code_change_count, status")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();
  if (!ambassador) return { error: "No encontramos tu perfil de embajador." };
  if (ambassador.code_change_count >= 1)
    return { error: "Tu código ya fue personalizado — solo se puede una vez." };

  const code = `${AMBASSADOR_CODE_PREFIX}${suffix}`;
  const { data: taken } = await admin
    .from("ambassadors")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  if (taken) return { error: "Ese código ya está tomado. Prueba otro." };

  const { error } = await admin
    .from("ambassadors")
    .update({
      referral_code: code,
      code_change_count: ambassador.code_change_count + 1,
    })
    .eq("id", ambassador.id);
  if (error) return { error: "No pudimos actualizar el código. Intenta de nuevo." };

  revalidatePath("/embajador");
  return { ok: true as const, code };
}
