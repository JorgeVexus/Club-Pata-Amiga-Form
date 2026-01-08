import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { approveMemberApplication, rejectMemberApplication } from '@/services/memberstack-admin.service';
import { createServerNotification } from '@/app/actions/notification.actions';

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

        if (!['pending', 'approved', 'action_required', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        console.log(`🔄 Actualizando mascota ${petId} a estado: ${status}`);

        // 1. Actualizar estado de la mascota en Supabase
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .update({
                status,
                admin_notes: adminNotes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', petId)
            .select()
            .single();

        if (petError) throw petError;

        // 2. Si se aprueba la mascota, verificar si el socio debe pasar a 'active'
        if (status === 'approved') {
            // Obtener el estado actual del socio en Supabase
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('membership_status, first_name')
                .eq('memberstack_id', memberId)
                .single();

            if (userError) throw userError;

            // REGLA DE NEGOCIO: Si es la primera mascota aprobada, activar membresía
            if (user.membership_status !== 'approved' && user.membership_status !== 'active') {
                console.log(`🚀 Primera mascota aprobada para ${memberId}. Activando socio...`);

                // Actualizar en Memberstack
                await approveMemberApplication(memberId, adminId || 'admin_system');

                // Actualizar en Supabase
                await supabaseAdmin
                    .from('users')
                    .update({ membership_status: 'active' })
                    .eq('memberstack_id', memberId);

                // Notificación global de bienvenida
                await createServerNotification({
                    userId: memberId,
                    type: 'account',
                    title: '¡Bienvenido a la manada! 🐾',
                    message: `Tu mascota ${pet.name} ha sido aprobada. ¡Ya eres miembro activo de Club Pata Amiga!`,
                    icon: '🎉',
                    link: '/miembros/dashboard'
                });
            } else {
                // Notificación solo para esta mascota
                await createServerNotification({
                    userId: memberId,
                    type: 'account',
                    title: 'Mascota aprobada ✅',
                    message: `Tu mascota ${pet.name} ha sido aprobada exitosamente.`,
                    icon: '🐕',
                    link: '/miembros/dashboard'
                });
            }
        } else if (status === 'action_required' || status === 'rejected') {
            // Notificación de acción requerida o rechazo para esta mascota
            await createServerNotification({
                userId: memberId,
                type: 'account',
                title: status === 'rejected' ? 'Mascota rechazada ❌' : 'Acción requerida para tu mascota 📋',
                message: `Hubo una actualización en el estado de ${pet.name}. Motivo: ${adminNotes || 'Revisa los detalles en tu perfil.'}`,
                icon: status === 'rejected' ? '❌' : '📋',
                link: '/miembros/dashboard'
            });
        }

        return NextResponse.json({
            success: true,
            message: `Estado de mascota actualizado a ${status}`,
            pet
        });

    } catch (error: any) {
        console.error('Error actualizando mascota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
