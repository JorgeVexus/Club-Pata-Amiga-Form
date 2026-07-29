/**
 * Puente de autenticacion legacy: Memberstack -> Supabase Auth.
 *
 * Los ~450 miembros migrados desde el proyecto anterior tienen una fila en
 * `profiles` con `memberstack_id` poblado y `legacy_password_migrated =
 * false` (ver scripts/backfill-legacy-users.ts). Esas cuentas se crearon en
 * Supabase Auth con una password aleatoria que el usuario no conoce, asi que
 * su primer `signInWithPassword` real siempre falla.
 *
 * Este modulo intenta, en ese caso, validar la password que el usuario
 * escribio contra Memberstack (el sistema donde SI es la correcta). Si es
 * valida, migramos su password a Supabase de forma silenciosa
 * (`admin.updateUserById`) y marcamos `legacy_password_migrated = true` -
 * la siguiente vez ya entra 100% nativo por Supabase.
 *
 * `verifyMemberstackPassword` llama a `POST client.memberstack.com/auth/login`
 * (confirmado en vivo contra el proyecto real de Memberstack de este
 * cliente: un intento con credenciales invalidas devuelve
 * {"code":"invalid-credentials", ...} con el mensaje de error personalizado
 * de esta cuenta, no un 404 generico). Falla cerrado: cualquier error de
 * red o respuesta inesperada se trata como password invalida, nunca como
 * valida.
 *
 * Los embajadores legacy que nunca fueron miembros (sin `memberstack_id`)
 * tenian su propio password_hash (bcrypt) en la tabla `ambassadors` del
 * proyecto anterior - no pasaban por Memberstack. Ese hash se preservo en
 * `profiles.legacy_ambassador_password_hash` durante la migracion
 * (scripts/migrate-legacy-ambassadors-centers.mjs) y se valida localmente
 * con bcrypt en vez de llamar a una API externa.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

const MEMBERSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY;

async function verifyMemberstackPassword(email: string, password: string): Promise<boolean> {
  if (!MEMBERSTACK_PUBLIC_KEY) return false;
  try {
    const res = await fetch("https://client.memberstack.com/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": MEMBERSTACK_PUBLIC_KEY,
      },
      body: JSON.stringify({ email, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type LegacyBridgeResult =
  | { migrated: true }
  | { migrated: false; reason: "no-legacy-account" | "already-migrated" | "invalid-password" };

/**
 * Se llama SOLO cuando el signInWithPassword nativo ya fallo. Si el correo
 * corresponde a una cuenta legacy no migrada y la password es correcta en
 * Memberstack, actualiza el password en Supabase Auth para que el llamador
 * pueda reintentar signInWithPassword de inmediato.
 */
export async function tryLegacyPasswordMigration(
  email: string,
  password: string,
): Promise<LegacyBridgeResult> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, memberstack_id, legacy_password_migrated, legacy_ambassador_password_hash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!profile || (!profile.memberstack_id && !profile.legacy_ambassador_password_hash)) {
    return { migrated: false, reason: "no-legacy-account" };
  }
  if (profile.legacy_password_migrated) {
    return { migrated: false, reason: "already-migrated" };
  }

  const valid = profile.memberstack_id
    ? await verifyMemberstackPassword(email, password)
    : await bcrypt.compare(password, profile.legacy_ambassador_password_hash!);
  if (!valid) {
    return { migrated: false, reason: "invalid-password" };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password });
  if (updateError) {
    return { migrated: false, reason: "invalid-password" };
  }

  await admin
    .from("profiles")
    .update({ legacy_password_migrated: true, legacy_ambassador_password_hash: null })
    .eq("id", profile.id);

  return { migrated: true };
}
