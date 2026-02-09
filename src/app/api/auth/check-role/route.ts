import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { AdminAuthService } from '@/services/admin-auth.service';

// ... imports remain ...

export async function POST(request: NextRequest) {
    try {
        const { memberstackId } = await request.json();

        if (!memberstackId) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
        }

        // 1. Check if user is Admin/SuperAdmin
        // Usamos el cliente con SERVICE_ROLE para bypass RLS, ya que AdminAuthService usa el cliente público
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        const adminRole = user?.role;

        if (adminRole === 'admin' || adminRole === 'super_admin') {
            return NextResponse.json({
                success: true,
                role: 'admin',
                adminType: adminRole
            });
        }

        // 2. Check if user is an Ambassador
        const { data: ambassador } = await supabase
            .from('ambassadors')
            .select('id, status')
            .eq('linked_memberstack_id', memberstackId)
            .eq('linked_memberstack_id', memberstackId)
            .maybeSingle();

        if (ambassador && ambassador.status !== 'rejected' && ambassador.status !== 'suspended') {
            console.log(`🔍 [Check-Role] Embajador encontrado para ID ${memberstackId}:`, ambassador);
            return NextResponse.json({
                success: true,
                role: 'ambassador',
                status: ambassador.status
            });
        }

        console.log(`ℹ️ [Check-Role] No es embajador activo (Status: ${ambassador?.status})`);

        return NextResponse.json({
            success: true,
            role: 'member'
        });

    } catch (error) {
        console.error('Check Role Error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
