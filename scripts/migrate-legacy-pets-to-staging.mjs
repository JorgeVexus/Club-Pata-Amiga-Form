/**
 * Migra pets legacy (exportados de produccion a
 * C:/Users/JORGEC~1/AppData/Local/Temp/prod-pets.json, read-only) hacia
 * public.pets en STAGING. Mismo mapeo que scripts/migrate-legacy-pets.sql
 * pero cross-proyecto (via supabase-js en vez de SQL directo, porque el
 * origen y el destino son proyectos Supabase distintos).
 *
 * Uso: npx tsx scripts/migrate-legacy-pets-to-staging.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const pets = JSON.parse(readFileSync("C:/Users/JORGEC~1/AppData/Local/Temp/prod-pets.json", "utf-8"));
console.log(`Pets legacy encontrados: ${pets.length}`);

const eligible = pets.filter((p) => p.pet_type === "dog" || p.pet_type === "cat");
console.log(`Con especie reconocible (dog/cat): ${eligible.length}`);
if (!APPLY) { console.log("Dry run - usa --apply."); process.exit(0); }

// Solo migrar si el owner ya tiene profile en staging (creado por el backfill de usuarios)
const ownerIds = [...new Set(eligible.map((p) => p.owner_id))];
const { data: existingProfiles } = await supabase.from("profiles").select("id").in("id", ownerIds);
const validOwners = new Set((existingProfiles ?? []).map((p) => p.id));

const PET_APPROVAL_MAP = { approved: "approved", rejected: "rejected" };

let ok = 0, skippedNoOwner = 0, err = 0;
for (const p of eligible) {
  if (!validOwners.has(p.owner_id)) { skippedNoOwner++; continue; }
  const gallery = [p.photo2_url, p.photo3_url, p.photo4_url, p.photo5_url].filter(Boolean);
  const { error } = await supabase.from("pets").upsert({
    id: p.id,
    user_id: p.owner_id,
    name: p.name,
    species: p.pet_type,
    breed: p.breed,
    sex: p.gender,
    birth_date: p.birth_date,
    coat_color: p.coat_color,
    photo_url: p.primary_photo_url,
    gallery_photos: gallery,
    is_senior: p.is_senior ?? false,
    vet_certificate_url: p.vet_certificate_url,
    approval_status: PET_APPROVAL_MAP[p.status] ?? "pending",
    is_active: p.is_active ?? true,
    is_adopted: p.is_adopted ?? false,
    adoption_story: p.adoption_story,
    waiting_period_end_date: p.waiting_period_end ? p.waiting_period_end.slice(0, 10) : null,
    created_at: p.created_at,
  });
  if (error) { console.error(`pet ${p.id}:`, error.message); err++; } else ok++;
}
console.log({ ok, skippedNoOwner, err });
