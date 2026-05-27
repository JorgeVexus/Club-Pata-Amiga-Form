import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');
        const email = searchParams.get('email');

        if (!memberstackId && !email) {
            return NextResponse.json({ success: false, error: 'Se requiere memberstackId o email' }, { status: 400 });
        }

        console.log(`[PROFILE GET] Buscando usuario. msId: ${memberstackId}, email: ${email}`);

        let query = supabaseAdmin
            .from('users')
            .select([
                'id', 'memberstack_id', 'first_name', 'last_name', 'mother_last_name',
                'email', 'phone', 'address', 'colony',
                'city', 'state', 'postal_code', 'birth_date',
                'membership_status', 'created_at',
                'curp', 'gender'
            ].join(','));

        if (memberstackId) {
            query = query.eq('memberstack_id', memberstackId);
        } else if (email) {
            query = query.eq('email', email.toLowerCase().trim());
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('[PROFILE GET] Supabase error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!data) {
            console.warn(`[PROFILE GET] Usuario no encontrado: ${memberstackId || email}`);
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Fetch documents for this user
        const { data: docsData } = await supabaseAdmin
            .from('documents')
            .select('document_type, file_path')
            .eq('user_id', (data as any).id);

        let ine_front_url = '';
        let ine_back_url = '';
        let proof_of_address_url = '';

        if (docsData) {
            for (const doc of docsData) {
                // Get public URLs using the correct bucket
                let bucket = 'ine-documents';
                if (doc.document_type === 'proof_of_address') bucket = 'proof-of-address';
                
                const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(doc.file_path);
                
                if (doc.document_type === 'ine_front') ine_front_url = urlData.publicUrl;
                if (doc.document_type === 'ine_back') ine_back_url = urlData.publicUrl;
                if (doc.document_type === 'proof_of_address') proof_of_address_url = urlData.publicUrl;
            }
        }

        // Add document URLs back to the data object so the widget sees them as expected
        const enrichedData = {
            ...(data as any),
            ine_front_url,
            ine_back_url,
            proof_of_address_url
        };

        console.log(`[PROFILE GET] Datos recuperados para ${(data as any).email}. ID Supabase: ${(data as any).id}`);
        return NextResponse.json({ success: true, user: enrichedData });

    } catch (e: any) {
        console.error('[PROFILE GET] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
