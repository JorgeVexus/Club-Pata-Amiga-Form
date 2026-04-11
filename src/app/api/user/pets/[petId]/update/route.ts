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
        const { userId, photo1Url, photo2Url, vetCertificateUrl, message, adoptionStory } = body;

        console.log(`📝 [PetUpdate] Inicio: Usuario=${userId}, Pet=${petId}`);
        console.log('📦 Body:', JSON.stringify(body, null, 2));

        if (!userId) {
            return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400, headers: corsHeaders });
        }

        // 1. Obtener datos de la mascota (sin join complejo inicialmente)
        console.log('🔍 Buscando mascota...');
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            console.error('❌ Error buscando mascota:', petError);
            return NextResponse.json({ error: 'Mascota no encontrada o error de base de datos' }, { status: 404, headers: corsHeaders });
        }

        // 2. Obtener datos del dueño por separado para mayor seguridad
        console.log('🔍 Buscando dueño...');
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, first_name, last_name')
            .eq('id', pet.owner_id)
            .single();

        if (ownerError || !owner) {
            console.error('❌ Error buscando dueño:', ownerError);
            return NextResponse.json({ error: 'Dueño de mascota no encontrado' }, { status: 404, headers: corsHeaders });
        }

        // Verificar propiedad
        if (owner.memberstack_id !== userId) {
            console.warn(`🚫 Intento de edición no autorizado: ${userId} != ${owner.memberstack_id}`);
            return NextResponse.json({ error: 'No tienes permiso para editar esta mascota' }, { status: 403, headers: corsHeaders });
        }

        // Verificar que está en un status que permite actualización
        const allowedStatuses = ['action_required', 'rejected', 'appealed', 'pending'];
        const isOnlyAdoptionStory = adoptionStory && !photo1Url && !photo2Url && !vetCertificateUrl;
        
        if (!allowedStatuses.includes(pet.status) && !isOnlyAdoptionStory) {
            return NextResponse.json({
                error: 'Solo puedes actualizar información cuando el equipo lo haya solicitado o cuando tu mascota esté bajo revisión.'
            }, { status: 400, headers: corsHeaders });
        }

        // 3. Preparar los campos a actualizar
        const updateData: Record<string, any> = {};

        // Determinar el nuevo status
        if ((pet.status === 'action_required' || pet.status === 'rejected') && !isOnlyAdoptionStory) {
            updateData.status = 'pending';
        }

        // Actualizar URLs
        if (isValidUrl(photo1Url)) {
            updateData.photo_url = photo1Url;
            console.log('📷 URL Foto 1:', photo1Url);
        }
        if (isValidUrl(photo2Url)) {
            updateData.photo2_url = photo2Url;
            console.log('📷 URL Foto 2:', photo2Url);
        }
        if (isValidUrl(vetCertificateUrl)) {
            updateData.vet_certificate_url = vetCertificateUrl;
            updateData.vet_certificate_uploaded = true;
            console.log('📜 URL Certificado:', vetCertificateUrl);
        }
        
        // Actualizar Historia de Adopción
        if (adoptionStory && typeof adoptionStory === 'string') {
            updateData.adoption_story = adoptionStory;
            console.log('📖 Historia de Adopción:', adoptionStory);
            
            // También deberíamos sincronizarlo con el perfil del usuario si fuera posible, 
            // pero ya que es algo directo en la tabla pets, por ahora con la tabla pets es suficiente, 
            // o lo guardamos en users si sabemos el slot. Como no es trivial aquí, dejemos solo en pets.
        }

        if (Object.keys(updateData).length === 0 && !message) {
            return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400, headers: corsHeaders });
        }

        console.log('📋 Actualizando mascota en DB...', JSON.stringify(updateData));

        // 4. Ejecutar actualización
        const { error: updateError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', petId);

        if (updateError) {
            console.error('❌ Error actualizando mascota:', updateError);
            return NextResponse.json({ error: `Error DB (Update): ${updateError.message}` }, { status: 500, headers: corsHeaders });
        }

        // 5. Registrar en logs
        console.log('✍️ Insertando en appeal_logs...');
        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: userId,
                pet_id: petId,
                type: 'user_update',
                message: message || 'El usuario actualizó la información de su mascota',
                metadata: {
                    photo1_updated: isValidUrl(photo1Url),
                    photo2_updated: isValidUrl(photo2Url),
                    vet_certificate_updated: isValidUrl(vetCertificateUrl)
                },
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('⚠️ Error insertando log (no crítico):', logError);
        }

        // 6. Crear notificación para admins
        console.log('🔔 Creando notificación admin...');
        const ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Usuario';
        
        const { error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin',
                type: 'account',
                title: `📎 ${ownerName} actualizó información`,
                message: `${ownerName} actualizó las fotos de ${pet.name}.`,
                icon: '📎',
                link: `/admin/dashboard?member=${userId}`,
                is_read: false,
                metadata: { petId, petName: pet.name, userId, ownerId: owner.id, ownerName },
                created_at: new Date().toISOString()
            });

        if (notificationError) {
            console.error('⚠️ Error notificando al admin (no crítico):', notificationError);
        }

        console.log(`✅ Mascota ${petId} procesada correctamente.`);

        return NextResponse.json({
            success: true,
            message: 'Información actualizada correctamente.'
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('💥 Error CRÍTICO en pet update API:', error);
        return NextResponse.json({ 
            error: 'Error interno del servidor',
            details: error.message 
        }, { status: 500, headers: corsHeaders });
    }
}

// Helper para validar URLs
function isValidUrl(url: any): boolean {
    return !!(url && typeof url === 'string' && url.trim() !== '');
}

