import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API para cancelar la cuenta de un Centro de Bienestar (Protocolo de salida)
 * Mantiene los datos pero cambia el estado a 'cancelled'
 */
export async function POST(request: NextRequest) {
    try {
        const { memberstack_id, reason } = await request.json();

        if (!memberstack_id) {
            return NextResponse.json(
                { success: false, error: 'Memberstack ID es requerido' },
                { status: 400 }
            );
        }

        // Actualizar estado a cancelled y guardar motivo
        const { data, error } = await supabaseAdmin
            .from('wellness_centers')
            .update({ 
                status: 'cancelled',
                cancellation_reason: reason || 'No especificado',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('memberstack_id', memberstack_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Cuenta cancelada exitosamente',
            data
        });

    } catch (error: any) {
        console.error('❌ Error in cancel API:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno al procesar la cancelación' },
            { status: 500 }
        );
    }
}
