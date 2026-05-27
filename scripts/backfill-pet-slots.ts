import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log('🔄 Starting backfill of memberstack_slot for all pets...');

  // 1. Fetch all pets from Supabase ordered by created_at and id
  const { data: pets, error } = await supabase
    .from('pets')
    .select('*')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching pets:', error);
    return;
  }

  if (!pets || pets.length === 0) {
    console.log('⚠️ No pets found in database.');
    return;
  }

  console.log(`📋 Total pets found: ${pets.length}`);

  // 2. Group pets by owner_id
  const petsByOwner: Record<string, typeof pets> = {};
  for (const pet of pets) {
    if (!pet.owner_id) continue;
    if (!petsByOwner[pet.owner_id]) {
      petsByOwner[pet.owner_id] = [];
    }
    petsByOwner[pet.owner_id].push(pet);
  }

  console.log(`👥 Total pet owners found: ${Object.keys(petsByOwner).length}`);

  let updatedCount = 0;
  let alreadyCorrectCount = 0;

  // 3. For each owner, update memberstack_slot to index + 1
  for (const [ownerId, ownerPets] of Object.entries(petsByOwner)) {
    console.log(`\n👤 Owner ID: ${ownerId} (${ownerPets.length} pets)`);
    
    // Sort just to be absolutely certain (it's already sorted by query, but good to be explicit)
    const sortedPets = [...ownerPets].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });

    for (let index = 0; index < sortedPets.length; index++) {
      const pet = sortedPets[index];
      const expectedSlot = index + 1;

      if (pet.memberstack_slot === expectedSlot) {
        console.log(`  ✅ Pet "${pet.name}" (ID: ${pet.id}) already has correct slot: ${pet.memberstack_slot}`);
        alreadyCorrectCount++;
        continue;
      }

      console.log(`  🔧 Updating Pet "${pet.name}" (ID: ${pet.id}) slot: ${pet.memberstack_slot} -> ${expectedSlot}`);

      const { error: updateError } = await supabase
        .from('pets')
        .update({ memberstack_slot: expectedSlot })
        .eq('id', pet.id);

      if (updateError) {
        console.error(`  ❌ Error updating pet ${pet.id}:`, updateError.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log('\n========================================');
  console.log('🎉 Backfill completed!');
  console.log(`✅ Already correct: ${alreadyCorrectCount}`);
  console.log(`🔧 Updated: ${updatedCount}`);
  console.log('========================================');
}

backfill();
