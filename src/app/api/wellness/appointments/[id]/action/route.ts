import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Acciones para citas de centros de bienestar (Aceptar, Rechazar, Completar)
 * POST /api/wellness/appointments/[id]/action
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { status, rejection_reason, rejection_details, evidence_url, memberstack_id } = body;

    if (!memberstack_id) {
        return NextResponse.json({ success: false, error: 'Memberstack ID requerido' }, { status: 401 });
    }

    try {
        // 1. Verificar que el centro de bienestar sea el dueño de la cita
        const { data: center, error: centerError } = await supabaseAdmin
            .from('wellness_centers')
            .select('id')
            .eq('memberstack_id', memberstack_id)
            .single();

        if (centerError || !center) {
            return NextResponse.json({ success: false, error: 'Centro de bienestar no encontrado' }, { status: 404 });
        }

        const { data: appointment, error: appointmentError } = await supabaseAdmin
            .from('wellness_center_appointments')
            .select('id, wellness_center_id')
            .eq('id', id)
            .single();

        if (appointmentError || !appointment) {
            return NextResponse.json({ success: false, error: 'Cita no encontrada' }, { status: 404 });
        }

        if (appointment.wellness_center_id !== center.id) {
            return NextResponse.json({ success: false, error: 'No tienes permiso para modificar esta cita' }, { status: 403 });
        }

        // 2. Actualizar la cita
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'rejected') {
            updateData.rejection_reason = rejection_reason;
            updateData.rejection_details = rejection_details;
        }

        if (status === 'completed' && evidence_url) {
            updateData.evidence_url = evidence_url;
        }

        const { error: updateError } = await supabaseAdmin
            .from('wellness_center_appointments')
            .update(updateData)
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: `Cita ${status} correctamente`
        });

    } catch (error: any) {
        console.error('❌ Error in appointment action:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
