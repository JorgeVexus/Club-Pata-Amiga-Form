import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'ambassador-materials';

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-memberstack-id',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

// Sanitiza el nombre de archivo para Supabase Storage (sin tildes, espacios ni caracteres especiales)
function sanitizeFileName(fileName: string): string {
    return fileName
        .normalize('NFD')
        .replace(DIACRITICS_REGEX, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        .replace(/_+/g, '_')
        .toLowerCase();
}

/**
 * POST /api/admin/ambassador-materials/upload-url
 * Genera una URL firmada para que el navegador del admin suba el archivo
 * DIRECTO a Supabase Storage, sin pasar por el servidor de Next.js
 * (necesario para soportar videos de varios MB sin chocar con el límite
 * de tamaño de las funciones serverless de Vercel).
 */
export async function POST(request: NextRequest) {
    const adminUser = await getAdminUser(request);
    if (!adminUser || (adminUser as any).isUnauthorized) return unauthorizedResponse();

    try {
        const { fileName } = await request.json();

        if (!fileName) {
            return NextResponse.json(
                { success: false, error: 'fileName es requerido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const sanitized = sanitizeFileName(fileName);
        const path = `materials/${Date.now()}_${sanitized}`;

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUploadUrl(path);

        if (error || !data) {
            console.error('❌ Error creando signed upload URL:', error);
            return NextResponse.json(
                { success: false, error: 'No se pudo generar la URL de subida' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
        }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error en upload-url:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
