
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

async function checkSchema() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const results = {};

    // Get table definitions via RPC or SQL if possible. 
    // Since I can't run arbitrary SQL easily without a specific RPC, 
    // I'll try to query information_schema via a trick or just list all tables first.

    const { data: tables, error: tableError } = await supabase.from('users').select('*').limit(0);
    // Actually, I'll just check if I can get the list of columns for 'users' and 'documents' again, 
    // but I'll use a user that I KNOW has data if I can find one.

    // Better: Query the 'documents' table's first record properly.
    const { data: docsData, error: docsError } = await supabase.from('documents').select('*').limit(1);

    results.docs_error = docsError;
    if (docsData) {
        results.docs_count = docsData.length;
        if (docsData.length > 0) results.docs_columns = Object.keys(docsData[0]);
    }

    // List all users to see if I find one with data
    const { data: allUsers } = await supabase.from('users').select('id, memberstack_id, email').limit(5);
    results.sample_users = allUsers;

    fs.writeFileSync('scripts/db-schema-v2.json', JSON.stringify(results, null, 2));
    console.log('✅ Results saved to scripts/db-schema-v2.json');
}

checkSchema();
