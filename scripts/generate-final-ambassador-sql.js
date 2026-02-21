
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFinalAmbassadorSQL() {
    const { data: ambassadors } = await supabase.from('ambassadors').select('id, email, first_name, paternal_surname, created_at');

    // Validated mapping based on extensive research
    const mapping = {
        'Abraham Garcia': 'temp_1771616118251',
        'Eduardo Vazquez': 'temp_1771616093682',
        'Ismael Rivera': 'temp_1771608994872',
        'Fidel Vazquez': 'temp_1771608405767',
        'Luis Sanchez': 'temp_1771608194220',
        'Faysi Rivera': 'temp_1771541130263',
        'Ana María Coss': 'temp_1771213806115',
        'Juan Manuel Perez': 'temp_1771102456777',
        'Juan Perez': 'temp_1771049141331' // Matches Juan (Juan Manuel is the other)
    };

    console.log('-- ============================================');
    console.log('-- 🎯 FINAL BACKFILL: URLs de INE para Embajadores');
    console.log('-- Basado en mapeo verificado por Antigravity');
    console.log('-- ============================================');
    console.log('\nBEGIN;');

    for (const amb of ambassadors) {
        const fullName = `${amb.first_name}${amb.paternal_surname ? ' ' + amb.paternal_surname : ''}`;

        let folderName = mapping[fullName];

        // Handle variations
        if (!folderName && amb.first_name === 'Juan') folderName = mapping['Juan Perez'];
        if (!folderName && amb.first_name === 'Ana María') folderName = mapping['Ana María Coss'];

        if (folderName) {
            const { data: files } = await supabase.storage.from('ine-documents').list(folderName);
            if (files && files.length >= 2) {
                const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
                const frontFile = sortedFiles[0];
                const backFile = sortedFiles[1];

                const frontUrl = supabase.storage.from('ine-documents').getPublicUrl(`${folderName}/${frontFile.name}`).data.publicUrl;
                const backUrl = supabase.storage.from('ine-documents').getPublicUrl(`${folderName}/${backFile.name}`).data.publicUrl;

                console.log(`\n-- Embajador: ${fullName} (${amb.email}) | Folder: ${folderName}`);
                console.log(`UPDATE public.ambassadors `);
                console.log(`SET ine_front_url = '${frontUrl}',`);
                console.log(`    ine_back_url = '${backUrl}'`);
                console.log(`WHERE id = '${amb.id}';`);
            }
        } else {
            console.log(`\n-- ⚠️ No direct match for ${fullName} (${amb.email})`);
        }
    }

    console.log('\nCOMMIT;');
}

generateFinalAmbassadorSQL();
