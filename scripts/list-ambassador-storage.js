
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAmbassadorFiles() {
    console.log('🔍 Listing files in documents/ambassadors...');
    
    const { data: files, error } = await supabase.storage
        .from('documents')
        .list('ambassadors', { limit: 1000 });

    if (error) {
        console.error('❌ Error listing files:', error);
        return;
    }

    console.log(`Found ${files.length} items.`);

    files.forEach(f => {
        const publicUrl = supabase.storage.from('documents').getPublicUrl(`ambassadors/${f.name}`).data.publicUrl;
        console.log(`- ${f.name} -> ${publicUrl}`);
    });
}

listAmbassadorFiles();
