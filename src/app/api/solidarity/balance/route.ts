import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateSolidarityBalances } from '@/utils/solidarity-balance';
import { getSolidarityCycle } from '@/utils/solidarity-cycle';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const petId = searchParams.get('petId');
        const memberstackId = searchParams.get('memberstackId');

        if (!petId && !memberstackId) {
            return NextResponse.json({ error: 'petId o memberstackId es requerido' }, { status: 400, headers: corsHeaders });
        }

        let userId: string | null = null;
        let resolvedMemberstackId: string | null = memberstackId;
        let paymentAnchor: string | null = null;

        if (memberstackId) {
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, memberstack_id, first_payment_at, payment_completed_at, created_at')
                .eq('memberstack_id', memberstackId)
                .single();

            if (userError || !user) {
                return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers: corsHeaders });
            }

            userId = user.id;
            resolvedMemberstackId = user.memberstack_id;
            paymentAnchor = user.first_payment_at || user.payment_completed_at || user.created_at;
        }

        if (petId) {
            const { data: pet, error: petError } = await supabaseAdmin
                .from('pets')
                .select('owner_id')
                .eq('id', petId)
                .single();

            if (petError || !pet?.owner_id) {
                return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404, headers: corsHeaders });
            }

            if (userId && pet.owner_id !== userId) {
                return NextResponse.json({ error: 'La mascota no pertenece a esta membresía' }, { status: 403, headers: corsHeaders });
            }

            userId = userId || pet.owner_id;
        }

        if (!paymentAnchor) {
            const { data: owner, error: ownerError } = await supabaseAdmin
                .from('users')
                .select('first_payment_at, payment_completed_at, created_at')
                .eq('id', userId)
                .single();
            if (ownerError || !owner) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers: corsHeaders });
            paymentAnchor = owner.first_payment_at || owner.payment_completed_at || owner.created_at;
        }
        const cycle = getSolidarityCycle(paymentAnchor);

        const { data: requests, error } = await supabaseAdmin
            .from('solidarity_requests')
            .select('benefit_type, requested_amount, approved_amount, status')
            .eq('user_id', userId)
            .gte('created_at', cycle.start.toISOString())
            .lt('created_at', cycle.renewal.toISOString());

        if (error) throw error;

        return NextResponse.json({
            success: true,
            petId,
            memberstackId: resolvedMemberstackId,
            userId,
            year: cycle.renewal.getUTCFullYear(),
            cycleStart: cycle.start.toISOString(),
            renewalDate: cycle.renewal.toISOString(),
            balances: calculateSolidarityBalances(requests || []),
        }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Error en /api/solidarity/balance:', error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}
