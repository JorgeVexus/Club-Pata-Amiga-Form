
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllFolders() {
    let allFolders = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const { data, error } = await supabase.storage
            .from('ine-documents')
            .list('', { limit, offset });

        if (error) {
            console.error('Error listing folders:', error);
            break;
        }

        if (!data || data.length === 0) break;

        const folders = data.filter(i => !i.id);
        allFolders = allFolders.concat(folders);

        if (data.length < limit) break;
        offset += limit;
    }

    return allFolders;
}

async function matchAmbassadors() {
    const { data: ambassadors } = await supabase.from('ambassadors').select('email, first_name, created_at');
    const folders = await getAllFolders();

    console.log(`Matching ${ambassadors.length} ambassadors with ${folders.length} folders...`);

    const results = [];

    ambassadors.forEach(amb => {
        const ambTs = new Date(amb.created_at).getTime();
        let bestMatch = null;
        let minDiff = Infinity;

        folders.forEach(f => {
            if (f.name.startsWith('temp_')) {
                const folderTs = parseInt(f.name.split('_')[1]);
                const diff = Math.abs(ambTs - folderTs);
                if (diff < 300000) { // 5 minutes window
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestMatch = f;
                    }
                }
            }
        });

        if (bestMatch) {
            results.push({ amb, folder: bestMatch, diff: minDiff });
        }
    });

    for (const r of results) {
        const { data: files } = await supabase.storage.from('ine-documents').list(r.folder.name);
        console.log(`Ambassador: ${r.amb.first_name} (${r.amb.email})`);
        console.log(`  Folder: ${r.folder.name} (Diff: ${Math.round(r.diff / 1000)}s)`);
        files?.forEach(f => {
            const url = supabase.storage.from('ine-documents').getPublicUrl(`${r.folder.name}/${f.name}`).data.publicUrl;
            console.log(`    - ${f.name} -> ${url}`);
        });
    }
}

matchAmbassadors();
