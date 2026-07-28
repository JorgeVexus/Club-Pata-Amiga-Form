"use server";

import { createClient } from "@/lib/supabase/server";
import { loginDestination } from "@/lib/login-destination";
import { tryLegacyPasswordMigration } from "@/lib/legacy-auth-bridge";

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

/**
 * Se llama SOLO cuando signInWithPassword del cliente ya falló. Si el
 * correo pertenece a un miembro legacy (Memberstack) aún no migrado y la
 * password es correcta ahí, la migra a Supabase Auth de forma silenciosa e
 * inicia sesión server-side (para que la cookie de sesión quede puesta en
 * esta misma respuesta). Ver src/lib/legacy-auth-bridge.ts.
 */
export async function attemptLegacyBridgeLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; destination?: string }> {
  const result = await tryLegacyPasswordMigration(email, password);
  if (!result.migrated) return { success: false };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return { success: false };

  return { success: true, destination: await loginDestination(data.user) };
}
