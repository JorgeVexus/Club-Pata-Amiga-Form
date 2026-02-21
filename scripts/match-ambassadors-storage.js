
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function matchAmbassadorsToStorage() {
    console.log('🚀 Matching ambassadors to storage folders...');

    // 1. Get ambassadors
    const { data: ambassadors } = await supabase
        .from('ambassadors')
        .select('email, first_name, created_at')
        .order('created_at', { ascending: false });

    // 2. Get folders in ine-documents
    const { data: folders } = await supabase.storage
        .from('ine-documents')
        .list('', { limit: 1000 });

    console.log(`Analyzing ${ambassadors.length} ambassadors and ${folders.length} folders...`);

    const matches = [];

    for (const amb of ambassadors) {
        const ambDate = new Date(amb.created_at);
        const ambTs = ambDate.getTime();

        // Look for folders created within 2 minutes of the ambassador registration
        // Note: folders items from list() don't have created_at in the item itself usually, 
        // but the folder name "temp_12345678" contains the timestamp.

        let bestMatch = null;
        let minDiff = Infinity;

        for (const f of folders) {
            if (f.name.startsWith('temp_')) {
                const folderTs = parseInt(f.name.split('_')[1]);
                const diff = Math.abs(ambTs - folderTs);

                if (diff < 120000) { // 2 minutes
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestMatch = f;
                    }
                }
            }
        }

        if (bestMatch) {
            matches.push({
                ambassador: amb,
                folder: bestMatch,
                diffSeconds: Math.round(minDiff / 1000)
            });
        }
    }

    console.log('\n✅ Potential Matches:');
    for (const match of matches) {
        const { data: files } = await supabase.storage
            .from('ine-documents')
            .list(match.folder.name);

        console.log(`Ambassador: ${match.ambassador.first_name} (${match.ambassador.email})`);
        console.log(`  Folder: ${match.folder.name} (Diff: ${match.diffSeconds}s)`);
        files.forEach(f => {
            const url = supabase.storage.from('ine-documents').getPublicUrl(`${match.folder.name}/${f.name}`).data.publicUrl;
            console.log(`    - ${f.name} -> ${url}`);
        });
    }
}

matchAmbassadorsToStorage();
