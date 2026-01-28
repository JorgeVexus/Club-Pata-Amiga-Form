'use server';

import { createClient } from '@supabase/supabase-js';

const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

type ValidationType = 'curp' | 'rfc';

export async function checkAmbassadorAvailability(type: ValidationType, value: string) {
    if (!value) return { available: true };
    const supabase = getServiceRoleClient();
    if (!supabase) return { available: true, error: 'config_error' };

    const cleanValue = value.trim().toUpperCase();

    try {
        // 1. Check in ambassadors table (both CURP and RFC)
        const { count: countAmbassadors, error: errorAmbassadors } = await supabase
            .from('ambassadors')
            .select('id', { count: 'exact', head: true })
            .eq(type, cleanValue);

        if (errorAmbassadors) {
            console.error(`Error checking ambassador ${type}:`, errorAmbassadors);
            return { available: true, error: errorAmbassadors.message };
        }

        if (countAmbassadors && countAmbassadors > 0) {
            return { available: false, source: 'ambassadors' };
        }

        // 2. If it's CURP, also check in users table
        if (type === 'curp') {
            const { count: countUsers, error: errorUsers } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('curp', cleanValue);

            if (errorUsers) {
                console.error('Error checking user CURP:', errorUsers);
                return { available: true, error: errorUsers.message };
            }

            if (countUsers && countUsers > 0) {
                return { available: false, source: 'users' };
            }
        }

        return { available: true };

    } catch (error) {
        console.error('Unexpected check error:', error);
        return { available: true, error: 'unknown' };
    }
}
