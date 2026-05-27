import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerNotification } from '@/app/actions/notification.actions';
import { sendAppealResolutionEmail } from '@/app/actions/comm.actions';
import { updateContactAsActive } from '@/services/crm.service';
import { isUnsubscribedPetWithHistory } from '@/utils/pet-lifecycle';
import { getPetCarenciaDate } from '@/utils/carencia.utils';
import { buildAdminPetLookupAttempts } from '@/utils/admin-pet-lookup';

import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function findPetForMember(
    ownerId: string,
    lookup: { petId: string; memberstackSlot?: unknown; petName?: unknown }
) {
    const attempts = buildAdminPetLookupAttempts(lookup);

    for (const attempt of attempts) {
        let query = supabaseAdmin
            .from('pets')
            .select('id, status, name, is_active, memberstack_slot, waiting_period_start, is_adopted, is_mixed_breed, is_mixed, breed, pet_type')
            .eq('owner_id', ownerId);

        if (attempt.type === 'id') {
            query = query.eq('id', attempt.value);
        } else if (attempt.type === 'slot') {
            query = query.eq('memberstack_slot', attempt.value);
        } else {
            query = query.ilike('name', attempt.value);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
            if (attempt.type !== 'id') {
                console.warn('[Pet Status] Mascota resuelta por fallback:', {
                    lookupType: attempt.type,
                    lookupValue: attempt.value,
                    resolvedPetId: data.id,
                });
            }
            return data;
        }

        if (error) {
            console.warn('[Pet Status] Fallo intento de busqueda de mascota:', {
                lookupType: attempt.type,
                error: error.message,
            });
        }
    }

    return null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; petId: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId, petId } = await params;
        const body = await request.json();
        const { status, adminNotes, memberstackSlot, petName } = body;
        const adminId = adminUser.memberstack_id;

        const validStatuses = ['pending', 'approved', 'action_required', 'rejected'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        if ((status === 'rejected' || status === 'action_required') && (!adminNotes || adminNotes.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Debes proporcionar una razón para rechazar o solicitar cambios.' },
                { status: 400 }
            );
        }

        console.log(`[Pet Status] Actualizando mascota ${petId} a estado: ${status}`);

        const { data: ownerUser, error: ownerError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberId)
            .single();

        if (ownerError || !ownerUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const previousPet = await findPetForMember(ownerUser.id, { petId, memberstackSlot, petName });

        if (!previousPet) {
            return NextResponse.json({ error: 'Mascota no encontrada para este miembro' }, { status: 404 });
        }

        const resolvedPetId = previousPet.id;

        const { data: unsubscriptions } = await supabaseAdmin
            .from('pet_unsubscriptions')
            .select('pet_id, pet_index, pet_name, reason, description, created_at')
            .eq('memberstack_id', memberId)
            .order('created_at', { ascending: false });

        if (isUnsubscribedPetWithHistory(previousPet, unsubscriptions || [])) {
            return NextResponse.json({
                error: 'Esta mascota ya fue dada de baja y no puede volver a revisión.'
            }, { status: 409 });
        }

        const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('id')
            .eq('referred_user_id', memberId)
            .maybeSingle();

        const wasAppealed = previousPet.status === 'appealed';
        const hasAmbassadorCode = !!referral;

        const updateData: Record<string, unknown> = {
            status,
            admin_notes: adminNotes || null,
            last_admin_response: adminNotes || null
        };

        if (status === 'approved') {
            updateData.appeal_message = null;
            updateData.appealed_at = null;

            if (!previousPet.waiting_period_start) {
                const now = new Date();
                const waitingPeriodStart = now.toISOString();
                updateData.waiting_period_start = waitingPeriodStart;

                const carenciaInput = {
                    waiting_period_start: waitingPeriodStart,
                    is_adopted: previousPet.is_adopted,
                    is_mixed_breed: previousPet.is_mixed_breed,
                    is_mixed: previousPet.is_mixed,
                    breed: previousPet.breed,
                    pet_type: previousPet.pet_type
                };

                const endDate = getPetCarenciaDate(carenciaInput, hasAmbassadorCode);
                updateData.waiting_period_end = endDate.toISOString();

                const diffTime = endDate.getTime() - now.getTime();
                const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                console.log(`[Pet Status] Carencia calculada para ${previousPet.name}: ${totalDays} días (Embajador: ${hasAmbassadorCode})`);
            }
        }

        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', resolvedPetId)
            .select()
            .single();

        if (petError) throw petError;

        await updateMemberStatusFromPets(memberId);

        if (status === 'approved') {
            try {
                const { data: userForCrm } = await supabaseAdmin
                    .from('users')
                    .select('crm_contact_id, membership_type, membership_cost')
                    .eq('memberstack_id', memberId)
                    .single();

                if (userForCrm?.crm_contact_id) {
                    const crmResult = await updateContactAsActive(
                        userForCrm.crm_contact_id,
                        userForCrm.membership_type || 'Mensual',
                        userForCrm.membership_cost || '$159'
                    );
                    console.log('[Pet Status] CRM: Miembro marcado como activo:', crmResult.success);
                } else {
                    console.warn('[Pet Status] Usuario sin crm_contact_id, omitiendo sync CRM');
                }
            } catch (crmError) {
                console.error('[Pet Status] Error no crítico actualizando CRM:', crmError);
            }

            await createServerNotification({
                userId: memberId,
                type: 'account',
                title: 'Mascota aprobada ✅',
                message: `¡Excelentes noticias! ${pet.name} ha sido aprobada y ya forma parte de la manada.`,
                icon: '🐕',
                link: '/miembros/dashboard'
            });
        } else if (status === 'action_required') {
            await createServerNotification({
                userId: memberId,
                type: 'account',
                title: `Acción requerida: ${pet.name} 📋`,
                message: adminNotes || 'Necesitamos información adicional sobre tu mascota.',
                icon: '📋',
                link: '/miembros/dashboard'
            });
        } else if (status === 'rejected') {
            await createServerNotification({
                userId: memberId,
                type: 'account',
                title: `${pet.name} no fue aprobada ❌`,
                message: adminNotes || 'Tu mascota no cumplió con los requisitos. Puedes apelar si crees que fue un error.',
                icon: '❌',
                link: '/miembros/dashboard'
            });
        }

        if (wasAppealed && (status === 'approved' || status === 'rejected')) {
            try {
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('email')
                    .eq('memberstack_id', memberId)
                    .single();

                if (user?.email) {
                    await sendAppealResolutionEmail({
                        userId: memberId,
                        userEmail: user.email,
                        petName: pet.name,
                        resolution: status as 'approved' | 'rejected',
                        adminNotes: adminNotes
                    });
                    console.log(`[Pet Status] Email de resolución de apelación enviado a ${user.email}`);
                }
            } catch (emailError) {
                console.error('[Pet Status] Error enviando email de apelación (no crítico):', emailError);
            }
        }

        await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: resolvedPetId,
                admin_id: adminId,
                type: status === 'approved' ? 'admin_approve' : status === 'rejected' ? 'admin_reject' : 'admin_request',
                message: adminNotes || `Estado cambiado a ${status}`,
                created_at: new Date().toISOString()
            });

        return NextResponse.json({
            success: true,
            message: `Estado de ${pet.name} actualizado a ${status}`,
            pet
        });

    } catch (error: unknown) {
        console.error('Error actualizando mascota:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

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
            .select('id, name, status, is_active, memberstack_slot')
            .eq('owner_id', user.id);

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
            .update({
                membership_status: derivedStatus,
                approval_status: derivedStatus === 'active' ? 'approved' :
                    derivedStatus === 'appealed' ? 'appealed' :
                        derivedStatus === 'rejected' ? 'rejected' : undefined
            })
            .eq('memberstack_id', memberstackId);

        console.log(`[Pet Status] Status del miembro ${memberstackId} recalculado a: ${derivedStatus}`);

    } catch (error) {
        console.error('Error actualizando status del miembro:', error);
    }
}
