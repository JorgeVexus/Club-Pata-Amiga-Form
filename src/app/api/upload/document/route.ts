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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string || 'document'; // ine_front, ine_back, proof_of_address
        const memberstackId = formData.get('memberstackId') as string | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionó archivo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Determinar bucket basado en el tipo
        let bucket = 'ine-documents';
        if (type === 'proof_of_address') {
            bucket = 'proof-of-address';
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
        const fileName = `${memberstackId || 'anon'}_${type}_${timestamp}_${randomString}.${extension}`;
        const filePath = memberstackId ? `${memberstackId}/${fileName}` : fileName;

        // Convertir a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Error uploading document:', error);
            return NextResponse.json(
                { success: false, error: 'Error al subir el archivo' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Generar URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            fileName: fileName
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
