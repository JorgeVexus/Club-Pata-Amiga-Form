import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

// PATCH - Actualizar estado de un pago (payout)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, payment_reference, notes, admin_id } = body;

        // 1. Obtener pago actual
        const { data: currentPayout, error: fetchError } = await supabase
            .from('ambassador_payouts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentPayout) {
            return NextResponse.json(
                { success: false, error: 'Pago no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // 2. Preparar actualización
        const updateData: any = {
            status: status || currentPayout.status,
            payment_reference: payment_reference || currentPayout.payment_reference,
            notes: notes || currentPayout.notes,
            updated_at: new Date().toISOString()
        };

        if (status === 'completed') {
            updateData.processed_at = new Date().toISOString();
            updateData.processed_by = admin_id || 'admin';
        }

        // 3. Ejecutar actualización
        const { data: updatedPayout, error: updateError } = await supabase
            .from('ambassador_payouts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                { success: false, error: 'Error al actualizar el pago' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 4. Si falló el pago, devolver el saldo al embajador
        if (status === 'failed' && currentPayout.status !== 'failed') {
            const { data: amb } = await supabase
                .from('ambassadors')
                .select('pending_payout')
                .eq('id', currentPayout.ambassador_id)
                .single();

            if (amb) {
                await supabase
                    .from('ambassadors')
                    .update({
                        pending_payout: (amb.pending_payout || 0) + currentPayout.amount
                    })
                    .eq('id', currentPayout.ambassador_id);
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedPayout
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Payout PATCH error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
