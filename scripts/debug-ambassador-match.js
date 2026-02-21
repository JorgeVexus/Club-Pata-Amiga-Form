
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMatch() {
    const { data: ambassadors } = await supabase.from('ambassadors').select('email, first_name, created_at');
    const { data: folders } = await supabase.storage.from('ine-documents').list('', { limit: 1000 });

    ambassadors.forEach(amb => {
        const ambTs = new Date(amb.created_at).getTime();
        console.log(`Ambassador: ${amb.first_name} | CreatedAt: ${amb.created_at} | TS: ${ambTs}`);

        folders.forEach(f => {
            if (f.name.startsWith('temp_')) {
                const folderTs = parseInt(f.name.split('_')[1]);
                const diff = Math.abs(ambTs - folderTs);
                if (diff < 300000) { // 5 minutes window for debug
                    console.log(`  Match candidate: ${f.name} | TS: ${folderTs} | Diff: ${diff}ms`);
                }
            }
        });
    });
}

debugMatch();
