
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAmbassadorsFoldersRecursive() {
    console.log('🔍 Checking for folders inside ambassadors/ in all likely buckets...');
    const buckets = ['ine-documents', 'documents', 'legal-documents'];

    for (const b of buckets) {
        console.log(`\nBucket: ${b}`);
        const { data: items } = await supabase.storage.from(b).list('ambassadors', { limit: 100 });
        if (items && items.length > 0) {
            console.log(`  Found ${items.length} items in ambassadors/ folder:`);
            items.forEach(i => console.log(`    - ${i.name} (${i.id ? 'FILE' : 'FOLDER'})`));
        } else {
            console.log('  No ambassadors/ folder or it is empty.');
        }
    }
}

listAmbassadorsFoldersRecursive();
