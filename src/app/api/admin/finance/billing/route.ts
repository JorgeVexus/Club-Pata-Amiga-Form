import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

// Inicializar cliente con Service Role para acceso administrativo
const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) return null;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function GET(request: NextRequest) {
    const supabase = getServiceRoleClient();
    
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    try {
        // ── FETCH MEMBERSTACK DATA FOR AMOUNT ENRICHMENT ──
        const msAmounts = new Map<string, number>();
        try {
            const msResult = await memberstackAdmin.listMembers(undefined, { paidOnly: true });
            if (msResult.success && msResult.data) {
                msResult.data.forEach(member => {
                    // Extract amount from the first active plan
                    const plan = member.planConnections?.[0];
                    if (plan) {
                        const amount = plan.payment?.amount || 0;
                        msAmounts.set(member.id, amount);
                    }
                });
            }
        } catch (msErr) {
            console.error('❌ Error pre-fetching Memberstack amounts:', msErr);
        }

        // Fetch billing details joined with user information
        const { data, error } = await supabase
            .from('billing_details')
            .select(`
                *,
                users:user_id (
                    first_name,
                    last_name,
                    mother_last_name,
                    email,
                    memberstack_id
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching all billing details:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data for easier consumption
        const billingRecords = data.map((record: any) => {
            const msId = record.users?.memberstack_id;
            const totalAmount = msAmounts.get(msId) || 0;

            return {
                id: record.id,
                rfc: record.rfc,
                businessName: record.business_name,
                zipCode: record.zip_code,
                taxRegime: record.tax_regime,
                cfdiUse: record.cfdi_use,
                updatedAt: record.updated_at,
                totalAmount: totalAmount,
                user: {
                    fullName: `${record.users?.first_name || ''} ${record.users?.last_name || ''} ${record.users?.mother_last_name || ''}`.trim(),
                    email: record.users?.email,
                    memberstackId: msId
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: billingRecords
        });

    } catch (error: any) {
        console.error('Unexpected error in billing API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
