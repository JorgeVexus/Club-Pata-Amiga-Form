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

// POST - Solicitar retiro
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Obtener datos actuales del embajador
        const { data: ambassador, error: fetchError } = await supabase
            .from('ambassadors')
            .select('pending_payout, status, email, first_name')
            .eq('id', id)
            .single();

        if (fetchError || !ambassador) {
            return NextResponse.json(
                { success: false, error: 'Embajador no encontrado' },
                { status: 404, headers: corsHeaders() }
            );
        }

        // 2. Validar estado y saldo
        if (ambassador.status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'Solo embajadores aprobados pueden solicitar retiros' },
                { status: 403, headers: corsHeaders() }
            );
        }

        const balance = ambassador.pending_payout || 0;
        if (balance <= 0) {
            return NextResponse.json(
                { success: false, error: 'No tienes saldo pendiente para retirar' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // 3. Crear el registro de pago (payout)
        const { data: payout, error: payoutError } = await supabase
            .from('ambassador_payouts')
            .insert({
                ambassador_id: id,
                amount: balance,
                status: 'pending',
                notes: 'Solicitud manual desde Dashboard de Embajador'
            })
            .select()
            .single();

        if (payoutError) {
            console.error('Error creating payout:', payoutError);
            return NextResponse.json(
                { success: false, error: 'Error al registrar la solicitud de retiro' },
                { status: 500, headers: corsHeaders() }
            );
        }

        // 4. Restar el saldo solicitado del embajador
        const { error: updateError } = await supabase
            .from('ambassadors')
            .update({ pending_payout: 0 }) // Ponemos a 0 el saldo pendiente
            .eq('id', id);

        if (updateError) {
            // Rollback manual (ejecutaría esto si fuera una transacción real)
            console.error('Error updating ambassador balance:', updateError);
        }

        // 5. Notificar al Admin (Opcional, pero recomendado)
        try {
            const { sendAdminEmail } = await import('@/app/actions/comm.actions');
            await sendAdminEmail({
                userId: id,
                to: 'finanzas@pataamiga.mx', // Cambiar al email real del admin financiero
                subject: `💰 Nueva Solicitud de Retiro: ${ambassador.first_name}`,
                content: `El embajador ${ambassador.first_name} (${ambassador.email}) ha solicitado un retiro de $${balance.toFixed(2)} MXN.\n\nPuedes procesar esta solicitud desde el panel de administración.`
            });
        } catch (notifError) {
            console.error('Error sending payout notification to admin:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Solicitud de retiro enviada correctamente',
            data: payout
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Payout POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// GET - Listar pagos del embajador
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('ambassador_payouts')
            .select('*')
            .eq('ambassador_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Error al obtener historial de pagos' },
                { status: 500, headers: corsHeaders() }
            );
        }

        return NextResponse.json({
            success: true,
            data: data || []
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Payout GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
