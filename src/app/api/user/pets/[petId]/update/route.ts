/**
 * API Route: /api/user/pets/[petId]/update
 * Permite al usuario actualizar la información de su mascota
 * Solo funciona cuando el admin ha solicitado información (status = action_required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isUnsubscribedPetWithHistory } from '@/utils/pet-lifecycle';
import { getMissingCompletePetFields } from '@/utils/pet-required-fields';
import {
    buildPetUpdateNotificationMessage,
    getPetUpdateLabels,
} from '@/utils/pet-update-notification';

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
        const {
            userId,
            photo1Url,
            photo2Url,
            photo3Url,
            photo4Url,
            photo5Url,
            vetCertificateUrl,
            message,
            adoptionStory,
            birthMonth,
            birthYear,
            gender,
            coatColor,
            noseColor,
            eyeColor,
            isMixedBreed,
            breed,
            isAdopted
        } = body;

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
        if (isUnsubscribedPetWithHistory(pet)) {
            return NextResponse.json({
                error: 'Esta mascota ya fue dada de baja y no puede actualizarse ni volver a revisión.'
            }, { status: 409, headers: corsHeaders });
        }

        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, first_name, last_name')
            .eq('id', pet.owner_id)
            .single();

        if (ownerError || !owner) {
            console.error('❌ Error buscando dueño:', ownerError);
            return NextResponse.json({ error: 'Dueño de mascota no encontrado' }, { status: 404, headers: corsHeaders });
        }

        const { data: unsubscriptions } = await supabaseAdmin
            .from('pet_unsubscriptions')
            .select('id, pet_id, pet_index, pet_name, reason, description, status, requested_at, reviewed_at, created_at')
            .eq('memberstack_id', owner.memberstack_id)
            .order('created_at', { ascending: false });

        if (isUnsubscribedPetWithHistory(pet, unsubscriptions || [])) {
            return NextResponse.json({
                error: 'Esta mascota ya fue dada de baja y no puede actualizarse ni volver a revisión.'
            }, { status: 409, headers: corsHeaders });
        }

        // Verificar propiedad
        if (owner.memberstack_id !== userId) {
            console.warn(`🚫 Intento de edición no autorizado: ${userId} != ${owner.memberstack_id}`);
            return NextResponse.json({ error: 'No tienes permiso para editar esta mascota' }, { status: 403, headers: corsHeaders });
        }

        // Verificar que está en un status que permite actualización
        const allowedStatuses = ['action_required', 'rejected', 'appealed', 'pending', 'pending_approval', 'waiting_approval', 'approved'];
        const isDocumentOrComplementaryUpdate = photo1Url || photo2Url || vetCertificateUrl || gender || coatColor || noseColor || eyeColor || breed;
        const isOnlyAdoptionStoryOrBirthday = (adoptionStory || birthMonth || birthYear) && !isDocumentOrComplementaryUpdate;
        
        if (!allowedStatuses.includes(pet.status) && !isOnlyAdoptionStoryOrBirthday) {
            return NextResponse.json({
                error: 'Solo puedes actualizar información cuando el equipo lo haya solicitado o cuando tu mascota esté bajo revisión.'
            }, { status: 400, headers: corsHeaders });
        }

        // 3. Preparar los campos a actualizar
        const updateData: Record<string, any> = {};

        // Determinar el nuevo status
        if ((pet.status === 'action_required' || pet.status === 'rejected') && !isOnlyAdoptionStoryOrBirthday) {
            updateData.status = 'pending';
        }

        // Actualizar URLs - permitir borrado explícito con null o ""
        if (photo1Url !== undefined) {
            if (isValidUrl(photo1Url)) {
                updateData.photo_url = photo1Url;
                updateData.primary_photo_url = photo1Url;
            } else {
                // null o "" = borrar la foto
                updateData.photo_url = null;
                updateData.primary_photo_url = null;
            }
            console.log('📷 URL Foto 1:', photo1Url);
        }
        if (photo2Url !== undefined) {
            if (isValidUrl(photo2Url)) {
                updateData.photo2_url = photo2Url;
            } else {
                updateData.photo2_url = null;
            }
            console.log('📷 URL Foto 2:', photo2Url);
        }
        if (photo3Url !== undefined) {
            if (isValidUrl(photo3Url)) {
                updateData.photo3_url = photo3Url;
            } else {
                updateData.photo3_url = null;
            }
            console.log('📷 URL Foto 3:', photo3Url);
        }
        if (photo4Url !== undefined) {
            if (isValidUrl(photo4Url)) {
                updateData.photo4_url = photo4Url;
            } else {
                updateData.photo4_url = null;
            }
            console.log('📷 URL Foto 4:', photo4Url);
        }
        if (photo5Url !== undefined) {
            if (isValidUrl(photo5Url)) {
                updateData.photo5_url = photo5Url;
            } else {
                updateData.photo5_url = null;
            }
            console.log('📷 URL Foto 5:', photo5Url);
        }
        if (vetCertificateUrl !== undefined) {
            if (isValidUrl(vetCertificateUrl)) {
                updateData.vet_certificate_url = vetCertificateUrl;
                updateData.vet_certificate_uploaded = true;
            } else {
                updateData.vet_certificate_url = null;
                updateData.vet_certificate_uploaded = false;
            }
            console.log('📜 URL Certificado:', vetCertificateUrl);
        }
        
        // Actualizar género
        if (gender !== undefined && gender !== null) {
            updateData.gender = gender;
        }

        // Actualizar colores
        if (coatColor !== undefined && coatColor !== null) {
            updateData.coat_color = coatColor;
        }
        if (noseColor !== undefined && noseColor !== null) {
            updateData.nose_color = noseColor;
        }
        if (eyeColor !== undefined && eyeColor !== null) {
            updateData.eye_color = eyeColor;
        }

        // Actualizar tipo de raza y raza
        if (isMixedBreed !== undefined && isMixedBreed !== null) {
            updateData.is_mixed_breed = isMixedBreed;
        }
        if (breed !== undefined && breed !== null) {
            updateData.breed = breed;
        }

        // Actualizar adopción
        if (isAdopted !== undefined && isAdopted !== null) {
            updateData.is_adopted = isAdopted;
        }

        // Actualizar Historia de Adopción
        if (adoptionStory && typeof adoptionStory === 'string') {
            updateData.adoption_story = adoptionStory;
            console.log('📖 Historia de Adopción:', adoptionStory);
        }

        // Actualizar Cumpleaños
        if (birthMonth !== undefined && birthMonth !== null) {
            updateData.birth_month = parseInt(birthMonth, 10) || null;
        }
        if (birthYear !== undefined && birthYear !== null) {
            updateData.birth_year = parseInt(birthYear, 10) || null;
        }

        const mergedForCompleteness = {
            ...pet,
            ...updateData,
            name: pet.name,
            petType: pet.pet_type,
            ageValue: pet.age_value,
            ageUnit: pet.age_unit,
            gender: updateData.gender ?? pet.gender,
            breed: updateData.breed ?? pet.breed,
            isMixedBreed: updateData.is_mixed_breed ?? pet.is_mixed_breed,
            coatColor: updateData.coat_color ?? pet.coat_color,
        };
        const missingRequiredFields = getMissingCompletePetFields(mergedForCompleteness);

        // Solo marcamos como completa si la mascota, al combinar estado actual + cambios, ya cumple
        if (missingRequiredFields.length === 0) {
            updateData.basic_info_completed = true;
            updateData.complementary_info_completed = true;
        } else if (gender || coatColor || breed || photo1Url) {
            updateData.complementary_info_completed = false;
        }

        if (Object.keys(updateData).length === 0 && !message) {
            return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400, headers: corsHeaders });
        }

        console.log('📋 Actualizando mascota en DB...', JSON.stringify(updateData));
        
        // 4. Ejecutar actualización con manejo de fallback para columnas faltantes
        let { error: updateError } = await supabaseAdmin
            .from('pets')
            .update(updateData)
            .eq('id', petId);
           
        // Si el error es PGRST204 significa que alguna columna no existe (ej. photo3_url)
        if (updateError && updateError.code === 'PGRST204') {
            console.warn('⚠️ [PetUpdate] Columnas extendidas no existen. Reintentando sin fotos adicionales...');
            
            // Filtrar las columnas que sabemos que podrían faltar
            const safeUpdateData = { ...updateData };
            delete safeUpdateData.photo3_url;
            delete safeUpdateData.photo4_url;
            delete safeUpdateData.photo5_url;
            
            const retryResult = await supabaseAdmin
                .from('pets')
                .update(safeUpdateData)
                .eq('id', petId);
            
            updateError = retryResult.error;
        }

        if (updateError) {
            console.error('❌ Error actualizando mascota:', updateError);
            return NextResponse.json({ error: `Error DB (Update): ${updateError.message}` }, { status: 500, headers: corsHeaders });
        }

        const updatedLabels = getPetUpdateLabels(body, pet);

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
                    photo1_updated: photo1Url !== undefined,
                    photo2_updated: photo2Url !== undefined,
                    photo3_updated: photo3Url !== undefined,
                    photo4_updated: photo4Url !== undefined,
                    photo5_updated: photo5Url !== undefined,
                    vet_certificate_updated: vetCertificateUrl !== undefined,
                    updated_fields: updatedLabels
                },
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('⚠️ Error insertando log (no crítico):', logError);
        }

        // 6. Crear notificación para admins
        console.log('🔔 Creando notificación admin...');
        const ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Usuario';
        const notificationMessage = buildPetUpdateNotificationMessage({
            ownerName,
            petName: pet.name,
            updatedLabels
        });
        
        const { error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin',
                type: 'account',
                title: `📎 ${ownerName} actualizó información`,
                message: notificationMessage,
                icon: '📎',
                link: `/admin/dashboard?member=${userId}`,
                is_read: false,
                metadata: { petId, petName: pet.name, userId, ownerId: owner.id, ownerName, updatedFields: updatedLabels },
                created_at: new Date().toISOString()
            });

        if (notificationError) {
            console.error('⚠️ Error notificando al admin (no crítico):', notificationError);
        }

        // 7. Recalcular status global del miembro
        try {
            const { recalculateMemberStatus } = await import('@/utils/member-status');
            await recalculateMemberStatus(owner.memberstack_id);
        } catch (statusError) {
            console.error('⚠️ [PetUpdate] Error recalculando status de miembro:', statusError);
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
