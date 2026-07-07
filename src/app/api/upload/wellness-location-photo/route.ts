import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'wellness-location-photos';

function sanitizeSegment(value: string) {
    return value.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80);
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const memberstackIdRaw = formData.get('memberstackId') as string | null;
        const locationKeyRaw = formData.get('locationKey') as string | null;
        const memberstackId = memberstackIdRaw?.trim();
        const locationKey = sanitizeSegment(locationKeyRaw?.trim() || 'main');

        if (!file || !memberstackId) {
            return NextResponse.json({ success: false, error: 'file y memberstackId son requeridos' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ success: false, error: 'Solo se aceptan imagenes' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'La imagen no puede superar 5MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${sanitizeSegment(memberstackId)}/${locationKey}/${Date.now()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[UPLOAD-WELLNESS-LOCATION-PHOTO] Storage error:', uploadError);
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);

        return NextResponse.json({ success: true, url: urlData.publicUrl });
    } catch (e: any) {
        console.error('[UPLOAD-WELLNESS-LOCATION-PHOTO] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
