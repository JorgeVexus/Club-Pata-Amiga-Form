/**
 * API Route: /api/user/appeal
 * Permite a un usuario apelar un rechazo
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitAppeal } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con Service Role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, appealMessage } = body;

        // Validar datos
        if (!memberId || !appealMessage?.trim()) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        console.log(`📧 Procesando apelación de miembro ${memberId}...`);

        // 1. Registrar apelación en Memberstack (Estado: appealed)
        const result = await submitAppeal(memberId, appealMessage);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // 2. Actualizar usuario en Supabase
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({
                last_appeal_message: appealMessage,
                membership_status: 'appealed' // Sincronizamos el estado
            })
            .eq('memberstack_id', memberId);

        if (userError) console.error('Error actualizando usuario en Supabase:', userError);

        // 3. Crear log de apelación
        const { error: logError } = await supabaseAdmin
            .from('appeal_logs')
            .insert({
                user_id: memberId,
                type: 'user_appeal',
                message: appealMessage,
                created_at: new Date().toISOString()
            });

        if (logError) console.error('Error creando log de apelación:', logError);

        console.log(`✅ Apelación registrada y logueada exitosamente`);

        return NextResponse.json({
            success: true,
            message: 'Tu apelación ha sido enviada. El equipo de Club Pata Amiga la revisará pronto.',
        });

    } catch (error: any) {
        console.error('Error procesando apelación:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
