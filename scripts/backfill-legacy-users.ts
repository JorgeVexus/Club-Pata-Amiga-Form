/**
 * Backfill one-shot: migra usuarios/mascotas legacy (Memberstack + tablas
 * `users`/`legacy.pets`) hacia el esquema nuevo de pata-amiga
 * (`auth.users` + `profiles` + `pets`).
 *
 * Preserva el mismo UUID de `users.id` como `auth.users.id`/`profiles.id`,
 * asi que `pets.owner_id` (legacy) sigue apuntando al mismo usuario sin
 * necesidad de remapear ninguna foreign key.
 *
 * Uso:
 *   npx tsx scripts/backfill-legacy-users.ts --dry-run   (solo reporta, no escribe nada)
 *   npx tsx scripts/backfill-legacy-users.ts --apply     (escribe de verdad)
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// SOURCE_* opcionales: si se dan, se lee de un proyecto distinto al de
// escritura (p.ej. exportar de produccion hacia staging) sin tocar
// .env.local. Si no, lee y escribe en el mismo proyecto (comportamiento
// original).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL ?? SUPABASE_URL;
const SOURCE_KEY = process.env.SOURCE_SERVICE_ROLE_KEY ?? SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const source = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const APPLY = process.argv.includes("--apply");

type OldUser = {
  id: string;
  memberstack_id: string | null;
  first_name: string | null;
  last_name: string | null;
  mother_last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  curp: string | null;
  email: string;
  phone: string | null;
  postal_code: string | null;
  state: string | null;
  city: string | null;
  colony: string | null;
  address: string | null;
  membership_status: string | null;
  approval_status: string | null;
  created_at: string | null;
  is_foreigner: boolean | null;
  ambassador_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  coupon_code: string | null;
  role: string | null;
};

const ROLE_MAP: Record<string, string> = {
  admin: "admin",
  super_admin: "super_admin",
};

const MEMBERSHIP_STATUS_MAP: Record<string, string> = {
  pending: "pending_payment",
  action_required: "pending_payment",
  rejected: "pending_payment",
  active: "active",
  cancelled: "canceled",
};

async function fetchAll<T>(table: string): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await source
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  console.log(APPLY ? "*** MODO APPLY (escribe de verdad) ***" : "--- modo dry-run (solo reporta) ---");

  const oldUsers = await fetchAll<OldUser>("users");

  console.log(`Usuarios legacy encontrados: ${oldUsers.length}`);
  console.log("(Las mascotas se migran aparte via SQL directo, ver scripts/migrate-legacy-pets.sql — PostgREST no expone el schema `legacy`.)");

  const statusCounts: Record<string, number> = {};
  for (const u of oldUsers) {
    const key = u.membership_status ?? "null";
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }
  console.log("Distribución membership_status legacy:", statusCounts);

  let createdAuth = 0;
  let createdProfiles = 0;
  let errors = 0;

  for (const u of oldUsers) {
    const mappedStatus = MEMBERSHIP_STATUS_MAP[u.membership_status ?? ""] ?? "pending_payment";

    if (!APPLY) {
      continue;
    }

    try {
      const tempPassword = randomUUID() + randomUUID();
      const { error: authError } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          migrated_from_memberstack: true,
          legacy_membership_status: u.membership_status,
          legacy_approval_status: u.approval_status,
        },
      });
      if (authError && !authError.message.includes("already been registered")) {
        throw authError;
      }
      createdAuth++;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        mother_last_name: u.mother_last_name,
        phone: u.phone,
        curp: u.curp,
        birth_date: u.birth_date,
        gender: u.gender,
        postal_code: u.postal_code,
        state: u.state,
        city: u.city,
        colony: u.colony,
        street_address: u.address,
        membership_status: mappedStatus,
        member_since: u.created_at,
        role: ROLE_MAP[u.role ?? ""] ?? "member",
        memberstack_id: u.memberstack_id,
        legacy_password_migrated: false,
        ambassador_code_used: u.ambassador_code,
        utm_source: u.utm_source,
        utm_medium: u.utm_medium,
        utm_campaign: u.utm_campaign,
        created_at: u.created_at,
      });
      if (profileError) throw profileError;
      createdProfiles++;
    } catch (e) {
      errors++;
      console.error(`Error migrando usuario ${u.id} (${u.email}):`, (e as Error).message);
    }
  }

  console.log("--- Resumen ---");
  console.log({ createdAuth, createdProfiles, errors, applied: APPLY });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
