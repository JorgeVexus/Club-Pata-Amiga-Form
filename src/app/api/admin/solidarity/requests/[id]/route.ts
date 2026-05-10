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
                user:users(*),
                documents:solidarity_documents(*)
            `)
            .eq('id', id)
            .single();

        if (error || !solidarityRequest) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        // 2. Generar URLs firmadas para los documentos (bucket privado)
        if (solidarityRequest.documents && solidarityRequest.documents.length > 0) {
            solidarityRequest.documents = await Promise.all(solidarityRequest.documents.map(async (doc: any) => {
                const { data } = await supabaseAdmin.storage
                    .from('solidarity-documents')
                    .createSignedUrl(doc.file_path, 3600); // URL válida por 1 hora
                
                return {
                    ...doc,
                    file_url: data?.signedUrl || doc.file_url
                };
            }));
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
