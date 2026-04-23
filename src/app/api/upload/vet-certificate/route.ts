/**
 * API Route: /api/upload/vet-certificate
 * Permite subir el certificado veterinario de una mascota.
 * Acepta: memberId y petIndex como parámetros de formulario.
 * Bucket: vet-certificates (privado en Supabase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET_NAME = 'vet-certificates';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
        const file      = formData.get('file') as File | null;
        const memberId  = formData.get('memberId') as string | null;
        const petIndex  = formData.get('petIndex') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400, headers: corsHeaders });
        }
        if (!memberId || !petIndex) {
            return NextResponse.json({ error: 'memberId y petIndex son obligatorios' }, { status: 400, headers: corsHeaders });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'El archivo es muy grande. Máximo 10 MB.' }, { status: 400, headers: corsHeaders });
        }

        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo no válido. Usa PDF, JPG o PNG.' }, { status: 400, headers: corsHeaders });
        }

        console.log(`📋 Subiendo certificado vet. | Miembro: ${memberId} | Mascota: ${petIndex}`);

        const fileExt   = file.name.split('.').pop() || 'pdf';
        const timestamp = Date.now();
        const rand      = Math.random().toString(36).substring(2, 8);
        const fileName  = `${memberId}/pet-${petIndex}/${timestamp}_${rand}.${fileExt}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('❌ Error subiendo certificado:', error);
            return NextResponse.json({ error: 'Error al subir el certificado' }, { status: 500, headers: corsHeaders });
        }

        // El bucket es privado; generamos una URL firmada de 10 años (~87600 horas)
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .createSignedUrl(data.path, 60 * 60 * 24 * 365 * 10);

        if (signedError || !signedData) {
            console.error('❌ Error generando URL firmada:', signedError);
            return NextResponse.json({ error: 'Error generando URL de acceso' }, { status: 500, headers: corsHeaders });
        }

        console.log(`✅ Certificado subido exitosamente: ${data.path}`);

        return NextResponse.json({
            success: true,
            url: signedData.signedUrl,
            path: data.path,
        }, { headers: corsHeaders });

    } catch (err: any) {
        console.error('❌ Error en /api/upload/vet-certificate:', err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
