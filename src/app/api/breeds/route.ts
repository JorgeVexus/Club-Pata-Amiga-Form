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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'perro' o 'gato'

        console.log(`📡 GET /api/breeds - Filtrando por tipo: ${type || 'todos'}`);

        let query = supabaseAdmin
            .from('breeds')
            .select('name, type, has_genetic_issues, warning_message, max_age')
            .order('name');

        if (type && (type === 'perro' || type === 'gato')) {
            query = query.eq('type', type);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Error de Supabase al consultar razas:', error);
            throw error;
        }

        console.log(`✅ Se encontraron ${data?.length || 0} razas.`);

        return NextResponse.json({
            success: true,
            breeds: data || [],
            count: data?.length || 0
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('❌ Error en /api/breeds:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            breeds: []
        }, { status: 500, headers: corsHeaders });
    }
}
