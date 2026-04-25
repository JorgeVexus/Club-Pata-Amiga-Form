/**
 * API Route: /api/user/fulfill-request
 *
 * Cuando un miembro responde a una solicitud de información del admin,
 * este endpoint:
 *   1. Sube el archivo al bucket correcto de Supabase
 *   2. Actualiza el campo correspondiente en la tabla `pets`
 *   3. Registra la acción en `appeal_logs` con metadata
 *   4. Crea notificación para el admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/** Mapeo de tipos de solicitud a buckets y campos en la tabla `pets` */
const FIELD_MAP: Record<string, { bucket: string; petField: string; label: string }> = {
    PET_PHOTO_1: { bucket: 'pet-photos', petField: 'photo_url', label: 'Foto Principal' },
    PET_VET_CERT: { bucket: 'vet-certificates', petField: 'vet_certificate_url', label: 'Certificado Médico' },
    OTHER_DOC: { bucket: 'pet-photos', petField: '', label: 'Documento Adicional' },
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const userId = formData.get('userId') as string;
        const petId = formData.get('petId') as string;
        const requestType = formData.get('requestType') as string;
        const logId = formData.get('logId') as string | null; // ID del appeal_log que originó la solicitud

        // --- Validaciones ---
        if (!userId || !petId || !requestType) {
            return NextResponse.json({ error: 'userId, petId y requestType son obligatorios' }, { status: 400, headers: corsHeaders });
        }

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400, headers: corsHeaders });
        }

        const mapping = FIELD_MAP[requestType];
        if (!mapping) {
            return NextResponse.json({ error: `Tipo de solicitud inválido: ${requestType}` }, { status: 400, headers: corsHeaders });
        }

        // Validar tamaño (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo excede el límite de 10MB' }, { status: 400, headers: corsHeaders });
        }

        // Verificar que la mascota existe
        const { data: pet, error: petError } = await supabaseAdmin
            .from('pets')
            .select('id, name')
            .eq('id', petId)
            .single();

        if (petError || !pet) {
            return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
        }

        console.log(`📤 [FulfillRequest] Subiendo ${mapping.label} para ${pet.name} (${petId})`);

        // 1. Subir archivo a Supabase Storage
        const ext = file.name.split('.').pop() || 'jpg';
        const sanitizedName = pet.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `${userId}/${sanitizedName}-${requestType.toLowerCase()}-${Date.now()}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(mapping.bucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Error subiendo archivo:', uploadError);
            return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500, headers: corsHeaders });
        }

        // 2. Obtener URL pública
        const { data: publicUrl } = supabaseAdmin.storage
            .from(mapping.bucket)
            .getPublicUrl(uploadData.path);

        const fileUrl = publicUrl.publicUrl;

        // 3. Actualizar el campo de la mascota y su estado
        if (mapping.petField) {
            const { error: updateError } = await supabaseAdmin
                .from('pets')
                .update({ 
                    [mapping.petField]: fileUrl,
                    status: 'pending' // Regresa a revisión al completar info
                })
                .eq('id', petId);

            if (updateError) {
                console.error('❌ Error actualizando campo de mascota:', updateError);
            } else {
                console.log(`✅ Campo ${mapping.petField} y status actualizados para ${pet.name}`);
                
                // 3.1 Recalcular status global del miembro
                try {
                    const { recalculateMemberStatus } = await import('@/utils/member-status');
                    await recalculateMemberStatus(userId);
                } catch (statusError) {
                    console.error('⚠️ Error recalculando status de miembro:', statusError);
                }
            }
        }

        // 4. Registrar en appeal_logs
        const isImage = file.type.startsWith('image/');
        const linkText = isImage ? `[Imagen adjunta](${fileUrl})` : `[Archivo adjunto](${fileUrl})`;
        const logMessage = `✅ ${mapping.label} actualizado(a): ${linkText}`;

        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: userId,
                pet_id: petId,
                type: 'user_fulfill',
                message: logMessage,
                metadata: {
                    source: 'fulfill_request',
                    request_type: requestType,
                    file_url: fileUrl,
                    original_log_id: logId || null,
                    pet_field_updated: mapping.petField || null
                },
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('⚠️ Error registrando log:', logError);
        }

        // 5. Si hay un logId de solicitud original, marcar como fulfilled en su metadata
        if (logId) {
            const { data: originalLog } = await supabaseAdmin
                .from('appeal_logs')
                .select('metadata')
                .eq('id', logId)
                .single();

            if (originalLog?.metadata?.items) {
                const updatedItems = originalLog.metadata.items.map((item: any) => {
                    if (item.type === requestType) {
                        return { ...item, fulfilled: true, fulfilled_at: new Date().toISOString(), file_url: fileUrl };
                    }
                    return item;
                });

                await supabaseAdmin
                    .from('appeal_logs')
                    .update({ metadata: { ...originalLog.metadata, items: updatedItems } })
                    .eq('id', logId);
            }
        }

        // 6. Notificación para el admin
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: 'admin',
                type: 'account',
                title: `📤 ${pet.name}: ${mapping.label} recibido(a)`,
                message: `Un miembro ha subido ${mapping.label} en respuesta a tu solicitud.`,
                icon: '📤',
                link: `/admin/dashboard?member=${userId}`,
                is_read: false,
                created_at: new Date().toISOString()
            });

        console.log(`✅ [FulfillRequest] ${mapping.label} procesado para ${pet.name}`);

        return NextResponse.json({
            success: true,
            message: `${mapping.label} actualizado(a) correctamente`,
            url: fileUrl,
            fieldUpdated: mapping.petField || null
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('💥 Error en fulfill-request:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
