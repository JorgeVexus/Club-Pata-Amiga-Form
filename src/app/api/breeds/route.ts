import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// CORS headers para Webflow
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'perro' o 'gato'

        let query = supabase
            .from('breeds')
            .select('name, type, has_genetic_issues, warning_message, max_age')
            .order('name');

        if (type && (type === 'perro' || type === 'gato')) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            breeds: data || []
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Error fetching breeds:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            breeds: []
        }, { status: 500, headers: corsHeaders });
    }
}
