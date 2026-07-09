import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const VALID_FILE_TYPES = ['image', 'pdf', 'video', 'other'];

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-memberstack-id',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET: Listar todos los materiales (admin, incluye inactivos)
export async function GET(request: NextRequest) {
    const adminUser = await getAdminUser(request);
    if (!adminUser || (adminUser as any).isUnauthorized) return unauthorizedResponse();

    try {
        const { data, error } = await supabaseAdmin
            .from('ambassador_materials')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, materials: data || [] }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error fetching ambassador materials:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener materiales' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST: Registrar un material ya subido a Storage (ver /upload-url para el paso previo)
export async function POST(request: NextRequest) {
    const adminUser = await getAdminUser(request);
    if (!adminUser || (adminUser as any).isUnauthorized) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { title, description, file_url, file_name, file_type, file_size } = body;

        if (!title || !file_url || !file_name) {
            return NextResponse.json(
                { success: false, error: 'title, file_url y file_name son requeridos' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const resolvedType = VALID_FILE_TYPES.includes(file_type) ? file_type : 'other';

        const { data: maxOrderRow } = await supabaseAdmin
            .from('ambassador_materials')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextOrder = (maxOrderRow?.display_order || 0) + 1;

        const { data, error } = await supabaseAdmin
            .from('ambassador_materials')
            .insert({
                title,
                description: description || null,
                file_url,
                file_name,
                file_type: resolvedType,
                file_size: file_size || null,
                display_order: nextOrder,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, material: data }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error creating ambassador material:', error);
        return NextResponse.json(
            { success: false, error: 'Error al registrar el material' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
