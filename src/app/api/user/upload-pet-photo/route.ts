import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file || !userId) {
            return NextResponse.json({ error: 'Missing file or userId' }, { status: 400, headers: corsHeaders });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `pets/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
            .from('pet-photos')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('pet-photos')
            .getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: publicUrl }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
