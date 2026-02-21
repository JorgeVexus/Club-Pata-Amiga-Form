
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAmbassadorsFolder() {
    const { data: buckets } = await supabase.storage.listBuckets();

    for (const b of buckets) {
        console.log(`Checking bucket: ${b.name}`);
        const { data: items } = await supabase.storage.from(b.name).list('', { limit: 1000 });
        const found = items?.find(i => i.name.toLowerCase() === 'ambassadors');
        if (found) {
            console.log(` ✅ FOUND 'ambassadors' FOLDER IN BUCKET: ${b.name}`);
            const { data: files } = await supabase.storage.from(b.name).list('ambassadors', { limit: 1000 });
            console.log(`   It has ${files?.length || 0} files.`);
            files?.slice(0, 5).forEach(f => console.log(`     - ${f.name}`));
        }
    }
}

findAmbassadorsFolder();
