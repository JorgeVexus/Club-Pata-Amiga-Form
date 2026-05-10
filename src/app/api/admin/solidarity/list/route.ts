import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminUser(request);
        if (!admin || (admin as any).isUnauthorized) return unauthorizedResponse();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const petId = searchParams.get('petId');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('solidarity_requests')
            .select(`
                *,
                user:users(first_name, last_name, email),
                pet:pets(name, primary_photo_url),
                documents:solidarity_documents(*)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (petId) {
            query = query.eq('pet_id', petId);
        }

        const { data: requests, error } = await query;

        if (error) throw error;

        // Mapear los datos para aplanar la estructura y que el frontend los consuma correctamente
        const mappedRequests = (requests || []).map((req: any) => ({
            ...req,
            user_name: req.user ? `${req.user.first_name} ${req.user.last_name || ''}`.trim() : 'Usuario no encontrado',
            user_email: req.user?.email || '',
            pet_name: req.pet?.name || 'Mascota no encontrada'
        }));

        return NextResponse.json({
            success: true,
            requests: mappedRequests,
            count: mappedRequests.length
        });

    } catch (error: any) {
        console.error('Error en /api/admin/solidarity/list:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
