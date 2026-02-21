
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

async function generateBackfillSQL() {
    console.error('🚀 Starting generation...');
    const { data: ambassadors } = await supabase.from('ambassadors').select('id, email, first_name, paternal_surname, created_at');
    console.error(`Found ${ambassadors.length} ambassadors.`);

    const folders = await getAllFolders();
    console.error(`Found ${folders.length} folders.`);

    process.stdout.write('-- ============================================\n');
    process.stdout.write('-- 🎯 BACKFILL: URLs de INE para Embajadores\n');
    process.stdout.write('-- Fecha: 2026-02-21\n');
    process.stdout.write('-- ============================================\n\n');
    process.stdout.write('BEGIN;\n');

    for (const amb of ambassadors) {
        const ambTs = new Date(amb.created_at).getTime();
        console.error(`Checking: ${amb.first_name} | TS: ${ambTs}`);

        let bestMatch = null;
        let minDiff = Infinity;

        for (const f of folders) {
            if (f.name.startsWith('temp_')) {
                const folderTs = parseInt(f.name.split('_')[1]);
                const diff = Math.abs(ambTs - folderTs);
                if (diff < 600000) { // 10 minutes window
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestMatch = f;
                    }
                }
            }
        }

        if (bestMatch) {
            console.error(`  Match found: ${bestMatch.name} (Diff: ${Math.round(minDiff / 1000)}s)`);
            const { data: files } = await supabase.storage.from('ine-documents').list(bestMatch.name);
            console.error(`    Files in folder: ${files?.length || 0}`);

            if (files && files.length >= 2) {
                const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
                const frontFile = sortedFiles[0];
                const backFile = sortedFiles[1];

                const frontUrl = supabase.storage.from('ine-documents').getPublicUrl(`${bestMatch.name}/${frontFile.name}`).data.publicUrl;
                const backUrl = supabase.storage.from('ine-documents').getPublicUrl(`${bestMatch.name}/${backFile.name}`).data.publicUrl;

                process.stdout.write(`\n-- Embajador: ${amb.first_name} ${amb.paternal_surname} (${amb.email})\n`);
                process.stdout.write(`UPDATE public.ambassadors \n`);
                process.stdout.write(`SET ine_front_url = '${frontUrl}',\n`);
                process.stdout.write(`    ine_back_url = '${backUrl}'\n`);
                process.stdout.write(`WHERE id = '${amb.id}';\n`);
            } else {
                console.error(`    ⚠️ Not enough files in folder ${bestMatch.name}`);
            }
        } else {
            console.error(`  ❌ No match for ${amb.first_name}`);
        }
    }

    process.stdout.write('\nCOMMIT;\n');
}

generateBackfillSQL();
