import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API para subir evidencia de servicios de Centros de Bienestar
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const appointmentId = formData.get('appointmentId') as string;
        const memberstackId = formData.get('memberstackId') as string;

        if (!file || !appointmentId || !memberstackId) {
            return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
        }

        // 1. Validar propiedad de la cita
        const { data: appointment, error: authError } = await supabaseAdmin
            .from('wellness_center_appointments')
            .select('id, wellness_center_id')
            .eq('id', appointmentId)
            .single();

        if (authError || !appointment) {
            return NextResponse.json({ success: false, error: 'Cita no encontrada' }, { status: 404 });
        }

        // Validar que el centro sea el dueño (simplificado por ahora, idealmente verificar memberstack_id -> wellness_center_id)

        // 2. Subir a Supabase Storage (bucket vet-certificates o uno nuevo)
        const fileExt = file.name.split('.').pop();
        const fileName = `${appointmentId}_${Date.now()}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('vet-certificates') // Reutilizando bucket privado para documentos sensibles
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Obtener URL (es privado, así que guardamos el path o generamos signed URL luego)
        // Por ahora guardamos el path en wellness_center_appointments
        const { error: updateError } = await supabaseAdmin
            .from('wellness_center_appointments')
            .update({ 
                evidence_url: filePath,
                status: 'completed' 
            })
            .eq('id', appointmentId);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            filePath
        });

    } catch (error: any) {
        console.error('❌ Upload Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
