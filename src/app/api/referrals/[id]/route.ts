import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// PATCH - Actualizar referido (aprobar comisión, cambiar monto)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { commission_status, membership_amount, membership_plan } = body;

        // Obtener referido actual
        const { data: currentReferral, error: fetchError } = await supabase
            .from('referrals')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentReferral) {
            return NextResponse.json(
                { success: false, error: 'Referido no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        const updateData: any = {};

        if (commission_status) updateData.commission_status = commission_status;
        if (membership_plan) updateData.membership_plan = membership_plan;

        let newCommissionAmount = currentReferral.commission_amount;

        // Si se cambia el monto o se aprueba por primera vez con monto
        if (membership_amount !== undefined) {
            const amount = parseFloat(membership_amount);
            updateData.membership_amount = amount;

            // Obtener porcentaje de comisión del embajador
            const { data: ambassador } = await supabase
                .from('ambassadors')
                .select('commission_percentage')
                .eq('id', currentReferral.ambassador_id)
                .single();

            const percentage = ambassador?.commission_percentage || 10;
            newCommissionAmount = (amount * percentage) / 100;
            updateData.commission_amount = newCommissionAmount;
        }

        // Ejecutar actualización
        const { data: updatedReferral, error: updateError } = await supabase
            .from('referrals')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                { success: false, error: 'Error al actualizar referido' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // LÓGICA DE SALDOS DEL EMBAJADOR
        // Solo actualizamos saldos si el referido pasa a 'approved' o si ya estaba 'approved' y cambió el monto

        const wasPending = currentReferral.commission_status === 'pending';
        const isNowApproved = commission_status === 'approved' || (currentReferral.commission_status === 'approved' && !commission_status);
        const amountChanged = membership_amount !== undefined;

        if ((wasPending && commission_status === 'approved') || (currentReferral.commission_status === 'approved' && amountChanged)) {

            let difference = 0;
            if (wasPending && commission_status === 'approved') {
                // De nada a algo
                difference = newCommissionAmount;
            } else if (currentReferral.commission_status === 'approved' && amountChanged) {
                // Ajuste de monto
                difference = newCommissionAmount - (currentReferral.commission_amount || 0);
            }

            if (difference !== 0) {
                // Obtener saldo actual
                const { data: amb } = await supabase
                    .from('ambassadors')
                    .select('total_earnings, pending_payout')
                    .eq('id', currentReferral.ambassador_id)
                    .single();

                if (amb) {
                    await supabase
                        .from('ambassadors')
                        .update({
                            total_earnings: (amb.total_earnings || 0) + difference,
                            pending_payout: (amb.pending_payout || 0) + difference
                        })
                        .eq('id', currentReferral.ambassador_id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedReferral
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Referral PATCH error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
