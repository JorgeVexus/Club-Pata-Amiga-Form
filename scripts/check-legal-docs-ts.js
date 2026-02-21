
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listLegalDocsWithTimestamps() {
    console.log('🔍 Listing legal-documents...');
    const { data: items } = await supabase.storage.from('legal-documents').list('', { limit: 1000 });

    items?.forEach(i => {
        const ts = parseInt(i.name.split('_')[0]);
        const date = new Date(ts).toISOString();
        console.log(`- ${i.name} | Detected Date: ${date} | Original: ${i.created_at}`);
    });
}

listLegalDocsWithTimestamps();
