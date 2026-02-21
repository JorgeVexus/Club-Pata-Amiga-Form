
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listRecentFiles() {
    console.log('🔍 Listing all folders in ine-documents...');
    const { data: folders } = await supabase.storage.from('ine-documents').list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    for (const folder of folders) {
        if (!folder.id) { // It's a folder
            const { data: files } = await supabase.storage.from('ine-documents').list(folder.name, { limit: 100 });
            if (files && files.length > 0) {
                console.log(`Folder: ${folder.name} | Files: ${files.length} | First file created: ${files[0].created_at}`);
                files.forEach(f => {
                    console.log(`  - ${f.name} (${f.created_at})`);
                });
            }
        }
    }
}

listRecentFiles();
