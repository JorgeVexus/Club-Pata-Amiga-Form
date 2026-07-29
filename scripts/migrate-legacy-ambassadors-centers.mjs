/**
 * Migra ambassadors/wellness_centers legacy (exportados de produccion,
 * read-only, a C:/Users/JORGEC~1/AppData/Local/Temp/prod-ambassadors.json y /tmp/prod-wellness-centers.json)
 * hacia el esquema nuevo de pata-amiga en el proyecto de STAGING.
 *
 * Ambassadors legacy tienen su propio password_hash (bcrypt) -
 * independiente de Memberstack (algunos embajadores nunca fueron
 * miembros). Ese hash se preserva en profiles vía una columna nueva
 * para que el puente de login lo pueda usar directamente.
 *
 * Uso: npx tsx scripts/migrate-legacy-ambassadors-centers.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const ambassadors = JSON.parse(readFileSync("C:/Users/JORGEC~1/AppData/Local/Temp/prod-ambassadors.json", "utf-8"));
const centers = JSON.parse(readFileSync("C:/Users/JORGEC~1/AppData/Local/Temp/prod-wellness-centers.json", "utf-8"));

console.log(`Ambassadors: ${ambassadors.length}, Wellness centers: ${centers.length}`);
if (!APPLY) {
  console.log("Dry run - usa --apply para escribir.");
  process.exit(0);
}

let ambOk = 0, ambErr = 0, ambLinked = 0, ambNoAuth = 0;
for (const a of ambassadors) {
  // ¿Ya existe un profile migrado con este memberstack_id (era tambien miembro)?
  let userId = null;
  if (a.linked_memberstack_id) {
    const { data: p } = await supabase.from("profiles").select("id").eq("memberstack_id", a.linked_memberstack_id).maybeSingle();
    if (p) { userId = p.id; ambLinked++; }
  }
  // Si no hay profile (embajador puro, sin membresia), crear cuenta propia
  // para que pueda iniciar sesion, con password aleatoria (se migra su
  // password_hash real via profiles.legacy_ambassador_password_hash).
  if (!userId && a.email) {
    const { data: newAuth, error: authErr } = await supabase.auth.admin.createUser({
      id: a.id,
      email: a.email,
      password: randomUUID() + randomUUID(),
      email_confirm: true,
    });
    if (authErr && !authErr.message.includes("already been registered")) {
      console.error(`auth error ${a.email}:`, authErr.message);
      ambNoAuth++;
    } else if (newAuth?.user) {
      userId = newAuth.user.id;
      await supabase.from("profiles").upsert({
        id: userId,
        email: a.email,
        first_name: a.first_name,
        last_name: [a.paternal_surname, a.maternal_surname].filter(Boolean).join(" "),
        phone: a.phone,
        curp: a.curp,
        state: a.state,
        city: a.city,
        role: "member",
        legacy_ambassador_password_hash: a.password_hash,
      });
    }
  }
  if (!userId) { ambErr++; continue; }

  const { error } = await supabase.from("ambassadors").upsert({
    id: a.id,
    user_id: userId,
    first_name: a.first_name,
    last_name: [a.paternal_surname, a.maternal_surname].filter(Boolean).join(" ") || null,
    email: a.email,
    phone: a.phone,
    curp: a.curp,
    state: a.state,
    city: a.city,
    referral_code: a.referral_code || a.ambassador_code,
    status: a.status,
    rejection_reason: a.rejection_reason,
    ine_front_url: a.ine_front_url,
    ine_back_url: a.ine_back_url,
    profile_photo_url: a.profile_photo_url,
    bank_name: a.bank_name,
    bank_holder: a.bank_holder ?? null,
    created_at: a.created_at,
  });
  if (error) { console.error(`ambassador ${a.id}:`, error.message); ambErr++; } else ambOk++;
}
console.log({ ambOk, ambErr, ambLinked, ambNoAuth });

let centerOk = 0, centerErr = 0;
for (const c of centers) {
  const { error } = await supabase.from("wellness_centers").upsert({
    id: c.id,
    name: c.establishment_name || c.name,
    contact_name: c.name,
    email: c.email,
    phone: c.phone,
    services: c.services ?? [],
    logo_url: c.logo_url,
    status: c.status,
    rejection_reason: c.rejection_reason,
    memberstack_id: c.memberstack_id,
    created_at: c.created_at,
  });
  if (error) { console.error(`center ${c.id}:`, error.message); centerErr++; } else centerOk++;
}
console.log({ centerOk, centerErr });
