/**
 * API Route: /api/user/appeal
 * Permite a un usuario apelar un rechazo
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitAppeal } from '@/services/memberstack-admin.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberId, appealMessage } = body;

        // Validar datos
        if (!memberId) {
            return NextResponse.json(
                { error: 'ID de miembro requerido' },
                { status: 400 }
            );
        }

        if (!appealMessage || appealMessage.trim().length === 0) {
            return NextResponse.json(
                { error: 'El mensaje de apelación es obligatorio' },
                { status: 400 }
            );
        }

        if (appealMessage.length < 20) {
            return NextResponse.json(
                { error: 'El mensaje debe tener al menos 20 caracteres' },
                { status: 400 }
            );
        }

        console.log(`📧 Procesando apelación de miembro ${memberId}...`);

        // Registrar apelación en Memberstack
        const result = await submitAppeal(memberId, appealMessage);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // TODO: Enviar email al admin notificando la apelación
        // await sendAppealNotificationToAdmin(memberId, appealMessage);

        // TODO: Enviar email de confirmación al usuario
        // await sendAppealConfirmationEmail(result.data.auth.email);

        console.log(`✅ Apelación registrada exitosamente`);

        return NextResponse.json({
            success: true,
            message: 'Apelación enviada exitosamente. Será revisada en 24-48 horas.',
        });

    } catch (error: any) {
        console.error('Error procesando apelación:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
