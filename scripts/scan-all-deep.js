
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function scanAllBucketsRootAndSubdirs() {
    const { data: buckets } = await supabase.storage.listBuckets();

    for (const b of buckets) {
        console.log(`\nScanning bucket: ${b.name}`);
        const { data: items } = await supabase.storage.from(b.name).list('', { limit: 1000 });

        items?.forEach(i => {
            if (i.name.toLowerCase().includes('ambassador') || i.name.toLowerCase().includes('emb')) {
                console.log(`  [MATCH] ${i.name} (${i.id ? 'FILE' : 'FOLDER'})`);
            }
        });

        const folders = items?.filter(i => !i.id);
        for (const folder of (folders || [])) {
            const { data: subItems } = await supabase.storage.from(b.name).list(folder.name, { limit: 1000 });
            subItems?.forEach(si => {
                if (si.name.toLowerCase().includes('ambassador') || si.name.toLowerCase().includes('emb')) {
                    console.log(`  [MATCH] ${folder.name}/${si.name} (FILE)`);
                }
            });
        }
    }
}

scanAllBucketsRootAndSubdirs();
