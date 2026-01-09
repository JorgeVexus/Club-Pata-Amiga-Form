/**
 * API Route: /api/user/pets/[petId]/update
 * Permite al usuario actualizar la información de su mascota
 * Solo funciona cuando el admin ha solicitado información (status = action_required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ petId: string }> }
) {
    try {
        const { petId } = await params;
        const { userId, photo1Url, photo2Url, message } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 });
        }

        console.log(`📝 Usuario ${userId} actualizando mascota ${petId}...`);

        // 1. Verificar que la mascota pertenece al usuario y está en action_required
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('*, owner:users!owner_id(memberstack_id)')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
        }

        // Verificar propiedad
        if (pet.owner?.memberstack_id !== userId) {
            return NextResponse.json({ error: 'No tienes permiso para editar esta mascota' }, { status: 403 });
        }

        // Verificar que está en action_required
        if (pet.status !== 'action_required') {
            return NextResponse.json({
                error: 'Solo puedes actualizar información cuando el equipo lo haya solicitado'
            }, { status: 400 });
        }

        // 2. Preparar los campos a actualizar
        const updateData: Record<string, any> = {
            status: 'pending', // Cambiar a pending para re-revisión
            updated_at: new Date().toISOString()
        };

        if (photo1Url) {
            updateData.photo_url = photo1Url;
        }
        if (photo2Url) {
            updateData.photo2_url = photo2Url;
        }

        // 3. Actualizar la mascota
        const { error: updateError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', petId);

        if (updateError) {
            console.error('Error actualizando mascota:', updateError);
            return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
        }

        // 4. Registrar en appeal_logs
        const logMessage = message || 'El usuario actualizó la información de su mascota';
        await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: userId,
                pet_id: petId,
                type: 'user_update',
                message: logMessage,
                metadata: {
                    photo1_updated: !!photo1Url,
                    photo2_updated: !!photo2Url
                },
                created_at: new Date().toISOString()
            });

        console.log(`✅ Mascota ${petId} actualizada por usuario ${userId}`);

        return NextResponse.json({
            success: true,
            message: 'Información actualizada correctamente. El equipo revisará tus cambios pronto.'
        });

    } catch (error: any) {
        console.error('Error en pet update API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
