import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Fetch all users with admin or super_admin role
        const { data: admins, error } = await supabase
            .from('users')
            .select('memberstack_id, email, full_name, role, created_at')
            .in('role', ['admin', 'super_admin'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching admins:', error);
            return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            admins: admins || []
        });

    } catch (error: any) {
        console.error('Error in /api/admin/admins:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
