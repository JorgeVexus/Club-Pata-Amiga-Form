import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';

// Usar el cliente administrativo centralizado
const supabaseAdminClient = supabaseAdmin;

// CORS headers para Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    // Verificar configuración
    if (!isSupabaseAdminConfigured() || !supabaseAdminClient) {
        console.error('❌ Supabase Admin not configured in /api/user/upload-pet-photo');
        return NextResponse.json(
            { error: 'Servicio de almacenamiento no disponible' }, 
            { status: 500, headers: corsHeaders }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file || !userId) {
            return NextResponse.json({ error: 'Missing file or userId' }, { status: 400, headers: corsHeaders });
        }

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo es muy grande. Máximo 10MB.' }, { status: 400, headers: corsHeaders });
        }

        // Validar tipo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no válido. Usa JPG, PNG, WebP o PDF.' }, { status: 400, headers: corsHeaders });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `pets/${fileName}`;

        const { data, error } = await supabaseAdminClient.storage
            .from('pet-photos')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabaseAdminClient.storage
            .from('pet-photos')
            .getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: publicUrl }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
