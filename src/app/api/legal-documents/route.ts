import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET: Fetch all active legal documents (public)
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('legal_documents')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, documents: data });
    } catch (error: any) {
        console.error('Error fetching legal documents:', error);
        return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
    }
}

// POST: Upload new legal document (admin only)
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        if (!file || !title) {
            return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
        }

        // Upload file to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('legal-documents')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('legal-documents')
            .getPublicUrl(fileName);

        // Get current max order
        const { data: maxOrderRow } = await supabaseAdmin
            .from('legal_documents')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = (maxOrderRow?.display_order || 0) + 1;

        // Insert record
        const { data, error: insertError } = await supabaseAdmin
            .from('legal_documents')
            .insert({
                title,
                description: description || null,
                file_url: urlData.publicUrl,
                file_name: file.name,
                display_order: nextOrder,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, document: data });
    } catch (error: any) {
        console.error('Error creating legal document:', error);
        return NextResponse.json({ error: 'Error creating document' }, { status: 500 });
    }
}
