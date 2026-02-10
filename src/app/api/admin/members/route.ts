import { NextRequest, NextResponse } from 'next/server';
import { listPendingMembers, listAppealedMembers, memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

// Usar Service Role para poder consultar roles de otros usuarios y filtrar admins
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        // USAMOS el cliente admin (Service Role) para saltar RLS
        const { data: adminUsers, error: adminError } = await supabaseAdmin
            .from('users')
            .select('memberstack_id')
            .in('role', ['admin', 'super_admin']);

        if (adminError) {
            console.error('Error fetching admin users:', adminError);
        }

        const adminMemberstackIds = new Set(adminUsers?.map(u => u.memberstack_id) || []);

        // Filter out admins from the member list
        const filteredMembers = result.data?.filter(member => !adminMemberstackIds.has(member.id)) || [];

        // ENRICHMENT: Fetch real pet counts from Supabase
        // 1. Get mapping of Memberstack ID -> Supabase User ID
        const memberstackIds = filteredMembers.map(m => m.id);

        let petCountsMap = new Map<string, number>();

        if (memberstackIds.length > 0) {
            // Get Supabase User IDs
            const { data: userMappings, error: mappingError } = await supabaseAdmin
                .from('users')
                .select('id, memberstack_id')
                .in('memberstack_id', memberstackIds);

            if (!mappingError && userMappings) {
                const supabaseUserIds = userMappings.map(u => u.id);
                const supabaseIdToMsId = new Map(userMappings.map(u => [u.id, u.memberstack_id]));

                // Get pet counts
                // Note: verify if .count() works with group by easily in logic or just fetch all pets fields (lightweight)
                // Fetching just owner_id is lighter
                const { data: petsData, error: petsError } = await supabaseAdmin
                    .from('pets')
                    .select('owner_id')
                    .in('owner_id', supabaseUserIds);

                if (!petsError && petsData) {
                    petsData.forEach(pet => {
                        const msId = supabaseIdToMsId.get(pet.owner_id);
                        if (msId) {
                            petCountsMap.set(msId, (petCountsMap.get(msId) || 0) + 1);
                        }
                    });
                }
            }
        }

        // Attach pet counts to members
        const membersWithCounts = filteredMembers.map(member => ({
            ...member,
            petCount: petCountsMap.get(member.id) || 0
        }));

        return NextResponse.json({
            success: true,
            members: membersWithCounts,
            count: membersWithCounts.length,
        });

    } catch (error: any) {
        console.error('Error en GET /api/admin/members:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
