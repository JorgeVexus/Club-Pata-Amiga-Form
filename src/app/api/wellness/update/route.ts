import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';
import { WellnessCenterLocation } from '@/types/wellness.types';
import { wellnessService } from '@/services/wellness.service';

// Usar el cliente administrativo centralizado
const supabaseAdminClient = supabaseAdmin;

export async function POST(request: NextRequest) {
    // Verificar configuración
    if (!isSupabaseAdminConfigured() || !supabaseAdminClient) {
        console.error('❌ Supabase Admin not configured in /api/wellness/update');
        return NextResponse.json(
            { success: false, error: 'Servicio de base de datos no disponible' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { memberstack_id, locations, ...updateData } = body;
        const profileNotificationFields = [
            'establishment_name',
            'phone',
            'address',
            'lat',
            'lng',
            'locations',
            'promotion_details',
            'social_links',
            'logo_url'
        ];
        const shouldNotifyProfileUpdate = profileNotificationFields.some(field =>
            Object.prototype.hasOwnProperty.call(body, field)
        );

        if (!memberstack_id) {
            return NextResponse.json(
                { success: false, error: 'Memberstack ID es requerido' },
                { status: 400 }
            );
        }

        // 1. Obtener el centro actual
        const { data: center, error: fetchError } = await supabaseAdminClient
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

        if (Array.isArray(locations)) {
            const locationSync = await wellnessService.syncLocations(center.id, locations as WellnessCenterLocation[]);
            if (locationSync.error) {
                return NextResponse.json(
                    { success: false, error: 'Error al actualizar las sucursales' },
                    { status: 500 }
                );
            }
        }

        // 2. Actualizar datos en Supabase
        const { data: updated, error: updateError } = await supabaseAdminClient
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
            await supabaseAdminClient.from('notifications').insert({
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

        if (shouldNotifyProfileUpdate && updateData.status !== 'appealed') {
            await supabaseAdminClient.from('notifications').insert({
                user_id: 'admin',
                type: 'wellness_profile_updated',
                title: 'Centro actualizÃ³ su perfil',
                message: `${updated.establishment_name} actualizÃ³ datos de su perfil de centro.`,
                icon: '🏥',
                link: `/admin/dashboard?tab=wellness-center&wellnessCenterId=${updated.id}`,
                data: { wellness_center_id: updated.id },
                metadata: { wellnessCenterId: updated.id },
                is_read: false
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                ...updated,
                locations: Array.isArray(locations)
                    ? await wellnessService.getLocations(updated.id)
                    : undefined
            }
        });

    } catch (error: any) {
        console.error('❌ Internal Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
