import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'profile-photos';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const memberstackId = formData.get('memberstackId') as string | null;

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
        const filename = `${memberstackId}/profile.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Subir a Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true, // Reemplazar si ya existe
            });

        if (uploadError) {
            console.error('[UPLOAD-PROFILE] Storage error:', uploadError);
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
        const publicUrl = urlData.publicUrl;

        // Guardar URL en tabla users
        await supabaseAdmin
            .from('users')
            .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('memberstack_id', memberstackId);

        console.log(`[UPLOAD-PROFILE] Foto subida para ${memberstackId}: ${publicUrl}`);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (e: any) {
        console.error('[UPLOAD-PROFILE] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
