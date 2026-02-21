
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllCandidateFolders() {
    const folders = [
        'temp_1771616118251',
        'temp_1771616093682',
        'temp_1771608994872',
        'temp_1771608405767',
        'temp_1771608194220',
        'temp_1771541130263',
        'temp_1771213806115',
        'temp_1771102456777',
        'temp_1771101605769',
        'temp_1771101437341',
        'temp_1771101195285',
        'temp_1771100832581',
        'temp_1771100233827',
        'temp_1771098449021',
        'temp_1771096823277',
        'temp_1771082107754',
        'temp_1771049141331',
        'temp_1771033517510',
        'temp_1771019207338',
        'temp_1771016391669',
        'temp_1771013999096',
        'temp_1771010800020'
    ];

    for (const f of folders) {
        const { data: files } = await supabase.storage.from('ine-documents').list(f);
        if (files && files.length > 0) {
            console.log(`\nFolder: ${f} (${new Date(parseInt(f.split('_')[1])).toISOString()})`);
            files.forEach(file => {
                const url = supabase.storage.from('ine-documents').getPublicUrl(`${f}/${file.name}`).data.publicUrl;
                console.log(`  - ${file.name} -> ${url}`);
            });
        }
    }
}

inspectAllCandidateFolders();
