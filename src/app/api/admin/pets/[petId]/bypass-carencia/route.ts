import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { isUnsubscribedPetWithHistory } from '@/utils/pet-lifecycle';
import { mapPetDerivedStatusToUserStatuses } from '@/utils/member-status-mapping';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function updateMemberStatusFromPets(memberstackId: string) {
    try {
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) return;

        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('id, name, status, is_active')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true })
            .order('id', { ascending: true });

        if (petsError || !pets || pets.length === 0) return;

        const { data: unsubscriptions } = await supabaseAdmin
            .from('pet_unsubscriptions')
            .select('pet_id, pet_index, pet_name, reason, description, created_at')
            .eq('memberstack_id', memberstackId)
            .order('created_at', { ascending: false });

        const activePets = pets.filter(p => !isUnsubscribedPetWithHistory(p, unsubscriptions || []));
        if (activePets.length === 0) return;

        const statuses = activePets.map(p => p.status);
        let derivedStatus = 'active';

        if (statuses.some(s => s === 'appealed')) {
            derivedStatus = 'appealed';
        } else if (statuses.some(s => s === 'rejected')) {
            derivedStatus = 'rejected';
        } else if (statuses.some(s => s === 'action_required')) {
            derivedStatus = 'action_required';
        } else if (statuses.some(s => s === 'pending')) {
            derivedStatus = 'pending';
        } else if (statuses.every(s => s === 'approved')) {
            derivedStatus = 'active';
        }

        await supabaseAdmin
            .from('users')
            .update(mapPetDerivedStatusToUserStatuses(derivedStatus))
            .eq('memberstack_id', memberstackId);

        console.log(`[Bypass Carencia] Status del miembro ${memberstackId} recalculado a: ${derivedStatus}`);

    } catch (error) {
        console.error('Error actualizando status del miembro:', error);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ petId: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        
        if (!adminUser || adminUser.role !== 'super_admin') {
            return unauthorizedResponse('No autorizado. Se requiere rol de Super Administrador.');
        }

        const { petId } = await params;

        // 1. Buscar la mascota en Supabase para obtener su dueño y comprobar existencia
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('id, name, owner_id, status')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
        }

        // 2. Establecer carencia finalizada y estado aprobado
        const now = new Date();
        const start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // hace 180 días

        const { error: updateError } = await supabaseAdmin
            .from('pets')
            .update({
                status: 'approved',
                waiting_period_start: start.toISOString(),
                waiting_period_end: now.toISOString()
            })
            .eq('id', petId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 3. Obtener el memberstack_id del dueño para recalcular su estatus general
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('users')
            .select('memberstack_id')
            .eq('id', pet.owner_id)
            .single();

        if (!ownerError && owner?.memberstack_id) {
            await updateMemberStatusFromPets(owner.memberstack_id);
        }

        console.log(`✅ [Bypass Carencia] Período de carencia finalizado para la mascota ${pet.name} (${petId})`);

        return NextResponse.json({
            success: true,
            message: `El período de carencia de ${pet.name} ha sido finalizado con éxito y su estado cambiado a Aprobado.`,
            petId
        });

    } catch (error: any) {
        console.error('Error en /api/admin/pets/[petId]/bypass-carencia:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
