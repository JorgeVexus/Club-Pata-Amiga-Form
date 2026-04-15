import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    console.log('--- Checking appeal_logs ---');
    const { data: appealLogs, error: appealLogsError } = await supabase
        .from('appeal_logs')
        .select('*')
        .limit(1);
    
    if (appealLogsError) {
        console.error('Error appeal_logs:', appealLogsError.message);
    } else {
        console.log('appeal_logs exists. Columns found in sample:', Object.keys(appealLogs[0] || {}));
    }

    console.log('\n--- Checking notifications ---');
    const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);
    
    if (notificationsError) {
        console.error('Error notifications:', notificationsError.message);
    } else {
        console.log('notifications exists. Columns found in sample:', Object.keys(notifications[0] || {}));
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
}

checkSchema();
