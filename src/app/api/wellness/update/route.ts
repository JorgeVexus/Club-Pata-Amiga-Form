import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WellnessCenterComplementaryData } from '@/types/wellness.types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstack_id, ...updateData } = body;

        if (!memberstack_id) {
            return NextResponse.json(
                { success: false, error: 'Memberstack ID es requerido' },
                { status: 400 }
            );
        }

        // 1. Obtener el centro actual
        const { data: center, error: fetchError } = await supabase
            .from('wellness_centers')
            .select('id, status')
            .eq('memberstack_id', memberstack_id)
            .single();

        if (fetchError || !center) {
            return NextResponse.json(
                { success: false, error: 'Centro de bienestar no encontrado' },
                { status: 404 }
            );
        }

        // Si el estado es cancelled, bloquear actualizaciones a menos que sea para reactivar (pero eso se manejaría diferente)
        if (center.status === 'cancelled') {
            return NextResponse.json(
                { success: false, error: 'La cuenta está cancelada. Contacta a soporte.' },
                { status: 403 }
            );
        }

        // 2. Actualizar datos en Supabase
        const { data: updated, error: updateError } = await supabase
            .from('wellness_centers')
            .update(updateData)
            .eq('memberstack_id', memberstack_id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Update Error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Error al actualizar los datos' },
                { status: 500 }
            );
        }

        // 3. Notificación para Admin si es una apelación
        if (updateData.status === 'appealed') {
            await supabase.from('notifications').insert({
                user_id: 'admin',
                type: 'wellness_appeal',
                title: 'Nueva Apelación de Centro',
                message: `${updated.establishment_name} ha enviado una apelación tras ser rechazado.`,
                icon: '⚖️',
                link: '/admin/dashboard/wellness',
                data: { wellness_center_id: updated.id },
                is_read: false
            });
        }

        return NextResponse.json({
            success: true,
            data: updated
        });

    } catch (error: any) {
        console.error('❌ Internal Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
