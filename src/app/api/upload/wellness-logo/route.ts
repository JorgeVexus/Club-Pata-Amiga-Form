import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'wellness-logos';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const memberstackIdRaw = formData.get('memberstackId') as string | null;
        const memberstackId = memberstackIdRaw?.trim();

        if (!file || !memberstackId) {
            return NextResponse.json({ success: false, error: 'file y memberstackId son requeridos' }, { status: 400 });
        }

        // Validar tipo y tamaño
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ success: false, error: 'Solo se aceptan imágenes' }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'La imagen no puede superar 5MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${memberstackId}/logo.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Subir a Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true, // Reemplazar si ya existe
            });

        if (uploadError) {
            console.error('[UPLOAD-WELLNESS-LOGO] Storage error:', uploadError);
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
        const publicUrl = urlData.publicUrl;

        // Guardar URL en tabla wellness_centers
        const { data: updatedCenter, error: dbError } = await supabaseAdmin
            .from('wellness_centers')
            .update({ logo_url: publicUrl })
            .eq('memberstack_id', memberstackId)
            .select()
            .maybeSingle();

        if (dbError) {
            console.error('[UPLOAD-WELLNESS-LOGO] DB Update error:', dbError);
        } else if (!updatedCenter) {
            console.warn(`[UPLOAD-WELLNESS-LOGO] No se encontró centro para actualizar: ${memberstackId}`);
        }

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (e: any) {
        console.error('[UPLOAD-WELLNESS-LOGO] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
