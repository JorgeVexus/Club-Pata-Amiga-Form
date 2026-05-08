import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET_NAME = 'solidarity-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
        const userId = formData.get('userId') as string | null;
        const docType = formData.get('docType') as string | null; // evidence_photo, prescription, receipt

        if (!file || !userId || !docType) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios (file, userId, docType)' }, { status: 400, headers: corsHeaders });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'El archivo es muy grande. Máximo 10MB.' }, { status: 400, headers: corsHeaders });
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no válido.' }, { status: 400, headers: corsHeaders });
        }

        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${userId}/${docType}_${timestamp}.${fileExt}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Error subiendo documento solidario:', error);
            return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500, headers: corsHeaders });
        }

        // Al ser un bucket privado, devolvemos el path
        return NextResponse.json({
            success: true,
            path: data.path,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error en solidarity upload API:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
