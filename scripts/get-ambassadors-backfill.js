
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAmbassadorsForBackfill() {
    const { data: ambassadors } = await supabase
        .from('ambassadors')
        .select('id, email, first_name, paternal_surname, created_at, linked_memberstack_id')
        .order('created_at', { ascending: true });

    console.log('--- ALL AMBASSADORS ---');
    ambassadors.forEach((a, i) => {
        const ts = new Date(a.created_at).getTime();
        console.log(`${i + 1}. ${a.first_name} ${a.paternal_surname} | ${a.email} | Created: ${a.created_at} | TS: ${ts} | MS ID: ${a.linked_memberstack_id || 'N/A'}`);
    });
}

getAmbassadorsForBackfill();
