"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Alta al newsletter desde el footer de la landing. */
export async function subscribeNewsletter(emailRaw: string) {
  const email = emailRaw?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Revisa tu correo electrónico." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_subscribers")
    .upsert({ email, source: "landing" }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { error: "No pudimos registrarte. Intenta de nuevo." };

  return { ok: true as const };
}
