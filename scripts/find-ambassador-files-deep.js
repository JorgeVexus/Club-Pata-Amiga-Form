
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAmbassadorFilesDeep() {
    const buckets = ['proof-of-address', 'ine-documents', 'pet-photos', 'vet-certificates', 'legal-documents', 'documents'];

    for (const b of buckets) {
        console.log(`Checking bucket: ${b}`);
        const { data: items, error } = await supabase.storage.from(b).list('', { limit: 1000 });

        if (error) {
            console.log(`  Error or bucket not found: ${b}`);
            continue;
        }

        const found = items?.filter(i => i.name.includes('ambassador'));
        if (found && found.length > 0) {
            console.log(`  ✅ FOUND ${found.length} files in root of ${b}`);
            found.forEach(f => console.log(`    - ${f.name}`));
        }

        const folders = items?.filter(i => !i.id);
        for (const folder of (folders || [])) {
            const { data: subItems } = await supabase.storage.from(b).list(folder.name, { limit: 1000 });
            const subFound = subItems?.filter(i => i.name.includes('ambassador'));
            if (subFound && subFound.length > 0) {
                console.log(`  ✅ FOUND ${subFound.length} files in ${b}/${folder.name}`);
                subFound.forEach(f => console.log(`    - ${f.name}`));
            }
        }
    }
}

findAmbassadorFilesDeep();
