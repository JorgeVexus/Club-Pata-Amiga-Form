import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSolidarityPetLifecycleSummary } from '@/utils/pet-lifecycle';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const memberstackId = searchParams.get('memberstackId');

        if (!memberstackId) {
            return NextResponse.json({ error: 'memberstackId es requerido' }, { status: 400, headers: corsHeaders });
        }

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('memberstack_id', memberstackId)
            .single();

        if (userError || !user) {
            console.error('Error resolviendo usuario:', userError);
            return NextResponse.json({ error: 'Usuario no encontrado en Supabase' }, { status: 404, headers: corsHeaders });
        }

        const internalUserId = user.id;

        const { data: pets, error: petsError } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('owner_id', internalUserId);

        if (petsError) throw petsError;

        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', internalUserId)
            .single();

        let petUnsubscriptions: Record<string, unknown>[] = [];
        try {
            const { data: unsubs, error: unsubsError } = await supabaseAdmin
                .from('pet_unsubscriptions')
                .select('id, pet_id, pet_index, pet_name, reason, description, status, requested_at, reviewed_at, created_at')
                .eq('memberstack_id', memberstackId)
                .order('created_at', { ascending: false });

            if (unsubsError) {
                const { data: fallbackUnsubs } = await supabaseAdmin
                    .from('pet_unsubscriptions')
                    .select('pet_index, pet_name, reason, description, created_at')
                    .eq('memberstack_id', memberstackId)
                    .order('created_at', { ascending: false });
                petUnsubscriptions = fallbackUnsubs || [];
            } else {
                petUnsubscriptions = unsubs || [];
            }
        } catch (error) {
            console.warn('No se pudo consultar pet_unsubscriptions para lifecycle:', error);
        }

        const lifecycleSummary = getSolidarityPetLifecycleSummary(pets || [], {}, petUnsubscriptions);

        const { data: requests, error: requestsError } = await supabaseAdmin
            .from('solidarity_requests')
            .select('status')
            .eq('user_id', internalUserId);

        if (requestsError) throw requestsError;

        const totalRequests = requests?.length || 0;
        const inProcessRequests = requests?.filter(r =>
            ['new', 'in_review', 'needs_info'].includes(r.status)
        ).length || 0;

        return NextResponse.json({
            success: true,
            user: userData,
            pets: lifecycleSummary.pets,
            stats: {
                active: lifecycleSummary.activePets,
                pending: lifecycleSummary.pendingPets,
                total: totalRequests,
                processed: inProcessRequests
            }
        }, { headers: corsHeaders });

    } catch (error: unknown) {
        console.error('Error en /api/solidarity/stats:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
    }
}
