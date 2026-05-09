import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: solidarityRequest, error } = await supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                pet:pets(*),
                user:users(*)
            `)
            .eq('id', id)
            .single();

        if (error || !solidarityRequest) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            request: solidarityRequest
        });

    } catch (error: any) {
        console.error('Error fetching admin solidarity request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
