import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId } = body;

        if (!memberstackId) {
            return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('role, full_name, email, memberstack_id')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (error) {
            console.error('Supabase Error:', error);
        }

        if (!user) {
            console.log(`❌ User not found for ID: ${memberstackId}`);
            // Intento de fallback: buscar por si acaso hay algún problema de espacios/formato
            return NextResponse.json({
                error: 'User not found in database',
                receivedId: memberstackId,
                debugParams: { supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL }
            }, { status: 404 });
        }

        return NextResponse.json({
            role: user.role,
            isSuperAdmin: user.role === 'super_admin',
            isAdmin: user.role === 'admin' || user.role === 'super_admin',
            name: user.full_name,
            email: user.email
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
