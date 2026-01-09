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

// Headers CORS para permitir requests desde Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handler para preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ petId: string }> }
) {
    try {
        const { petId } = await params;
        const body = await request.json();
        const { userId, photo1Url, photo2Url, message } = body;

        console.log(`📝 Usuario ${userId} actualizando mascota ${petId}...`);
        console.log('📦 Body recibido:', JSON.stringify(body, null, 2));

        if (!userId) {
            return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400, headers: corsHeaders });
        }

        // 1. Verificar que la mascota pertenece al usuario y está en action_required
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('*, owner:users!owner_id(memberstack_id)')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
        }

        // Verificar propiedad
        if (pet.owner?.memberstack_id !== userId) {
            return NextResponse.json({ error: 'No tienes permiso para editar esta mascota' }, { status: 403, headers: corsHeaders });
        }

        // Verificar que está en action_required
        if (pet.status !== 'action_required') {
            return NextResponse.json({
                error: 'Solo puedes actualizar información cuando el equipo lo haya solicitado'
            }, { status: 400, headers: corsHeaders });
        }

        // 2. Preparar los campos a actualizar
        // Ahora soportamos photo_url y photo2_url
        const updateData: Record<string, any> = {
            status: 'pending' // Cambiar a pending para re-revisión
        };

        // Actualizar foto 1 si viene con valor válido
        if (photo1Url && typeof photo1Url === 'string' && photo1Url.trim() !== '') {
            updateData.photo_url = photo1Url;
            console.log('📷 Actualizando foto 1:', photo1Url);
        }

        // Actualizar foto 2 si viene con valor válido
        if (photo2Url && typeof photo2Url === 'string' && photo2Url.trim() !== '') {
            updateData.photo2_url = photo2Url;
            console.log('📷 Actualizando foto 2:', photo2Url);
        }

        console.log('📋 Campos a actualizar:', JSON.stringify(updateData, null, 2));



        // 3. Actualizar la mascota
        const { error: updateError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', petId);

        if (updateError) {
            console.error('Error actualizando mascota:', updateError);
            return NextResponse.json({ error: 'Error al actualizar' }, { status: 500, headers: corsHeaders });
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
                    photo1_updated: !!(photo1Url && photo1Url.trim()),
                    photo2_updated: !!(photo2Url && photo2Url.trim())
                },
                created_at: new Date().toISOString()
            });

        // 5. 🆕 Crear notificación para los admins
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin', // Notificación para admins
                type: 'account',
                title: '📎 Usuario actualizó información',
                message: `El usuario actualizó la información de ${pet.name}. Revísala en Gestión General.`,
                icon: '📎',
                link: '/admin',
                is_read: false,
                metadata: { petId, petName: pet.name, userId },
                created_at: new Date().toISOString()
            });

        console.log(`✅ Mascota ${petId} actualizada por usuario ${userId} y admin notificado`);

        return NextResponse.json({
            success: true,
            message: 'Información actualizada correctamente. El equipo revisará tus cambios pronto.'
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en pet update API:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
