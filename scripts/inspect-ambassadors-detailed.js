
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAmbassadorsDetailed() {
    const { data: ambassadors } = await supabase
        .from('ambassadors')
        .select('id, email, first_name, created_at, linked_memberstack_id');

    console.log('Ambassadors:');
    ambassadors.forEach(a => {
        console.log(`${a.first_name} | ${a.email} | Created: ${a.created_at} | MS ID: ${a.linked_memberstack_id || 'None'}`);
    });
}

inspectAmbassadorsDetailed();
