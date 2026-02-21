
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFoldersWithTimestamps() {
    console.log('🔍 Listing folders in ine-documents with timestamps...');
    const { data: items, error } = await supabase.storage
        .from('ine-documents')
        .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
        console.error('❌ Error listing items:', error);
        return;
    }

    items.forEach(i => {
        if (!i.id) { // It's a folder
            console.log(`Folder: ${i.name} | Created: ${i.created_at || 'Unknown'}`);
        }
    });

    console.log('\n🔍 Also checking root files in ine-documents...');
    items.forEach(i => {
        if (i.id) {
            console.log(`File: ${i.name} | Created: ${i.created_at}`);
        }
    });
}

listFoldersWithTimestamps();
