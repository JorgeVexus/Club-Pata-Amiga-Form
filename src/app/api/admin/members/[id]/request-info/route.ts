/**
 * API Route: /api/admin/members/[id]/request-info
 *
 * Permite a un administrador solicitar información específica al miembro
 * sobre una mascota. Crea un log con metadata, envía email vía Resend
 * y crea notificación in-app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerNotification } from '@/app/actions/notification.actions';
import { sendInfoRequestEmail } from '@/app/actions/comm.actions';
import { isUnsubscribedPetWithHistory } from '@/utils/pet-lifecycle';
import { buildAdminPetLookupAttempts } from '@/utils/admin-pet-lookup';
import { generateUploadToken } from '@/utils/upload-token';
import { buildInfoRequestUploadUrl } from '@/utils/info-request-upload-link';
import { buildInfoRequestPetUpdate } from '@/utils/pet-info-request-status';

import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const REQUEST_TYPES: Record<string, { label: string; icon: string; description: string }> = {
    PET_PHOTO_1: {
        label: 'Foto Principal',
        icon: '📸',
        description: 'una foto clara de tu mascota donde se vea bien su carita'
    },
    PET_VET_CERT: {
        label: 'Certificado Médico Veterinario',
        icon: '🏥',
        description: 'el certificado médico expedido por un veterinario certificado'
    },
    OTHER_DOC: {
        label: 'Documento Adicional',
        icon: '📄',
        description: 'un documento o archivo adicional'
    }
};

const PET_SELECT = 'id, name, status, is_active, waiting_period_start, waiting_period_end';

async function getPetIndexForMember(ownerId: string, petId: string) {
    const { data: pets } = await supabaseAdmin
        .from('pets')
        .select('id')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

    const index = (pets || []).findIndex((pet) => pet.id === petId);
    return index >= 0 ? index + 1 : 1;
}

async function findPetForMember(
    ownerId: string,
    lookup: { petId: string; memberstackSlot?: unknown; petName?: unknown }
) {
    const attempts = buildAdminPetLookupAttempts(lookup);

    for (const attempt of attempts) {
        if (attempt.type === 'slot') {
            const { data: petsByOwner, error: ordinalError } = await supabaseAdmin
                .from('pets')
                .select(PET_SELECT)
                .eq('owner_id', ownerId)
                .order('created_at', { ascending: true });

            const ordinalPet = petsByOwner?.[attempt.value - 1];
            if (ordinalPet) {
                console.warn('[Request Info] Mascota resuelta por posicion legacy:', {
                    requestedSlot: attempt.value,
                    resolvedPetId: ordinalPet.id,
                });
                return ordinalPet;
            }

            if (ordinalError) {
                console.warn('[Request Info] Fallo fallback por posicion legacy:', ordinalError.message);
            }

            continue;
        }

        let query = supabaseAdmin
            .from('pets')
            .select(PET_SELECT)
            .eq('owner_id', ownerId);

        if (attempt.type === 'id') {
            query = query.eq('id', attempt.value);
        } else {
            query = query.ilike('name', attempt.value);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
            if (attempt.type !== 'id') {
                console.warn('[Request Info] Mascota resuelta por fallback:', {
                    lookupType: attempt.type,
                    lookupValue: attempt.value,
                    resolvedPetId: data.id,
                });
            }
            return data;
        }

        if (error) {
            console.warn('[Request Info] Fallo intento de busqueda de mascota:', {
                lookupType: attempt.type,
                error: error.message,
            });
        }
    }

    return null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();
        const { petId, requestTypes, customMessage, memberstackSlot, petName } = body;
        const adminId = adminUser.memberstack_id;

        if (!petId) {
            return NextResponse.json({ error: 'petId es obligatorio' }, { status: 400 });
        }

        if (!requestTypes || !Array.isArray(requestTypes) || requestTypes.length === 0) {
            return NextResponse.json({ error: 'Debes seleccionar al menos un tipo de solicitud' }, { status: 400 });
        }

        const invalidTypes = requestTypes.filter((t: string) => !REQUEST_TYPES[t]);
        if (invalidTypes.length > 0) {
            return NextResponse.json({ error: `Tipos inválidos: ${invalidTypes.join(', ')}` }, { status: 400 });
        }

        console.log(`[Request Info] Admin solicita ${requestTypes.join(', ')} para mascota ${petId} del miembro ${memberId}`);

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, memberstack_id')
            .eq('memberstack_id', memberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const pet = await findPetForMember(user.id, { petId, memberstackSlot, petName });

        if (!pet) {
            return NextResponse.json({ error: 'Mascota no encontrada para este miembro' }, { status: 404 });
        }

        const resolvedPetId = pet.id;

        const { data: unsubscriptions } = await supabaseAdmin
            .from('pet_unsubscriptions')
            .select('id, pet_id, pet_index, pet_name, reason, description, status, requested_at, reviewed_at, created_at')
            .eq('memberstack_id', memberId)
            .order('created_at', { ascending: false });

        if (isUnsubscribedPetWithHistory(pet, unsubscriptions || [])) {
            return NextResponse.json({
                error: 'Esta mascota ya fue dada de baja y no puede recibir solicitudes de información.'
            }, { status: 409 });
        }

        const requestLabels = requestTypes.map((t: string) => `${REQUEST_TYPES[t].icon} ${REQUEST_TYPES[t].label}`);
        const requestMessage = `Se solicita la siguiente información para ${pet.name}: ${requestLabels.join(', ')}${customMessage ? `\n\nMensaje del administrador: ${customMessage}` : ''}`;

        const { data: logData, error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: resolvedPetId,
                admin_id: adminId || 'admin',
                type: 'admin_info_request',
                message: requestMessage,
                metadata: {
                    request_types: requestTypes,
                    custom_message: customMessage || null,
                    items: requestTypes.map((t: string) => ({
                        type: t,
                        label: REQUEST_TYPES[t].label,
                        icon: REQUEST_TYPES[t].icon,
                        fulfilled: false
                    }))
                },
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (logError) {
            console.error('Error creando log de solicitud:', logError);
            return NextResponse.json({ error: 'Error al registrar la solicitud' }, { status: 500 });
        }

        await supabaseAdmin
            .from('pets')
            .update(buildInfoRequestPetUpdate(pet, requestMessage))
            .eq('id', resolvedPetId);

        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: `📋 Acción requerida: ${pet.name}`,
            message: `Necesitamos ${requestLabels.length === 1 ? requestLabels[0] : `${requestLabels.length} documentos`} para completar la revisión de ${pet.name}.`,
            icon: '📋',
            link: `/mi-membresia?petId=${resolvedPetId}&action=chat`,
            metadata: { action: 'open_pet_chat', source: 'info_request', petId: resolvedPetId, requestTypes }
        });

        if (user.email) {
            const petIndex = await getPetIndexForMember(user.id, resolvedPetId);
            const { token, exp } = generateUploadToken(memberId, petIndex);
            const dashboardUrl = buildInfoRequestUploadUrl({
                baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx',
                memberId,
                petIndex,
                petId: resolvedPetId,
                requestTypes,
                logId: logData?.id || null,
                token,
                exp,
            });

            try {
                await sendInfoRequestEmail({
                    userId: user.id,
                    userEmail: user.email,
                    userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    petName: pet.name,
                    petId: resolvedPetId,
                    requestTypes: requestTypes.map((t: string) => ({
                        type: t,
                        label: REQUEST_TYPES[t].label,
                        icon: REQUEST_TYPES[t].icon,
                        description: REQUEST_TYPES[t].description
                    })),
                    customMessage: customMessage || null,
                    dashboardUrl
                });
                console.log(`Email de solicitud enviado a ${user.email}`);
            } catch (emailErr) {
                console.error('Error enviando email (no crítico):', emailErr);
            }
        }

        console.log(`Solicitud de información creada para ${pet.name}`);

        return NextResponse.json({
            success: true,
            message: `Solicitud enviada correctamente para ${pet.name}`
        });

    } catch (error: unknown) {
        console.error('Error en request-info API:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
