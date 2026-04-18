const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPetsAge() {
    console.log('🔍 Checking pets age in database...');
    
    const { data: pets, error } = await supabase
        .from('pets')
        .select('id, name, age, breed, owner_id')
        .limit(10);

    if (error) {
        console.error('❌ Error fetching pets:', error);
        return;
    }

    if (!pets || pets.length === 0) {
        console.log('⚠️ No pets found in database.');
        return;
    }

    console.table(pets);
    
    // Also check if any have null age
    const { count, error: countError } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .is('age', null);
        
    if (!countError) {
        console.log(`\n📊 Total pets with NULL age: ${count}`);
    }
}

checkPetsAge();
