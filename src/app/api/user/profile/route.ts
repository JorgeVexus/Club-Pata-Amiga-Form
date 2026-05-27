import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

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
                'id', 'memberstack_id', 'first_name', 'last_name', 'mother_last_name',
                'email', 'phone', 'address', 'colony',
                'city', 'state', 'postal_code', 'birth_date', 'avatar_url',
                'membership_status', 'approval_status', 'created_at', 'is_foreigner', 'role',
                'curp', 'gender', 'nationality', 'nationality_code',
                'ine_front_url', 'ine_back_url', 'proof_of_address_url'
            ].join(','))
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (error) {
            console.error('[PROFILE GET] Supabase error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!data) {
            console.warn(`[PROFILE GET] Usuario no encontrado: ${memberstackId}`);
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        console.log(`[PROFILE GET] Datos recuperados para ${memberstackId}. avatar_url: ${(data as any).avatar_url || 'null'}`);
        return NextResponse.json({ success: true, user: data });

    } catch (e: any) {
        console.error('[PROFILE GET] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
