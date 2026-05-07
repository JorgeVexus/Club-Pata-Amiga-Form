import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'memberstackId requerido' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .select([
                'memberstack_id', 'first_name', 'last_name', 'mother_last_name',
                'email', 'phone', 'street', 'ext_number', 'int_number', 'colony',
                'city', 'state', 'postal_code', 'birth_date', 'profile_photo_url',
                'approval_status', 'registration_date', 'plan_name', 'plan_type',
                'next_payment_date', 'plan_cost', 'stripe_customer_id'
            ].join(','))
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (error) {
            console.error('[PROFILE GET] Supabase error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: data });

    } catch (e: any) {
        console.error('[PROFILE GET] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
