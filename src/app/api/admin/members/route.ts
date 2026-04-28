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

        // Por defecto, solo mostrar miembros con plan pagado en el dashboard
        const paidOnly = searchParams.get('paidOnly') !== 'false'; // true por defecto

        if (status === 'pending') {
            result = await listPendingMembers(paidOnly);
        } else if (status === 'appealed') {
            result = await listAppealedMembers(paidOnly);
        } else if (status === 'approved' || status === 'rejected') {
            // Use the generic listMembers method exposed via the singleton
            result = await memberstackAdmin.listMembers(status, { paidOnly });
        } else if (!status || status === 'all') {
            // Return all members if no status or 'all'
            result = await memberstackAdmin.listMembers(undefined, { paidOnly });
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

        console.log(`[API] Member filter: Total fetched ${result.data?.length}, Admins hidden: ${(result.data?.length || 0) - filteredMembers.length}`);


        // ENRICHMENT: Fetch real pet counts and info status from Supabase
        const memberstackIds = filteredMembers.map(m => m.id);
        const memberDataMap = new Map<string, { petCount: number, infoStatus: string }>();

        if (memberstackIds.length > 0) {
            const { data: userMappings, error: mappingError } = await supabaseAdmin
                .from('users')
                .select('id, memberstack_id, approval_status')
                .in('memberstack_id', memberstackIds);

            if (!mappingError && userMappings) {
                const supabaseUserIds = userMappings.map(u => u.id);
                const supabaseIdToMsId = new Map(userMappings.map(u => [u.id, u.memberstack_id]));
                const msIdToUserStatus = new Map(userMappings.map(u => [u.memberstack_id, u.approval_status]));

                // Fetch detailed pet info
                const { data: petsData, error: petsError } = await supabaseAdmin
                    .from('pets')
                    .select('owner_id, photo_url, vet_certificate_url, is_senior, status')
                    .in('owner_id', supabaseUserIds);

                if (!petsError && petsData) {
                    // Group pets by owner
                    const ownerPetsMap = new Map<string, any[]>();
                    petsData.forEach(pet => {
                        const pets = ownerPetsMap.get(pet.owner_id) || [];
                        pets.push(pet);
                        ownerPetsMap.set(pet.owner_id, pets);
                    });

                    // Calculate status for each member
                    userMappings.forEach(user => {
                        const msId = user.memberstack_id;
                        const pets = ownerPetsMap.get(user.id) || [];
                        
                        let infoStatus = 'complete';
                        
                        if (pets.length > 0) {
                            const hasActionRequired = pets.some(p => p.status === 'action_required') || user.approval_status === 'action_required';
                            
                            if (hasActionRequired) {
                                infoStatus = 'requested';
                            } else {
                                const isIncomplete = pets.some(p => {
                                    const missingPhoto = !p.photo_url || p.photo_url.trim() === '';
                                    const missingCert = p.is_senior && (!p.vet_certificate_url || p.vet_certificate_url.trim() === '');
                                    return missingPhoto || missingCert;
                                });
                                
                                if (isIncomplete) {
                                    infoStatus = 'incomplete';
                                }
                            }
                        } else {
                            // If they are members but have 0 pets, we consider it incomplete 
                            // (they haven't finished registration)
                            infoStatus = 'incomplete';
                        }

                        memberDataMap.set(msId, {
                            petCount: pets.length,
                            infoStatus: infoStatus
                        });
                    });
                }
            }
        }

        // Attach enriched data to members
        const membersWithCounts = filteredMembers.map(member => {
            const enriched = memberDataMap.get(member.id);
            return {
                ...member,
                petCount: enriched?.petCount || 0,
                infoStatus: enriched?.infoStatus || 'complete'
            };
        });

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
