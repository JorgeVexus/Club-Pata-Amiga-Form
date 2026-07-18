import { createClient } from '@supabase/supabase-js';
import { memberstackAdmin } from '@/services/memberstack-admin.service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RequestInput = {
    memberId: string;
    petId?: string;
    petIndex: number;
    petName: string;
    reason: string;
    description?: string;
    requestedBy?: string;
    requestedById?: string;
};

type ReviewInput = {
    requestId: string;
    reviewedBy: string;
    reviewNotes?: string;
};

export class PetUnsubscriptionError extends Error {
    constructor(message: string, public statusCode = 400) {
        super(message);
        this.name = 'PetUnsubscriptionError';
    }
}

async function resolveOwnedPet(input: RequestInput) {
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, memberstack_id')
        .eq('memberstack_id', input.memberId)
        .maybeSingle();

    if (userError || !user) {
        throw new PetUnsubscriptionError('No encontramos la cuenta de este miembro.', 404);
    }

    let query = supabase
        .from('pets')
        .select('id, owner_id, name, is_active, status, memberstack_slot')
        .eq('owner_id', user.id);

    query = input.petId
        ? query.eq('id', input.petId)
        : query.eq('memberstack_slot', input.petIndex + 1);

    const { data: pet, error: petError } = await query.maybeSingle();
    if (petError || !pet) {
        throw new PetUnsubscriptionError('No encontramos ese peludo en tu cuenta.', 404);
    }

    return { user, pet };
}

function buildAuditEntry(input: RequestInput, petId: string, status: 'pending' | 'approved') {
    const now = new Date().toISOString();
    return {
        memberstack_id: input.memberId,
        pet_id: petId,
        pet_index: input.petIndex + 1,
        pet_name: input.petName,
        reason: input.reason,
        description: input.description || '',
        unsubscribed_by: input.requestedBy || 'Usuario',
        unsubscribed_by_id: input.requestedById || input.memberId,
        status,
        requested_at: now,
        ...(status === 'approved' ? { reviewed_at: now } : {}),
    };
}

export async function createPetUnsubscriptionRequest(input: RequestInput) {
    const { pet } = await resolveOwnedPet(input);
    if (pet.is_active === false || pet.status === 'unsubscribed') {
        throw new PetUnsubscriptionError('Este peludo ya fue dado de baja.', 409);
    }

    const { data: existing } = await supabase
        .from('pet_unsubscriptions')
        .select('id, status, requested_at')
        .eq('pet_id', pet.id)
        .eq('status', 'pending')
        .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
        .from('pet_unsubscriptions')
        .insert(buildAuditEntry(input, pet.id, 'pending'))
        .select('id, status, requested_at')
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new PetUnsubscriptionError('Ya existe una solicitud de baja en revisión.', 409);
        }
        throw new PetUnsubscriptionError(`No pudimos crear la solicitud: ${error.message}`, 500);
    }
    return data;
}

async function deactivatePet(memberId: string, petId: string, petNum: number, reason: string, description: string) {
    const memberstackResult = await memberstackAdmin.updateMemberFields(memberId, {
        [`pet-${petNum}-is-active`]: 'false',
    });
    if (!memberstackResult.success) {
        throw new PetUnsubscriptionError(`No pudimos actualizar la membresía: ${memberstackResult.error}`, 502);
    }

    const { error } = await supabase
        .from('pets')
        .update({
            status: 'unsubscribed',
            is_active: false,
            memberstack_slot: petNum,
            unsubscribed_reason: reason,
            unsubscribed_description: description,
            unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', petId);

    if (error) {
        await memberstackAdmin.updateMemberFields(memberId, { [`pet-${petNum}-is-active`]: 'true' });
        throw new PetUnsubscriptionError(`No pudimos completar la baja: ${error.message}`, 500);
    }
}

export async function executeImmediatePetUnsubscription(input: RequestInput) {
    const { pet } = await resolveOwnedPet(input);
    const petNum = Number(pet.memberstack_slot || input.petIndex + 1);
    await deactivatePet(input.memberId, pet.id, petNum, input.reason, input.description || '');

    const { data: pending } = await supabase
        .from('pet_unsubscriptions')
        .select('id')
        .eq('pet_id', pet.id)
        .eq('status', 'pending')
        .maybeSingle();

    if (pending) {
        await supabase.from('pet_unsubscriptions').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: input.requestedById || 'system',
        }).eq('id', pending.id).eq('status', 'pending');
        return pending;
    }

    const { data, error } = await supabase
        .from('pet_unsubscriptions')
        .insert(buildAuditEntry(input, pet.id, 'approved'))
        .select('id, status')
        .single();
    if (error) throw new PetUnsubscriptionError(`La baja se completó, pero falló la auditoría: ${error.message}`, 500);
    return data;
}

export async function approvePetUnsubscription(input: ReviewInput) {
    const { data: request, error } = await supabase
        .from('pet_unsubscriptions')
        .select('id, memberstack_id, pet_id, pet_index, reason, description, status')
        .eq('id', input.requestId)
        .eq('status', 'pending')
        .maybeSingle();
    if (error || !request?.pet_id) throw new PetUnsubscriptionError('La solicitud ya no está pendiente.', 409);

    const { data, error: reviewError } = await supabase
        .from('pet_unsubscriptions')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: input.reviewedBy,
            review_notes: input.reviewNotes || null,
        })
        .eq('id', input.requestId)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle();
    if (reviewError || !data) throw new PetUnsubscriptionError('La solicitud cambió mientras se procesaba.', 409);
    try {
        await deactivatePet(
            request.memberstack_id,
            request.pet_id,
            Number(request.pet_index),
            request.reason,
            request.description || ''
        );
    } catch (deactivationError) {
        await supabase.from('pet_unsubscriptions').update({
            status: 'pending', reviewed_at: null, reviewed_by: null, review_notes: null,
        }).eq('id', input.requestId).eq('status', 'approved');
        throw deactivationError;
    }
    return data;
}

export async function rejectPetUnsubscription(input: ReviewInput) {
    const { data, error } = await supabase
        .from('pet_unsubscriptions')
        .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: input.reviewedBy,
            review_notes: input.reviewNotes || null,
        })
        .eq('id', input.requestId)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle();
    if (error || !data) throw new PetUnsubscriptionError('La solicitud ya no está pendiente.', 409);
    return data;
}
