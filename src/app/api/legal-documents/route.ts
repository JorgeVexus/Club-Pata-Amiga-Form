import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET: Fetch legal documents (public)
// Query params: ?audience=members|ambassadors (default returns all active)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const audience = searchParams.get('audience'); // 'members' | 'ambassadors'

        let query = supabaseAdmin
            .from('legal_documents')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        // Filter by audience if specified
        if (audience) {
            query = query.or(`target_audience.eq.${audience},target_audience.eq.both`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, documents: data });
    } catch (error: any) {
        console.error('Error fetching legal documents:', error);
        return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
    }
}

// Helper function to sanitize filename for Supabase Storage
function sanitizeFileName(fileName: string): string {
    return fileName
        // Normalize to decomposed form (separate base characters from diacritics)
        .normalize('NFD')
        // Remove diacritics (tildes)
        .replace(/[\u0300-\u036f]/g, '')
        // Replace spaces with underscores
        .replace(/\s+/g, '_')
        // Remove any character that is not alphanumeric, underscore, hyphen, or dot
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        // Replace multiple underscores with single
        .replace(/_+/g, '_')
        // Lowercase for consistency
        .toLowerCase();
}

// POST: Upload new legal document (admin only)
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const targetAudience = (formData.get('target_audience') as string) || 'both';

        if (!file || !title) {
            return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
        }

        // Validate target_audience
        const validAudiences = ['members', 'ambassadors', 'both'];
        if (!validAudiences.includes(targetAudience)) {
            return NextResponse.json({ error: 'Invalid target_audience. Must be: members, ambassadors, or both' }, { status: 400 });
        }

        // Sanitize filename for Supabase Storage (remove tildes, spaces, special chars)
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}_${sanitizedFileName}`;
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
                target_audience: targetAudience,
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
