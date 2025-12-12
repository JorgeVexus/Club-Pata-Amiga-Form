import { NextRequest, NextResponse } from 'next/server';
import { listPendingMembers, listAppealedMembers, memberstackAdmin } from '@/services/memberstack-admin.service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/admin/members?status=pending
 * Lista miembros según su estado de aprobación
 */
export async function GET(request: NextRequest) {
    try {
        // TODO: Validar que el usuario sea admin
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let result;

        if (status === 'pending') {
            result = await listPendingMembers();
        } else if (status === 'appealed') {
            result = await listAppealedMembers();
        } else if (status === 'approved' || status === 'rejected') {
            // Use the generic listMembers method exposed via the singleton
            result = await memberstackAdmin.listMembers(status);
        } else if (!status || status === 'all') {
            // Return all members if no status or 'all'
            result = await memberstackAdmin.listMembers();
        } else {
            return NextResponse.json(
                { error: 'Status inválido. Usa: pending, appealed, approved o rejected' },
                { status: 400 }
            );
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Filter out admin/super_admin users from the results
        const { data: adminUsers, error: adminError } = await supabase
            .from('users')
            .select('memberstack_id')
            .in('role', ['admin', 'super_admin']);

        if (adminError) {
            console.error('Error fetching admin users:', adminError);
        }

        const adminMemberstackIds = new Set(adminUsers?.map(u => u.memberstack_id) || []);

        // Filter out admins from the member list
        const filteredMembers = result.data?.filter(member => !adminMemberstackIds.has(member.id)) || [];

        return NextResponse.json({
            success: true,
            members: filteredMembers,
            count: filteredMembers.length,
        });

    } catch (error: any) {
        console.error('Error en GET /api/admin/members:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
