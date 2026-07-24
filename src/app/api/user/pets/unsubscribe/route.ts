import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createServerNotification } from '@/app/actions/notification.actions';
import {
    createPetUnsubscriptionRequest,
    executeImmediatePetUnsubscription,
    PetUnsubscriptionError,
} from '@/services/pet-unsubscription.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, petId, petIndex, petName, reason, description, isDeathSolidarity } = body;

        if (!memberId || petIndex === undefined || !petName || !reason) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const adminUser = await getAdminUser(request);
        const authorizedAdmin = adminUser && !('isUnauthorized' in adminUser && adminUser.isUnauthorized) ? adminUser : null;
        const workflowInput = {
            memberstack_id: memberId,
            memberId,
            petId,
            petIndex: Number(petIndex),
            petName,
            reason,
            description,
            requestedBy: authorizedAdmin
                ? (authorizedAdmin.full_name || 'Admin')
                : (isDeathSolidarity ? 'Comité (Solidaridad)' : 'Usuario'),
            requestedById: authorizedAdmin?.memberstack_id || (isDeathSolidarity ? 'system' : memberId),
        };

        if (authorizedAdmin || isDeathSolidarity) {
            await executeImmediatePetUnsubscription(workflowInput);
            return NextResponse.json({ success: true, status: 'approved', message: 'Mascota dada de baja exitosamente' });
        }

        const pendingRequest = await createPetUnsubscriptionRequest(workflowInput);
        try {
            await createServerNotification({
                userId: 'admin',
                type: 'pet_unsubscription_requested',
                title: 'Solicitud de baja de peludo',
                message: `${petName} solicitó baja por: ${reason}. Revisa la solicitud para liberar el espacio.`,
                icon: '🐾',
                link: `/admin/dashboard?tab=pet-unsubscriptions&petUnsubscriptionId=${pendingRequest.id}`,
                metadata: {
                    action: 'open_pet_unsubscriptions',
                    source: 'pet_unsubscription_request',
                    petUnsubscriptionId: pendingRequest.id,
                    memberId,
                    petId: petId || null,
                    petName,
                    reason,
                },
            });
        } catch (notificationError) {
            console.error('Error creating admin pet unsubscription notification:', notificationError);
        }

        return NextResponse.json({
            success: true,
            status: 'pending',
            message: 'Tu solicitud de baja quedó en revisión.',
        }, { status: 202 });

    } catch (error: unknown) {
        console.error('Unsubscribe API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const status = error instanceof PetUnsubscriptionError ? error.statusCode : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
