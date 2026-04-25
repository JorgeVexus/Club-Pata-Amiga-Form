/**
 * API Route: /api/user/update-pet-docs
 *
 * Actualiza los documentos de una mascota en Supabase y Memberstack.
 * Acepta autenticación por token (magic link).
 *
 * POST body: { memberId, petId, fields, token?, exp?, petIndex? }
 *
 * fields: { photo_url?: string, vet_certificate_url?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyUploadToken } from '@/utils/upload-token';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { memberId, petId, fields, token, exp, petIndex } = await req.json();

        if (!memberId || !fields || Object.keys(fields).length === 0) {
            return NextResponse.json({ success: false, error: 'Parámetros incompletos' }, { status: 400 });
        }

        // Verificar autenticación: token del magic link
        if (token && exp && petIndex) {
            const isValid = verifyUploadToken(memberId, Number(petIndex), token, Number(exp));
            if (!isValid) {
                return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
            }
        } else {
            return NextResponse.json({ success: false, error: 'Autenticación requerida' }, { status: 401 });
        }

        // Buscar el usuario en Supabase
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Si tenemos petId, actualizar directamente; sino buscar por índice
        let targetPetId = petId;

        if (!targetPetId) {
            const { data: pets, error: petsError } = await supabaseAdmin
                .from('pets')
                .select('id')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: true });

            if (petsError || !pets || pets.length === 0) {
                return NextResponse.json({ success: false, error: 'Mascotas no encontradas' }, { status: 404 });
            }

            const idx = Number(petIndex) - 1;
            if (idx < 0 || idx >= pets.length) {
                return NextResponse.json({ success: false, error: 'Índice de mascota inválido' }, { status: 404 });
            }

            targetPetId = pets[idx].id;
        }

        // Construir campos a actualizar en Supabase
        const supabaseUpdate: Record<string, any> = {
            status: 'pending' // Regresa a revisión al subir documentos
        };
        if (fields.photo_url) supabaseUpdate.photo_url = fields.photo_url;
        if (fields.vet_certificate_url) supabaseUpdate.vet_certificate_url = fields.vet_certificate_url;

        console.log(`📝 [UpdatePetDocs] Actualizando pet ${targetPetId}:`, Object.keys(supabaseUpdate));

        // Actualizar en Supabase
        const { data: updatedPet, error: updateError } = await supabaseAdmin
            .from('pets')
            .update(supabaseUpdate)
            .eq('id', targetPetId)
            .select('name')
            .single();

        if (updateError) {
            console.error('❌ [UpdatePetDocs] Error actualizando Supabase:', updateError);
            return NextResponse.json({ success: false, error: 'Error actualizando la mascota' }, { status: 500 });
        }

        // 1. Recalcular status global del miembro
        try {
            const { recalculateMemberStatus } = await import('@/utils/member-status');
            await recalculateMemberStatus(memberId);
        } catch (statusError) {
            console.error('⚠️ [UpdatePetDocs] Error recalculando status de miembro:', statusError);
        }

        // 2. Notificación para el admin (Bell)
        try {
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: 'admin',
                    type: 'account',
                    title: `📧 Documentación recibida (${updatedPet.name})`,
                    message: `Un miembro ha subido documentos faltantes para ${updatedPet.name} vía magic link.`,
                    icon: '📧',
                    link: `/admin/dashboard?member=${memberId}`,
                    is_read: false,
                    created_at: new Date().toISOString()
                });
        } catch (notifError) {
            console.error('⚠️ [UpdatePetDocs] Error creando notificación admin:', notifError);
        }

        console.log(`✅ [UpdatePetDocs] Mascota ${targetPetId} actualizada exitosamente`);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('❌ [UpdatePetDocs] Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
