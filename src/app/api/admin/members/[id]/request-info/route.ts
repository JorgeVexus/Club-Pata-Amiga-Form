/**
 * API Route: /api/admin/members/[id]/request-info
 * 
 * Permite a un administrador solicitar información específica al miembro
 * sobre una mascota. Crea un log con metadata, envía email vía Resend
 * y crea notificación in-app.
 * 
 * Tipos de solicitud soportados:
 *   - PET_PHOTO_1       → Foto Principal
 *   - PET_VET_CERT      → Certificado Médico Veterinario
 *   - OTHER_DOC          → Documento genérico (adjunto libre)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerNotification } from '@/app/actions/notification.actions';
import { sendInfoRequestEmail } from '@/app/actions/comm.actions';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Tipos de solicitud válidos con etiquetas legibles */
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: memberId } = await params;
        const body = await request.json();
        const { petId, requestTypes, customMessage, adminId } = body;

        // --- Validaciones ---
        if (!petId) {
            return NextResponse.json({ error: 'petId es obligatorio' }, { status: 400 });
        }

        if (!requestTypes || !Array.isArray(requestTypes) || requestTypes.length === 0) {
            return NextResponse.json({ error: 'Debes seleccionar al menos un tipo de solicitud' }, { status: 400 });
        }

        // Validar que todos los tipos sean válidos
        const invalidTypes = requestTypes.filter((t: string) => !REQUEST_TYPES[t]);
        if (invalidTypes.length > 0) {
            return NextResponse.json({ error: `Tipos inválidos: ${invalidTypes.join(', ')}` }, { status: 400 });
        }

        console.log(`📋 [Request Info] Admin solicita ${requestTypes.join(', ')} para mascota ${petId} del miembro ${memberId}`);

        // 1. Obtener datos de la mascota
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('id, name, status')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
        }

        // 2. Obtener datos del usuario para el email
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, memberstack_id')
            .eq('memberstack_id', memberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // 3. Construir la lista legible de solicitudes
        const requestLabels = requestTypes.map((t: string) => `${REQUEST_TYPES[t].icon} ${REQUEST_TYPES[t].label}`);
        const requestMessage = `Se solicita la siguiente información para ${pet.name}:\n${requestLabels.join('\n')}${customMessage ? `\n\nMensaje del administrador: ${customMessage}` : ''}`;

        // 4. Insertar en appeal_logs con metadata
        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                pet_id: petId,
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
            });

        if (logError) {
            console.error('❌ Error creando log de solicitud:', logError);
            return NextResponse.json({ error: 'Error al registrar la solicitud' }, { status: 500 });
        }

        // 5. Actualizar estatus de la mascota a action_required (si no lo está ya)
        if (pet.status !== 'action_required') {
            await supabaseAdmin
                .from('pets')
                .update({
                    status: 'action_required',
                    last_admin_response: requestMessage
                })
                .eq('id', petId);
        }

        // 6. Crear notificación in-app para el miembro
        await createServerNotification({
            userId: memberId,
            type: 'account',
            title: `📋 Acción requerida: ${pet.name}`,
            message: `Necesitamos ${requestLabels.length === 1 ? requestLabels[0] : `${requestLabels.length} documentos`} para completar la revisión de ${pet.name}.`,
            icon: '📋',
            link: `/mi-membresia?petId=${petId}&action=chat`,
            metadata: { source: 'info_request', petId, requestTypes }
        });

        // 7. Enviar email vía Resend
        if (user.email) {
            const dashboardUrl = `https://club.pataamiga.mx/mi-membresia?petId=${petId}&action=chat`;
            
            try {
                await sendInfoRequestEmail({
                    userId: user.id,
                    userEmail: user.email,
                    userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    petName: pet.name,
                    petId: petId,
                    requestTypes: requestTypes.map((t: string) => ({
                        type: t,
                        label: REQUEST_TYPES[t].label,
                        icon: REQUEST_TYPES[t].icon,
                        description: REQUEST_TYPES[t].description
                    })),
                    customMessage: customMessage || null,
                    dashboardUrl
                });
                console.log(`📧 Email de solicitud enviado a ${user.email}`);
            } catch (emailErr) {
                console.error('⚠️ Error enviando email (no crítico):', emailErr);
            }
        }

        console.log(`✅ Solicitud de información creada para ${pet.name}`);

        return NextResponse.json({
            success: true,
            message: `Solicitud enviada correctamente para ${pet.name}`
        });

    } catch (error: any) {
        console.error('💥 Error en request-info API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
