import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * GET /api/ambassador-materials
 * Lista pública (sin auth) de materiales activos para el widget del embajador en Webflow.
 * Query opcional: ?type=image|pdf|video|other
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        let query = supabaseAdmin
            .from('ambassador_materials')
            .select('id, title, description, file_url, file_name, file_type, file_size, news_date, created_at')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('file_type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, materials: data || [] }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error fetching public ambassador materials:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener materiales' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
