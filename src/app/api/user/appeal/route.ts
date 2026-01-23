/**
 * API Route: /api/user/appeal
 * Permite a un usuario apelar una MASCOTA ESPECÍFICA
 * ACTUALIZADO: Apelaciones a nivel mascota con límite de intentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_APPEALS_PER_PET = 2;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, petId, appealMessage } = body;

        // Validar datos
        if (!memberId || !petId || !appealMessage?.trim()) {
            return NextResponse.json({
                error: 'Datos incompletos. Se requiere memberId, petId y appealMessage.'
            }, { status: 400 });
        }

        console.log(`📧 Procesando apelación de mascota ${petId} del miembro ${memberId}...`);

        // 1. Verificar que la mascota existe y pertenece al usuario
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('id, name, status, appeal_count, owner:users!owner_id(memberstack_id)')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
        }

        // Verificar que la mascota pertenece al usuario
        const owner = Array.isArray(pet.owner) ? pet.owner[0] : pet.owner;
        if (owner?.memberstack_id !== memberId) {
            return NextResponse.json({ error: 'No tienes permiso para apelar esta mascota' }, { status: 403 });
        }

        // Verificar que la mascota puede ser apelada (status rejected o action_required)
        if (!['rejected', 'action_required'].includes(pet.status)) {
            return NextResponse.json({
                error: `Esta mascota no puede ser apelada. Status actual: ${pet.status}`
            }, { status: 400 });
        }

        // Verificar límite de apelaciones
        const currentAppealCount = pet.appeal_count || 0;
        if (currentAppealCount >= MAX_APPEALS_PER_PET) {
            return NextResponse.json({
                error: `Has alcanzado el límite de ${MAX_APPEALS_PER_PET} apelaciones para esta mascota.`
            }, { status: 400 });
        }

        // 2. Actualizar mascota a status 'appealed'
        const { error: updateError } = await supabaseAdmin
            .from('pets')
            .update({
                status: 'appealed',
                appeal_message: appealMessage,
                appeal_count: currentAppealCount + 1,
                appealed_at: new Date().toISOString()
            })
            .eq('id', petId);

        if (updateError) {
            console.error('Error actualizando mascota:', updateError);
            return NextResponse.json({ error: 'Error al procesar la apelación' }, { status: 500 });
        }

        // 3. Crear log de apelación (vinculado a la mascota)
        await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: petId,
                type: 'user_appeal',
                message: appealMessage,
                created_at: new Date().toISOString()
            });

        // 4. Recalcular y actualizar el membership_status del usuario
        await updateMemberStatusFromPets(memberId);

        console.log(`✅ Apelación registrada para mascota ${pet.name} (intento ${currentAppealCount + 1}/${MAX_APPEALS_PER_PET})`);

        const response = NextResponse.json({
            success: true,
            message: `Tu apelación para ${pet.name} ha sido enviada. El equipo la revisará pronto.`,
            appealCount: currentAppealCount + 1,
            maxAppeals: MAX_APPEALS_PER_PET
        });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return response;

    } catch (error: any) {
        console.error('Error procesando apelación:', error);
        const response = NextResponse.json({ error: error.message }, { status: 500 });
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
    }
}

/**
 * Recalcula el membership_status del usuario basándose en el estado de sus mascotas
 */
async function updateMemberStatusFromPets(memberstackId: string) {
    try {
        // Obtener el usuario
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) return;

        // Obtener todas las mascotas del usuario
        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('status')
            .eq('owner_id', user.id);

        if (petsError || !pets || pets.length === 0) return;

        // Calcular el status derivado
        let derivedStatus = 'active';

        const statuses = pets.map(p => p.status);

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

        // Actualizar el usuario
        await supabaseAdmin
            .from('users')
            .update({ membership_status: derivedStatus })
            .eq('memberstack_id', memberstackId);

        console.log(`📊 Status del miembro ${memberstackId} actualizado a: ${derivedStatus}`);

    } catch (error) {
        console.error('Error actualizando status del miembro:', error);
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}
