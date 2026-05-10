import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET_NAME = 'solidarity-documents';
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const requestId = formData.get('requestId') as string | null;

        if (!file || !requestId) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios (file, requestId)' }, { status: 400, headers: corsHeaders });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'El archivo es muy grande. Máximo 15MB.' }, { status: 400, headers: corsHeaders });
        }

        const validTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        // No bloqueamos estrictamente todos los tipos pero damos una lista de sugerencias
        // Si queremos ser muy abiertos:
        // if (file.type === '') ... 

        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `chat/${requestId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type || 'application/octet-stream',
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Error subiendo adjunto de chat:', error);
            return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500, headers: corsHeaders });
        }

        // Devolvemos el path (en Supabase, al ser bucket privado, se usa el path para generar signed urls luego)
        return NextResponse.json({
            success: true,
            path: data.path,
            url: data.path, // Usamos el path como identificador
            fileName: file.name
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en chat attachment upload API:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
