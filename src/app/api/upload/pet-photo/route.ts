/**
 * API Route: /api/upload/pet-photo
 * Permite al usuario subir fotos de mascota directamente desde el widget
 * Devuelve la URL pública del archivo subido
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET_NAME = 'pet-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const userId = formData.get('userId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400, headers: corsHeaders });
        }

        if (!userId) {
            return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400, headers: corsHeaders });
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'El archivo es muy grande. Máximo 5MB.' }, { status: 400, headers: corsHeaders });
        }

        // Validar tipo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no válido. Usa JPG, PNG o WebP.' }, { status: 400, headers: corsHeaders });
        }

        console.log(`📷 Subiendo foto para usuario ${userId}...`);

        // Generar nombre único
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`;

        // Convertir File a Buffer para Supabase
        const buffer = Buffer.from(await file.arrayBuffer());

        // Subir a Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Error subiendo archivo:', error);
            return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500, headers: corsHeaders });
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        console.log(`✅ Foto subida exitosamente: ${urlData.publicUrl}`);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: data.path
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en upload API:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
