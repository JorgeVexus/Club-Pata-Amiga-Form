import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ambassadorCorsHeaders, getAuthenticatedAmbassador } from '@/lib/ambassador-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'ambassador-photos';

export async function OPTIONS() {
    return NextResponse.json({}, { headers: ambassadorCorsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const ambassadorIdRaw = formData.get('ambassadorId') as string | null;
        const ambassadorId = ambassadorIdRaw?.trim();

        if (!file || !ambassadorId) {
            return NextResponse.json({ success: false, error: 'file y ambassadorId son requeridos' }, { status: 400, headers: ambassadorCorsHeaders });
        }

        const auth = await getAuthenticatedAmbassador(request, ambassadorId);
        if (!auth.ok) return auth.response;

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ success: false, error: 'Solo se aceptan imágenes' }, { status: 400, headers: ambassadorCorsHeaders });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'La imagen no puede superar 5MB' }, { status: 400, headers: ambassadorCorsHeaders });
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${ambassadorId}/profile.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('[UPLOAD-AMBASSADOR-PHOTO] Storage error:', uploadError);
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500, headers: ambassadorCorsHeaders });
        }

        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
        const publicUrl = urlData.publicUrl;

        const { error: dbError } = await supabaseAdmin
            .from('ambassadors')
            .update({ profile_photo_url: publicUrl })
            .eq('id', ambassadorId);

        if (dbError) {
            console.error('[UPLOAD-AMBASSADOR-PHOTO] DB Update error:', dbError);
        }

        return NextResponse.json({ success: true, url: publicUrl }, { headers: ambassadorCorsHeaders });

    } catch (e: any) {
        console.error('[UPLOAD-AMBASSADOR-PHOTO] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: ambassadorCorsHeaders });
    }
}
