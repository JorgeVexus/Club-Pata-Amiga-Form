const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const cleanValue = value.trim().replace(/^['"]|['"]$/g, '');
        env[key.trim()] = cleanValue;
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- Debugging Solidarity Documents ---');
    console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
    
    const { data: docs, error } = await supabase
        .from('solidarity_documents')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching docs:', error);
        return;
    }

    console.log(`Found ${docs.length} documents.`);
    for (const doc of docs) {
        console.log(`\nDoc ID: ${doc.id}`);
        console.log(`File Name: ${doc.file_name}`);
        console.log(`File Path: ${doc.file_path}`);
        
        const { data: signed, error: signError } = await supabase.storage
            .from('solidarity-documents')
            .createSignedUrl(doc.file_path, 3600);
            
        if (signError) {
            console.error('Signing error:', signError);
        } else {
            console.log('Signed URL generated successfully.');
            console.log('URL start:', signed.signedUrl.substring(0, 50) + '...');
        }
    }
}

debug();
