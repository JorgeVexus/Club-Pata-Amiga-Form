"use server";

import { createClient } from "@/lib/supabase/server";
import { loginDestination } from "@/lib/login-destination";

/**
 * Tras signInWithPassword en el cliente, resuelve el destino según el rol
 * y el estado del usuario (admin / miembro / embajador). Ver login-destination.
 */
export async function resolveLoginDestination(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/app";
  return loginDestination(user);
}
