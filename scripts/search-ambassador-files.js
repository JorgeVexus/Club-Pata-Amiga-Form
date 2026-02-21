
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchAmbassadorFiles() {
    console.log('🔍 Searching for ambassador_ files in all buckets...');
    const { data: buckets } = await supabase.storage.listBuckets();

    for (const b of buckets) {
        console.log(`\nChecking bucket: ${b.name}`);
        // List recursively if possible, or check root and common folders
        const { data: items } = await supabase.storage.from(b.name).list('', { limit: 1000 });

        const ambassadorFiles = items?.filter(i => i.name.includes('ambassador'));
        if (ambassadorFiles && ambassadorFiles.length > 0) {
            console.log(` ✅ Found ${ambassadorFiles.length} ambassador files in root of ${b.name}:`);
            ambassadorFiles.forEach(f => console.log(`  - ${f.name}`));
        }

        const folders = items?.filter(i => !i.id);
        for (const folder of (folders || [])) {
            const { data: subItems } = await supabase.storage.from(b.name).list(folder.name, { limit: 1000 });
            const subAmbassadorFiles = subItems?.filter(i => i.name.includes('ambassador'));
            if (subAmbassadorFiles && subAmbassadorFiles.length > 0) {
                console.log(` ✅ Found ${subAmbassadorFiles.length} ambassador files in ${b.name}/${folder.name}:`);
                subAmbassadorFiles.forEach(f => console.log(`  - ${f.name}`));
            }
        }
    }
}

searchAmbassadorFiles();
