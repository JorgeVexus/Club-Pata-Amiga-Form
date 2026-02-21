
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAmbassadors() {
    console.log('🔍 Checking ambassadors table...');
    const { data: ambassadors, error } = await supabase
        .from('ambassadors')
        .select('email, first_name, ine_front_url, ine_back_url, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching ambassadors:', error);
        return;
    }

    console.log(`Found ${ambassadors.length} ambassadors.`);
    ambassadors.forEach(a => {
        console.log(`- ${a.first_name} (${a.email}) | Front: ${a.ine_front_url ? 'YES' : 'NO'} | Back: ${a.ine_back_url ? 'YES' : 'NO'} | Created: ${a.created_at}`);
    });
}

checkAmbassadors();
