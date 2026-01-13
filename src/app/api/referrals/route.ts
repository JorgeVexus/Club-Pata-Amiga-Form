import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// GET - Listar referidos (para admin o embajador)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ambassadorId = searchParams.get('ambassador_id');
        const status = searchParams.get('status');

        let query = supabase
            .from('referrals')
            .select(`
                *,
                ambassador:ambassadors (
                    first_name,
                    paternal_surname,
                    referral_code
                )
            `)
            .order('created_at', { ascending: false });

        if (ambassadorId) {
            query = query.eq('ambassador_id', ambassadorId);
        }

        if (status) {
            query = query.eq('commission_status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching referrals:', error);
            return NextResponse.json(
                { success: false, error: 'Error al obtener referidos' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            data: data || []
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Referrals GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// POST - Registrar nuevo referido
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            referral_code,
            referred_user_id,
            referred_user_name,
            referred_user_email,
            membership_plan,
            membership_amount
        } = body;

        if (!referral_code || !referred_user_id) {
            return NextResponse.json(
                { success: false, error: 'Faltan datos requeridos' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Buscar embajador por código
        const { data: ambassador, error: ambassadorError } = await supabase
            .from('ambassadors')
            .select('id, commission_percentage, status')
            .eq('referral_code', referral_code.toUpperCase())
            .single();

        if (ambassadorError || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Código de referido no válido' },
                { status: 400, headers: corsHeaders() }
            );
        }

        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'Este embajador no está activo' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Verificar que no se haya registrado ya este usuario
        const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_user_id', referred_user_id)
            .single();

        if (existingReferral) {
            return NextResponse.json(
                { success: false, error: 'Este usuario ya fue referido anteriormente' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Calcular comisión
        const commissionPercentage = ambassador.commission_percentage || 10;
        const amount = parseFloat(membership_amount) || 0;
        const commissionAmount = (amount * commissionPercentage) / 100;

        // Crear referido
        const { data: referral, error: createError } = await supabase
            .from('referrals')
            .insert({
                ambassador_id: ambassador.id,
                referral_code: referral_code.toUpperCase(),
                referred_user_id,
                referred_user_name: referred_user_name || null,
                referred_user_email: referred_user_email || null,
                membership_plan: membership_plan || null,
                membership_amount: amount,
                commission_percentage: commissionPercentage,
                commission_amount: commissionAmount,
                commission_status: 'pending'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating referral:', createError);
            return NextResponse.json(
                { success: false, error: 'Error al registrar referido' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // Actualizar pending_payout del embajador
        const { data: currentAmbassador } = await supabase
            .from('ambassadors')
            .select('pending_payout')
            .eq('id', ambassador.id)
            .single();

        const currentPending = currentAmbassador?.pending_payout || 0;
        await supabase
            .from('ambassadors')
            .update({ pending_payout: currentPending + commissionAmount })
            .eq('id', ambassador.id);


        return NextResponse.json({
            success: true,
            message: 'Referido registrado correctamente',
            data: referral
        }, { status: 201, headers: corsHeaders() });

    } catch (error) {
        console.error('Referrals POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
