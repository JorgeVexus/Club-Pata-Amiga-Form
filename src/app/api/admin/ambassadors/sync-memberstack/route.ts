import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const MEMBERSTACK_API_URL = 'https://admin.memberstack.com/members';

async function updateMemberstackField(memberId: string, customFields: Record<string, string | boolean>) {
    if (!MEMBERSTACK_SECRET_KEY) return false;
    try {
        const response = await fetch(`${MEMBERSTACK_API_URL}/${memberId}`, {
            method: 'PATCH',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customFields })
        });
        return response.ok;
    } catch (error) {
        console.error('Error in sync updateMemberstackField:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Fetch all approved ambassadors with a linked memberstack id
        const { data: ambassadors, error } = await supabase
            .from('ambassadors')
            .select('email, linked_memberstack_id')
            .eq('status', 'approved')
            .not('linked_memberstack_id', 'is', null);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const results = {
            total: ambassadors?.length || 0,
            success: 0,
            failed: 0,
            skipped: 0
        };

        if (ambassadors && ambassadors.length > 0) {
            for (const amb of ambassadors) {
                if (amb.linked_memberstack_id) {
                    const ok = await updateMemberstackField(amb.linked_memberstack_id, { 'is-ambassador': 'true' });
                    if (ok) {
                        results.success++;
                    } else {
                        results.failed++;
                        console.warn(`Failed to sync ambassador ${amb.email}`);
                    }
                } else {
                    results.skipped++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sincronización completada: ${results.success} exitosos, ${results.failed} fallidos.`,
            results
        });

    } catch (error) {
        console.error('Ambassador sync error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
