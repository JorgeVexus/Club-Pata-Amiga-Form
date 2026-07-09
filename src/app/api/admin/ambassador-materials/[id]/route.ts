import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = 'ambassador-materials';

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-memberstack-id',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// PATCH: Actualizar título, descripción, orden o estado activo
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminUser = await getAdminUser(request);
    if (!adminUser || (adminUser as any).isUnauthorized) return unauthorizedResponse();

    try {
        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description || null;
        if (body.is_active !== undefined) updateData.is_active = !!body.is_active;
        if (body.display_order !== undefined) updateData.display_order = Number(body.display_order) || 0;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('ambassador_materials')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, material: data }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error updating ambassador material:', error);
        return NextResponse.json(
            { success: false, error: 'Error al actualizar el material' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// DELETE: Eliminar el registro y, en la medida de lo posible, el archivo en Storage
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminUser = await getAdminUser(request);
    if (!adminUser || (adminUser as any).isUnauthorized) return unauthorizedResponse();

    try {
        const { id } = await params;

        const { data: material } = await supabaseAdmin
            .from('ambassador_materials')
            .select('file_url')
            .eq('id', id)
            .maybeSingle();

        const { error: deleteError } = await supabaseAdmin
            .from('ambassador_materials')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        if (material?.file_url) {
            try {
                const marker = `/object/public/${BUCKET}/`;
                const idx = material.file_url.indexOf(marker);
                if (idx > -1) {
                    const path = decodeURIComponent(material.file_url.slice(idx + marker.length));
                    await supabaseAdmin.storage.from(BUCKET).remove([path]);
                }
            } catch (storageError) {
                console.warn('⚠️ No se pudo borrar el archivo en Storage (no crítico):', storageError);
            }
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders() });
    } catch (error: any) {
        console.error('❌ Error deleting ambassador material:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar el material' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
