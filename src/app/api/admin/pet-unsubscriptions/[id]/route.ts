import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { approvePetUnsubscription, PetUnsubscriptionError, rejectPetUnsubscription } from '@/services/pet-unsubscription.service';
import { createServerNotification } from '@/app/actions/notification.actions';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const admin = await getAdminUser(request);
    if (!admin || ('isUnauthorized' in admin && admin.isUnauthorized)) return unauthorizedResponse();

    try {
        const { id } = await context.params;
        const body = await request.json();
        const action = body.action as 'approve' | 'reject';
        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 });
        }

        const { data: pending } = await supabase
            .from('pet_unsubscriptions')
            .select('memberstack_id, pet_name')
            .eq('id', id)
            .eq('status', 'pending')
            .maybeSingle();
        if (!pending) return NextResponse.json({ error: 'La solicitud ya no está pendiente.' }, { status: 409 });

        const review = {
            requestId: id,
            reviewedBy: admin.memberstack_id,
            reviewNotes: typeof body.notes === 'string' ? body.notes.trim() : '',
        };
        const result = action === 'approve'
            ? await approvePetUnsubscription(review)
            : await rejectPetUnsubscription(review);

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('memberstack_id', pending.memberstack_id)
            .maybeSingle();
        if (user?.id) {
            await createServerNotification({
                userId: user.id,
                type: 'pet_status',
                title: action === 'approve' ? 'Baja de peludo aprobada' : 'Solicitud de baja rechazada',
                message: action === 'approve'
                    ? `La baja de ${pending.pet_name} fue aprobada. Ya tienes disponible ese espacio en tu manada.`
                    : `La solicitud de baja de ${pending.pet_name} no fue aprobada. Tu peludo continúa activo.`,
                icon: action === 'approve' ? '✅' : '🐾',
                link: '/pets/pet-waiting-period',
                metadata: { petUnsubscriptionId: id, action },
            });
        }

        return NextResponse.json({ success: true, request: result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'No se pudo revisar la solicitud.';
        const status = error instanceof PetUnsubscriptionError ? error.statusCode : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
