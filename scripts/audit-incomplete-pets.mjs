import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const { getMissingCompletePetFields } = require('../src/utils/pet-required-fields.js');

function loadLocalEnv() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { emails: [], all: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--all') {
      result.all = true;
      continue;
    }

    if (arg === '--emails') {
      const value = args[index + 1] || '';
      result.emails.push(
        ...value
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      );
      index += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      result.emails.push(arg.trim().toLowerCase());
    }
  }

  result.emails = [...new Set(result.emails)];
  return result;
}

function printUsage() {
  console.error('Uso: node scripts/audit-incomplete-pets.mjs --all');
  console.error('   o: node scripts/audit-incomplete-pets.mjs --emails correo1@x.com,correo2@x.com');
}

loadLocalEnv();

const { emails, all } = parseArgs(process.argv);
if (!all && emails.length === 0) {
  printUsage();
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userColumns = 'id, email, memberstack_id, membership_status';
const petColumns = 'id, owner_id, name, pet_type, age_value, age_unit, gender, breed, is_mixed_breed, coat_color, status, is_active, created_at';

async function loadUsersByEmails(targetEmails) {
  const { data, error } = await supabase
    .from('users')
    .select(userColumns)
    .in('email', targetEmails);

  if (error) throw error;
  return data || [];
}

async function loadAllActiveUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(userColumns)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function loadPetsByOwnerIds(ownerIds) {
  if (!ownerIds.length) return [];

  const { data, error } = await supabase
    .from('pets')
    .select(petColumns)
    .in('owner_id', ownerIds)
    .neq('status', 'unsubscribed')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

const users = all ? await loadAllActiveUsers() : await loadUsersByEmails(emails);

if (users.length === 0) {
  console.log('No se encontraron usuarios para los criterios indicados.');
  process.exit(0);
}

const pets = await loadPetsByOwnerIds(users.map((user) => user.id));
const userById = new Map(users.map((user) => [user.id, user]));

const findings = pets
  .map((pet) => {
    const owner = userById.get(pet.owner_id);
    const missingFields = getMissingCompletePetFields(pet);

    return {
      pet,
      owner,
      missingFields,
    };
  })
  .filter(({ owner, pet, missingFields }) => owner && pet.is_active !== false && missingFields.length > 0);

if (findings.length === 0) {
  console.log('No se encontraron mascotas activas con campos obligatorios faltantes.');
  process.exit(0);
}

for (const { owner, pet, missingFields } of findings) {
  console.log(JSON.stringify({
    email: owner.email,
    memberstackId: owner.memberstack_id,
    membershipStatus: owner.membership_status,
    petId: pet.id,
    petName: pet.name,
    petStatus: pet.status,
    createdAt: pet.created_at,
    missingFields,
  }));
}

console.log(`Total mascotas incompletas: ${findings.length}`);
