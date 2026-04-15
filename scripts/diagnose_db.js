const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log('--- Checking appeal_logs ---');
        const { data: appealLogs, error: appealLogsError } = await supabase
            .from('appeal_logs')
            .select('*')
            .limit(1);
        
        if (appealLogsError) {
            console.error('Error appeal_logs:', appealLogsError.message);
        } else {
            console.log('appeal_logs exists.');
            if (appealLogs.length > 0) {
                console.log('Columns found in sample:', Object.keys(appealLogs[0]));
            } else {
                console.log('Table is empty, trying to get column names via RPC or error message...');
                // Try to insert a dummy record to see what it complains about (if missing columns)
                const { error: insertError } = await supabase.from('appeal_logs').insert({ id: '00000000-0000-0000-0000-000000000000' });
                if (insertError) console.log('Insert error detail:', insertError.message);
            }
        }

        console.log('\n--- Checking notifications ---');
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .limit(1);
        
        if (notificationsError) {
            console.error('Error notifications:', notificationsError.message);
        } else {
            console.log('notifications exists.');
            if (notifications.length > 0) {
                console.log('Columns found in sample:', Object.keys(notifications[0]));
            } else {
                console.log('Table is empty.');
            }
        }

        console.log('\n--- Checking pets structure ---');
        const { data: pets, error: petsError } = await supabase
            .from('pets')
            .select('*')
            .limit(1);
        
        if (petsError) {
            console.error('Error pets:', petsError.message);
        } else {
            console.log('pets columns:', Object.keys(pets[0] || {}));
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkSchema();
