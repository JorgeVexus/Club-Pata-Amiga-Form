/**
 * Crea/liga cuentas de Supabase Auth para los centros de bienestar
 * migrados que todavia no tienen una (dueños de centro que nunca fueron
 * miembros). Reusa el profile existente si el email ya tiene uno (p.ej.
 * tambien es miembro), si no crea uno nuevo con memberstack_id para que
 * el puente de login (Memberstack) funcione igual que con los miembros.
 *
 * Uso: npx tsx scripts/link-wellness-center-accounts.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const { data: centers } = await supabase
  .from("wellness_centers")
  .select("id, email, memberstack_id, user_id")
  .not("email", "is", null)
  .is("user_id", null);

console.log(`Centros sin user_id ligado: ${centers?.length ?? 0}`);
if (!APPLY) { console.log("Dry run - usa --apply."); process.exit(0); }

let linked = 0, created = 0, err = 0;
for (const c of centers ?? []) {
  let userId = null;
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", c.email).maybeSingle();
  if (existing) {
    userId = existing.id;
    linked++;
  } else {
    const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
      email: c.email,
      password: randomUUID() + randomUUID(),
      email_confirm: true,
    });
    if (authErr) { console.error(`auth ${c.email}:`, authErr.message); err++; continue; }
    userId = auth.user.id;
    await supabase.from("profiles").upsert({
      id: userId,
      email: c.email,
      role: "member",
      memberstack_id: c.memberstack_id,
      legacy_password_migrated: false,
    });
    created++;
  }
  const { error } = await supabase.from("wellness_centers").update({ user_id: userId }).eq("id", c.id);
  if (error) { console.error(`link ${c.id}:`, error.message); err++; }
}
console.log({ linked, created, err });
