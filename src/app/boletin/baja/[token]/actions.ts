"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { darDeBajaPorToken } from "@/lib/newsletter/envio";

/**
 * Baja del boletín. No pide sesión a propósito: el token del correo ES la
 * identificación, y exigir contraseña para dejar de recibir correo es la
 * forma más rápida de acabar marcado como spam.
 */
export async function darDeBaja(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const admin = createAdminClient();
  await darDeBajaPorToken(admin, token);

  revalidatePath(`/boletin/baja/${token}`);
}
