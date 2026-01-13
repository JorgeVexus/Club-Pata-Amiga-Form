import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// POST - Subir documento de embajador
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string || 'document';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionó archivo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o PDF.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validar tamaño (máx 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'El archivo es demasiado grande. Máximo 5MB.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Generar nombre único
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `ambassador_${type}_${timestamp}_${randomString}.${extension}`;
        const filePath = `ambassadors/${fileName}`;

        // Convertir a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Error uploading ambassador document:', error);
            return NextResponse.json(
                { success: false, error: 'Error al subir el archivo' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Generar URL pública
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            fileName: fileName
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Ambassador doc upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
