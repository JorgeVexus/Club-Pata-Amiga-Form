const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
    console.error('.env.local does not exist!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

console.log('Parsed keys:', Object.keys(env));
console.log('NEXT_PUBLIC_SUPABASE_URL key present:', !!env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY key present:', !!env.SUPABASE_SERVICE_ROLE_KEY);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Columns in users:', Object.keys(data[0] || {}));
    }
}

main();
