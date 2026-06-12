import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId, phoneNumber } = body;

        if (!memberstackId) {
            return NextResponse.json(
                { success: false, error: 'memberstackId es requerido' },
                { status: 400 }
            );
        }

        // Verificar configuración
        if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
            console.error('❌ Supabase Admin not configured in /api/user/emergency');
            return NextResponse.json(
                { success: false, error: 'Servicio de base de datos no disponible' },
                { status: 500 }
            );
        }

        // 1. Verificar que el usuario existe y tiene membresía activa
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, memberstack_id, email, approval_status')
            .eq('memberstack_id', memberstackId)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Verificar membresía activa (approval_status approve)
        if (user.approval_status !== 'approved') {
            return NextResponse.json(
                { success: false, error: 'Membresía no activa' },
                { status: 403 }
            );
        }

        // 2. Registrar el evento de emergencia
        const { error: insertError } = await supabaseAdmin
            .from('emergency_logs')
            .insert({
                memberstack_id: memberstackId,
                user_id: user.id,
                user_email: user.email,
                phone_number: phoneNumber,
                triggered_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('[EMERGENCY] Error guardando log:', insertError);
            return NextResponse.json(
                { success: false, error: 'Error guardando registro' },
                { status: 500 }
            );
        }

        console.log(`[EMERGENCY] Botón activado por miembro ${memberstackId} (${user.email})`);

        return NextResponse.json({
            success: true,
            message: 'Emergencia registrada correctamente'
        });

    } catch (error: any) {
        console.error('[EMERGENCY] Error inesperado:', error);
        return NextResponse.json(
            { success: false, error: 'Error procesando la solicitud' },
            { status: 500 }
        );
    }
}