/**
 * API Endpoint: POST /api/user/update-profile
 *
 * Actualiza los datos personales del usuario en Supabase.
 * NO modifica Memberstack (el email es el identificador y no cambia).
 * NO modifica el plan ni el estado de la membresía.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            memberstackId,
            first_name,
            last_name,
            mother_last_name,
            phone,
            address,
            colony,
            city,
            state,
            postal_code,
            birth_date,
            avatar_url,
            curp,
            gender,
            nationality,
            nationality_code,
            ine_front_url,
            ine_back_url,
            proof_of_address_url,
            is_foreigner
        } = body;

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400 }
            );
        }

        console.log(`[UPDATE-PROFILE] Actualizando perfil para: ${memberstackId}`);

        // Construir solo los campos que vienen en el body (no sobreescribir con undefined)
        const updatePayload: Record<string, unknown> = {};

        if (first_name !== undefined) updatePayload.first_name = first_name.trim();
        if (last_name !== undefined) updatePayload.last_name = last_name.trim();
        if (mother_last_name !== undefined) updatePayload.mother_last_name = mother_last_name.trim();
        if (phone !== undefined) updatePayload.phone = phone.trim();
        if (address !== undefined) updatePayload.address = address.trim();
        if (colony !== undefined) updatePayload.colony = colony.trim();
        if (city !== undefined) updatePayload.city = city.trim();
        if (state !== undefined) updatePayload.state = state.trim();
        if (postal_code !== undefined) updatePayload.postal_code = postal_code.trim();
        if (birth_date !== undefined) updatePayload.birth_date = birth_date;
        if (curp !== undefined) updatePayload.curp = curp.trim().toUpperCase();
        if (gender !== undefined) updatePayload.gender = gender;

        // Note: nationality, avatar_url, and is_foreigner are NOT columns in the users table 
        // based on the supabase-setup.sql schema. We will skip updating them to prevent SQL errors.

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updatePayload)
            .eq('memberstack_id', memberstackId)
            .select('*')
            .single();

        if (error) {
            console.error('[UPDATE-PROFILE] Error actualizando Supabase (users):', error);
            return NextResponse.json(
                { success: false, error: 'Error actualizando el perfil', details: error.message },
                { status: 500 }
            );
        }

        // --- Handle Documents Updates ---
        // If document URLs are provided, we should ideally extract the path from the URL 
        // and upsert them into the documents table. 
        // Since the upload API already uploads to storage, we just need to ensure the DB record exists.
        
        const documentsToUpsert = [];
        
        // Helper function to extract file_path and file_name from a Supabase public URL
        const extractFileInfo = (url: string) => {
            try {
                // URLs look like: .../storage/v1/object/public/ine-documents/member_id_ine_front_123.jpg
                const parts = url.split('/');
                const fileName = parts.pop() || '';
                // For simplicity, we can use the file name as the path if we assume a flat structure or 
                // just save the full URL if we don't need strict path tracking.
                // However, the schema expects 'file_path' and 'file_name'.
                const pathParts = url.split('/public/')[1]?.split('/') || [];
                pathParts.shift(); // remove bucket name
                const filePath = pathParts.join('/');
                
                return { file_path: filePath || fileName, file_name: fileName };
            } catch (e) {
                return null;
            }
        };

        if (data && data.id) {
            if (ine_front_url) {
                const info = extractFileInfo(ine_front_url);
                if (info) {
                    documentsToUpsert.push({
                        user_id: data.id,
                        document_type: 'ine_front',
                        file_name: info.file_name,
                        file_path: info.file_path
                    });
                }
            }
            if (ine_back_url) {
                const info = extractFileInfo(ine_back_url);
                if (info) {
                    documentsToUpsert.push({
                        user_id: data.id,
                        document_type: 'ine_back',
                        file_name: info.file_name,
                        file_path: info.file_path
                    });
                }
            }
            if (proof_of_address_url) {
                const info = extractFileInfo(proof_of_address_url);
                if (info) {
                    documentsToUpsert.push({
                        user_id: data.id,
                        document_type: 'proof_of_address',
                        file_name: info.file_name,
                        file_path: info.file_path
                    });
                }
            }

            if (documentsToUpsert.length > 0) {
                // Upsert to documents table
                // Since there is no unique constraint on (user_id, document_type), 
                // we should ideally delete existing ones of that type first or use a more complex query.
                // For safety and simplicity here, we will just insert. In a real scenario, you'd clean up old docs.
                for (const doc of documentsToUpsert) {
                     // Delete old document of same type
                     await supabaseAdmin
                         .from('documents')
                         .delete()
                         .match({ user_id: data.id, document_type: doc.document_type });
                         
                     // Insert new
                     await supabaseAdmin
                         .from('documents')
                         .insert([doc]);
                }
            }
        }

        console.log(`[UPDATE-PROFILE] Perfil actualizado exitosamente para ${memberstackId}`);

        return NextResponse.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: data,
        });

    } catch (error: any) {
        console.error('[UPDATE-PROFILE] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error procesando la solicitud', details: error.message },
            { status: 500 }
        );
    }
}
