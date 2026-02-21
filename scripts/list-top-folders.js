
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTopFolders() {
    const { data: items, error } = await supabase.storage
        .from('ine-documents')
        .list('', { limit: 100 });

    if (error) {
        console.error('Error listing items:', error);
        return;
    }

    const folders = items.filter(i => !i.id);
    console.log(`Top ${folders.length} folders:`);
    folders.forEach(f => {
        console.log(`- ${f.name}`);
    });
}

listTopFolders();
