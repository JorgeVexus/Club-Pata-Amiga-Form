
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBuckets() {
    console.log('🔍 Listing all buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('❌ Error listing buckets:', error);
        return;
    }
    buckets.forEach(b => console.log(`- ${b.name} (${b.public ? 'public' : 'private'})`));

    console.log('\n🔍 Checking root items in each bucket...');
    for (const b of buckets) {
        const { data: items } = await supabase.storage.from(b.name).list('', { limit: 10 });
        console.log(`Bucket: ${b.name} | Items: ${items?.length || 0}`);
        items?.forEach(i => console.log(`  - ${i.name} (${i.id ? 'file' : 'folder'})`));
    }
}

listAllBuckets();
