import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database not configured' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const campaign = formData.get('campaign') as string || 'regalo';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionó archivo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validar tipo de archivo (solo PDFs)
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { success: false, error: 'Tipo de archivo no permitido. Solo se permiten archivos PDF.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validar tamaño (máx 15MB)
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'El archivo es demasiado grande. Máximo 15MB.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const slotName = `campaign-${campaign}-pdf`;
        const extension = 'pdf';
        const timestamp = Date.now();
        const fileName = `${slotName}_${timestamp}.${extension}`;

        // Convertir a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Subir a Supabase Storage (bucket 'site-assets')
        const { error: uploadError } = await supabase.storage
            .from('site-assets')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading campaign pdf:', uploadError);
            return NextResponse.json(
                { success: false, error: 'Error al subir el archivo a storage' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Generar URL pública
        const { data: urlData } = supabase.storage
            .from('site-assets')
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Upsert en la tabla 'site_assets'
        const { error: dbError } = await supabase
            .from('site_assets')
            .upsert({
                slot: slotName,
                url: publicUrl,
                updated_at: new Date().toISOString()
            }, { onConflict: 'slot' });

        if (dbError) {
            console.error('Error saving site asset record:', dbError);
            return NextResponse.json(
                { success: false, error: 'Error al registrar el archivo en la base de datos' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Campaign PDF upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
