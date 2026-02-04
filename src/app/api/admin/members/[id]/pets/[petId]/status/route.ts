import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { approveMemberApplication, rejectMemberApplication } from '@/services/memberstack-admin.service';
import { createServerNotification } from '@/app/actions/notification.actions';
import { sendAppealResolutionEmail } from '@/app/actions/comm.actions';
import { updateContactAsActive } from '@/services/crm.service';

// Cliente Supabase con Service Role para operaciones admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; petId: string }> }
) {
    try {
        const { id: memberId, petId } = await params;
        const body = await request.json();
        const { status, adminNotes, adminId } = body;

        // Permitir también 'appealed' pero solo para leer, no para setear directamente
        const validStatuses = ['pending', 'approved', 'action_required', 'rejected'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        // Validación: Motivo requerido para rechazo o solicitud de info
        if ((status === 'rejected' || status === 'action_required') && (!adminNotes || adminNotes.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Debes proporcionar una razón para rechazar o solicitar cambios.' },
                { status: 400 }
            );
        }

        console.log(`🔄 Actualizando mascota ${petId} a estado: ${status}`);

        // 0. Obtener estado ANTERIOR de la mascota para detectar si viene de 'appealed'
        const { data: previousPet } = await supabaseAdmin
            .from('pets')
            .select('status, name')
            .eq('id', petId)
            .single();

        const wasAppealed = previousPet?.status === 'appealed';

        // 1. Actualizar estado de la mascota en Supabase
        const updateData: any = {
            status,
            admin_notes: adminNotes || null,
            last_admin_response: adminNotes || null
        };

        // Si se aprueba una mascota apelada, limpiar los campos de apelación
        if (status === 'approved') {
            updateData.appeal_message = null;
            updateData.appealed_at = null;
        }

        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', petId)
            .select()
            .single();

        if (petError) throw petError;

        // 2. Recalcular el membership_status del usuario basándose en TODAS sus mascotas
        await updateMemberStatusFromPets(memberId);

        // 3. Notificaciones según el cambio de estado
        if (status === 'approved') {
            // 3.1 Notificar al CRM - Miembro Activo
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
                    console.log('✅ CRM: Miembro marcado como activo:', crmResult.success);
                } else {
                    console.warn('⚠️ Usuario sin crm_contact_id, omitiendo sync CRM');
                }
            } catch (crmError) {
                console.error('⚠️ Error no crítico actualizando CRM:', crmError);
            }

            // 3.2 Notificación interna
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

        // 3.5 Si venía de 'appealed', enviar email de resolución
        if (wasAppealed && (status === 'approved' || status === 'rejected')) {
            try {
                // Obtener email del usuario
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
                    console.log(`📧 Email de resolución de apelación enviado a ${user.email}`);
                }
            } catch (emailError) {
                console.error('Error enviando email de apelación (no crítico):', emailError);
            }
        }

        // 4. Crear log de la acción del admin
        await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: petId,
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

    } catch (error: any) {
        console.error('Error actualizando mascota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        // Calcular el status derivado basado en prioridades
        const statuses = pets.map(p => p.status);
        let derivedStatus = 'active';

        // Prioridad: appealed > rejected > action_required > pending > active
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

        // Actualizar el usuario en Supabase
        await supabaseAdmin
            .from('users')
            .update({ membership_status: derivedStatus })
            .eq('memberstack_id', memberstackId);

        console.log(`📊 Status del miembro ${memberstackId} recalculado a: ${derivedStatus}`);

    } catch (error) {
        console.error('Error actualizando status del miembro:', error);
    }
}
