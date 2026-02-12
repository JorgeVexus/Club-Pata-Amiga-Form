import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// PATCH: Update document (title, description, order, is_active)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { title, description, display_order, is_active } = body;

        const updates: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (display_order !== undefined) updates.display_order = display_order;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data, error } = await supabaseAdmin
            .from('legal_documents')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, document: data });
    } catch (error: any) {
        console.error('Error updating document:', error);
        return NextResponse.json({ error: 'Error updating document' }, { status: 500 });
    }
}

// DELETE: Remove document and its file from storage
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Get file info first
        const { data: doc } = await supabaseAdmin
            .from('legal_documents')
            .select('file_url, file_name')
            .eq('id', params.id)
            .single();

        // Delete from DB
        const { error: deleteError } = await supabaseAdmin
            .from('legal_documents')
            .delete()
            .eq('id', params.id);

        if (deleteError) throw deleteError;

        // Try to delete file from storage (best effort)
        if (doc?.file_url) {
            const fileName = doc.file_url.split('/').pop();
            if (fileName) {
                await supabaseAdmin.storage
                    .from('legal-documents')
                    .remove([fileName]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: 'Error deleting document' }, { status: 500 });
    }
}
