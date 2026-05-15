import { supabaseAdmin } from '@/lib/supabase';

/**
 * Recalcula el membership_status del usuario basándose en el estado de todas sus mascotas.
 * 
 * Prioridad de estados (de mayor a menor importancia):
 * 1. appealed -> Si alguna mascota está en apelación.
 * 2. rejected -> Si alguna mascota está rechazada.
 * 3. action_required -> Si alguna mascota requiere acción del usuario.
 * 4. pending -> Si alguna mascota está pendiente de revisión.
 * 5. active -> Solo si TODAS las mascotas están aprobadas.
 * 
 * @param memberstackId ID del miembro en Memberstack
 */
export async function recalculateMemberStatus(memberstackId: string) {
    try {
        if (!supabaseAdmin) {
            throw new Error('Supabase Admin client not available (check environment variables and context)');
        }
        console.log(`📊 Recalculando status para el miembro: ${memberstackId}`);

        // 1. Obtener el ID interno del usuario
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) {
            console.warn(`⚠️ No se encontró el usuario ${memberstackId} para recalcular status.`);
            return null;
        }

        // 2. Obtener todas las mascotas del usuario
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('status')
            .eq('owner_id', user.id);

        if (petsError) {
            throw new Error(`Error obteniendo mascotas: ${petsError.message}`);
        }

        if (!pets || pets.length === 0) {
            console.log(`ℹ️ El usuario ${memberstackId} no tiene mascotas.`);
            return null;
        }

        // 3. Determinar el nuevo estado
        const statuses: string[] = pets.map((p: { status: string }) => p.status);
        let derivedStatus = 'active';

        // Prioridad: appealed > rejected > action_required > pending > active
        if (statuses.some((s: string) => s === 'appealed')) {
            derivedStatus = 'appealed';
        } else if (statuses.some((s: string) => s === 'rejected')) {
            derivedStatus = 'rejected';
        } else if (statuses.some((s: string) => s === 'action_required')) {
            derivedStatus = 'action_required';
        } else if (statuses.some((s: string) => s === 'pending')) {
            derivedStatus = 'pending';
        } else if (statuses.every((s: string) => s === 'approved')) {
            derivedStatus = 'active';
        } else {
            // Fallback si hay estados mixtos no contemplados (ej: algunos approved, otros pending)
            derivedStatus = statuses.includes('pending') ? 'pending' : 'active';
        }

        console.log(`✅ Nuevo status calculado para ${memberstackId}: ${derivedStatus}`);

        // 4. Actualizar el usuario en Supabase
        const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                membership_status: derivedStatus,
                // También actualizamos approval_status para consistencia en el admin dashboard
                approval_status: derivedStatus === 'active' ? 'approved' :
                                derivedStatus === 'appealed' ? 'appealed' :
                                derivedStatus === 'rejected' ? 'rejected' : 
                                derivedStatus === 'action_required' ? 'action_required' : 'waiting_approval'
            })
            .eq('memberstack_id', memberstackId)
            .select()
            .single();

        if (updateError) throw updateError;

        return updatedUser;

    } catch (error) {
        console.error('❌ Error en recalculateMemberStatus:', error);
        throw error;
    }
}
