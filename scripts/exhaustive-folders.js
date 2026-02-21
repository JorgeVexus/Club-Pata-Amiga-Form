
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFoldersRecursive(bucket, path = '') {
    const { data: items, error } = await supabase.storage.from(bucket).list(path, { limit: 100 });
    if (error) return;

    for (const i of items) {
        if (!i.id) { // Folder
            const subPath = path ? `${path}/${i.name}` : i.name;
            console.log(`Folder: ${bucket}/${subPath}`);
            await listFoldersRecursive(bucket, subPath);
        }
    }
}

async function run() {
    const buckets = ['ine-documents', 'pet-photos', 'proof-of-address'];
    for (const b of buckets) {
        console.log(`\n--- Bucket: ${b} ---`);
        await listFoldersRecursive(b);
    }
}

run();
