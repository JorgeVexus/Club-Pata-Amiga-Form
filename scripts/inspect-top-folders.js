
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTopFoldersDetailed() {
    const folders = [
        'temp_1771616118251',
        'temp_1771616093682',
        'temp_1771608994872',
        'temp_1771608405767',
        'temp_1771608194220'
    ];

    for (const f of folders) {
        console.log(`\nFolder: ${f} (${new Date(parseInt(f.split('_')[1])).toISOString()})`);
        const { data: files } = await supabase.storage.from('ine-documents').list(f);
        files?.forEach(file => {
            const url = supabase.storage.from('ine-documents').getPublicUrl(`${f}/${file.name}`).data.publicUrl;
            console.log(`  - ${file.name} -> ${url}`);
        });
    }
}

inspectTopFoldersDetailed();
